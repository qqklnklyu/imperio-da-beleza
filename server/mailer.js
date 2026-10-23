const crypto = require("crypto");

const net = require("net");

const tls = require("tls");

const config = require("./config");

const TIMEOUT_MS = 15000;

function configured() {
    return Boolean(config.smtp.host && config.smtp.from);
}

function encodeHeader(value) {
    return `=?UTF-8?B?${Buffer.from(value, "utf8").toString("base64")}?=`;
}

function wrapBase64(value) {
    return Buffer.from(value, "utf8")
        .toString("base64")
        .replace(/(.{76})/g, "$1\r\n");
}

function buildMessage({ to, subject, text }) {
    const address = config.smtp.from.replace(/^.*<(.+)>$/, "$1");

    return [
        `From: ${config.smtp.from}`,
        `To: ${to}`,
        `Subject: ${encodeHeader(subject)}`,
        `Date: ${new Date().toUTCString()}`,
        `Message-ID: <${crypto.randomBytes(12).toString("hex")}@${address.split("@")[1] || "localhost"}>`,
        "MIME-Version: 1.0",
        "Content-Type: text/plain; charset=utf-8",
        "Content-Transfer-Encoding: base64",
        "",
        wrapBase64(text),
    ].join("\r\n");
}

function attach(socket) {
    const state = { buffer: "", error: null, wake: null };

    socket.setEncoding("utf8");

    socket.setTimeout(TIMEOUT_MS, () => socket.destroy(new Error("Tempo esgotado")));

    socket.on("data", (chunk) => {
        state.buffer += chunk;

        if (state.wake) state.wake();
    });

    socket.on("error", (error) => {
        state.error = error;

        if (state.wake) state.wake();
    });

    socket.on("close", () => {
        state.error = state.error || new Error("Conexão encerrada");

        if (state.wake) state.wake();
    });

    state.socket = socket;

    return state;
}

function readResponse(state) {
    return new Promise((resolve, reject) => {
        const check = () => {
            const lines = state.buffer.split("\r\n");

            for (let index = 0; index < lines.length - 1; index += 1) {
                if (/^\d{3} /.test(lines[index])) {
                    const text = lines.slice(0, index + 1).join("\r\n");

                    state.buffer = lines.slice(index + 1).join("\r\n");

                    state.wake = null;

                    return resolve({
                        code: Number(lines[index].slice(0, 3)),
                        text,
                    });
                }
            }

            if (state.error) {
                state.wake = null;

                reject(state.error);
            }
        };

        state.wake = check;

        check();
    });
}

async function command(state, line, expected) {
    if (line !== null) state.socket.write(line + "\r\n");

    const response = await readResponse(state);

    if (!expected.includes(response.code)) {
        throw new Error(`SMTP ${response.code}: ${response.text.split("\r\n").pop()}`);
    }

    return response;
}

function connect() {
    const { host, port, secure } = config.smtp;

    return new Promise((resolve, reject) => {
        const socket = secure
            ? tls.connect({ host, port, servername: host })
            : net.connect({ host, port });

        socket.once(secure ? "secureConnect" : "connect", () => resolve(socket));

        socket.once("error", reject);
    });
}

async function send({ to, subject, text }) {
    if (!configured()) throw new Error("Envio de e-mail não configurado");

    if (!/^[^\s@<>"',;]+@[^\s@<>"',;]+\.[^\s@<>"',;]+$/.test(to)) {
        throw new Error("Destinatário inválido");
    }

    const { host, user, pass, from } = config.smtp;

    let state = attach(await connect());

    let encrypted = config.smtp.secure;

    try {
        await command(state, null, [220]);

        let hello = await command(state, "EHLO localhost", [250]);

        if (!encrypted && /STARTTLS/i.test(hello.text)) {
            await command(state, "STARTTLS", [220]);

            state.socket.removeAllListeners();

            state = attach(tls.connect({ socket: state.socket, servername: host }));

            encrypted = true;

            hello = await command(state, "EHLO localhost", [250]);
        }

        if (user) {
            const local = ["127.0.0.1", "localhost"].includes(host);

            if (!encrypted && !local) {
                throw new Error("O servidor de e-mail não oferece conexão criptografada");
            }

            const plain = Buffer.from(`\0${user}\0${pass}`).toString("base64");

            await command(state, `AUTH PLAIN ${plain}`, [235]);
        }

        const sender = from.replace(/^.*<(.+)>$/, "$1");

        await command(state, `MAIL FROM:<${sender}>`, [250]);

        await command(state, `RCPT TO:<${to}>`, [250, 251]);

        await command(state, "DATA", [354]);

        state.socket.write(buildMessage({ to, subject, text }) + "\r\n.\r\n");

        await command(state, null, [250]);

        state.socket.write("QUIT\r\n");
    } finally {
        state.socket.end();
    }
}

module.exports = { configured, send };
