const http = require("http");

const fs = require("fs");

const path = require("path");

const config = require("./config");

const auth = require("./auth");

const mailer = require("./mailer");

const storage = require("./storage");

const { saveImage, cleanOrphans } = require("./uploads");

const {
    ValidationError,
    validateSite,
    validateClients,
} = require("./validation");

const MIME = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".jpg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".ico": "image/x-icon",
    ".woff2": "font/woff2",
};

const SECURITY_HEADERS = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "same-origin",
    "Content-Security-Policy":
        "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
};

const ADMIN_OPEN_FILES = [
    "/admin/login",
    "/admin/css/admin.css",
    "/admin/js/login.js",
    "/admin/js/recover.js",
];

function send(res, status, body, headers = {}) {
    res.writeHead(status, { ...SECURITY_HEADERS, ...headers });

    res.end(body);
}

function sendJson(res, status, data, headers = {}) {
    send(res, status, JSON.stringify(data), {
        "Content-Type": MIME[".json"],
        "Cache-Control": "no-store",
        ...headers,
    });
}

function clientIp(req) {
    const forwarded = String(req.headers["x-forwarded-for"] || "")
        .split(",")[0]
        .trim();

    return config.trustProxy && forwarded
        ? forwarded
        : req.socket.remoteAddress;
}

function secureRequest(req) {
    return req.headers["x-forwarded-proto"] === "https";
}

function redirect(res, location) {
    send(res, 302, "", { Location: location, "Cache-Control": "no-store" });
}

function readBody(req) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        let size = 0;

        req.on("data", (chunk) => {
            size += chunk.length;

            if (size > config.maxBody) {
                if (size - chunk.length <= config.maxBody) {
                    const error = new ValidationError(
                        "Requisição grande demais",
                    );

                    error.status = 413;

                    reject(error);
                }

                chunks.length = 0;

                return;
            }

            chunks.push(chunk);
        });

        req.on("end", () => {
            try {
                resolve(
                    JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}"),
                );
            } catch (error) {
                reject(new ValidationError("JSON inválido"));
            }
        });

        req.on("error", reject);
    });
}

function sameOrigin(req) {
    const origin = req.headers.origin;

    if (!origin) return true;

    try {
        return new URL(origin).host === req.headers.host;
    } catch (error) {
        return false;
    }
}

function serveFile(res, directory, relative, cache = "no-cache") {
    const target = path.normalize(path.join(directory, relative));

    if (
        !target.startsWith(directory + path.sep) ||
        path.basename(target).startsWith(".")
    ) {
        return sendJson(res, 404, { error: "Não encontrado" });
    }

    fs.stat(target, (error, stats) => {
        if (error) return sendJson(res, 404, { error: "Não encontrado" });

        const file = stats.isDirectory()
            ? path.join(target, "index.html")
            : target;

        fs.readFile(file, (readError, content) => {
            if (readError)
                return sendJson(res, 404, { error: "Não encontrado" });

            send(res, 200, content, {
                "Content-Type":
                    MIME[path.extname(file)] || "application/octet-stream",
                "Cache-Control": cache,
            });
        });
    });
}

function publicSite() {
    const site = storage.getSite();

    return {
        cfg: site.cfg,
        hours: site.hours,
        services: site.services.filter((service) => service.a !== false),
        imgs: site.imgs,
    };
}

function resetMessage(token) {
    const link = `${config.publicUrl}/admin/redefinir?token=${token}`;

    return [
        "Olá!",
        "",
        "Recebemos um pedido para redefinir a senha do painel do Império da Beleza.",
        "Para escolher uma nova senha, abra o link abaixo. Ele vale por 30 minutos e só pode ser usado uma vez:",
        "",
        link,
        "",
        "Se não foi você, ignore este e-mail. A senha atual continua valendo.",
    ].join("\n");
}

async function handleAdminApi(req, res, pathname, token) {
    const method = req.method;

    if (pathname === "/api/admin/session" && method === "GET") {
        return sendJson(res, 200, { authenticated: true });
    }

    if (pathname === "/api/admin/logout" && method === "POST") {
        auth.logout(token);

        return sendJson(
            res,
            200,
            { ok: true },
            { "Set-Cookie": auth.cookie("", 0, secureRequest(req)) },
        );
    }

    if (pathname === "/api/admin/data" && method === "GET") {
        return sendJson(res, 200, {
            site: storage.getSite(),
            clients: storage.getClients(),
            defaultPassword: auth.isDefaultPassword(),
            recoveryEmail: auth.getEmail(),
            mailConfigured: mailer.configured(),
        });
    }

    if (pathname === "/api/admin/data" && method === "PUT") {
        const body = await readBody(req);

        const site = validateSite(body.site);

        const clients = validateClients(body.clients);

        storage.saveSite(site);

        storage.saveClients(clients);

        cleanOrphans(site.imgs);

        return sendJson(res, 200, { ok: true });
    }

    if (pathname === "/api/admin/upload" && method === "POST") {
        const body = await readBody(req);

        return sendJson(res, 200, { path: saveImage(body.dataUrl) });
    }

    if (pathname === "/api/admin/password" && method === "POST") {
        const body = await readBody(req);

        const result = auth.changePassword(body.current, body.next, token);

        return sendJson(res, result.status || 200, result);
    }

    if (pathname === "/api/admin/email" && method === "POST") {
        const body = await readBody(req);

        const result = auth.changeEmail(body.current, body.email);

        return sendJson(res, result.status || 200, result);
    }

    return sendJson(res, 404, { error: "Não encontrado" });
}

async function handle(req, res) {
    const url = new URL(req.url, "http://localhost");

    let pathname;

    try {
        pathname = decodeURIComponent(url.pathname);

        if (pathname.includes("\0")) throw new Error("caractere inválido");
    } catch (error) {
        return sendJson(res, 400, { error: "Endereço inválido" });
    }

    const mutating = !["GET", "HEAD"].includes(req.method);

    if (mutating) {
        const json = (req.headers["content-type"] || "").startsWith(
            "application/json",
        );

        if (!sameOrigin(req) || !json)
            return sendJson(res, 403, { error: "Requisição não permitida" });
    }

    if (pathname === "/healthz" && req.method === "GET") {
        return sendJson(res, 200, { ok: true });
    }

    if (pathname === "/api/public/site" && req.method === "GET") {
        return sendJson(res, 200, publicSite());
    }

    if (pathname === "/api/admin/login" && req.method === "POST") {
        const body = await readBody(req);

        const result = auth.login(body.password, clientIp(req));

        if (!result.token)
            return sendJson(res, result.status, { error: result.error });

        return sendJson(
            res,
            200,
            { ok: true },
            {
                "Set-Cookie": auth.cookie(
                    result.token,
                    auth.SESSION_MS / 1000,
                    secureRequest(req),
                ),
            },
        );
    }

    if (pathname === "/api/admin/forgot" && req.method === "POST") {
        const body = await readBody(req);

        if (!mailer.configured()) {
            return sendJson(res, 503, {
                error: "O envio de e-mail ainda não foi configurado no servidor.",
            });
        }

        if (!auth.allowForgot(clientIp(req))) {
            return sendJson(res, 429, {
                error: "Muitos pedidos. Tente novamente mais tarde.",
            });
        }

        const registered = auth.getEmail();

        if (
            registered &&
            auth.validEmail(body.email) &&
            auth.sameEmail(registered, body.email)
        ) {
            mailer
                .send({
                    to: registered,
                    subject: "Redefinir a senha do painel",
                    text: resetMessage(auth.createResetToken()),
                })
                .catch((error) =>
                    console.error("Falha ao enviar e-mail:", error.message),
                );
        }

        return sendJson(res, 200, {
            ok: true,
            message:
                "Se o e-mail estiver cadastrado, enviamos um link para redefinir a senha. O link vale por 30 minutos.",
        });
    }

    if (pathname === "/api/admin/reset" && req.method === "POST") {
        const body = await readBody(req);

        const result = auth.resetPassword(
            body.token,
            body.password,
            clientIp(req),
        );

        return sendJson(res, result.status || 200, result);
    }

    const token = auth.sessionToken(req);

    if (pathname.startsWith("/api/admin/")) {
        if (!token) return sendJson(res, 401, { error: "Não autenticado" });

        return handleAdminApi(req, res, pathname, token);
    }

    if (pathname === "/admin" || pathname.startsWith("/admin/")) {
        if (pathname === "/admin/login") {
            return token
                ? redirect(res, "/admin")
                : serveFile(res, config.adminDir, "login.html");
        }

        if (pathname === "/admin/esqueci") {
            return serveFile(res, config.adminDir, "forgot.html");
        }

        if (pathname === "/admin/redefinir") {
            return serveFile(res, config.adminDir, "reset.html");
        }

        if (!token && !ADMIN_OPEN_FILES.includes(pathname)) {
            return pathname === "/admin"
                ? redirect(res, "/admin/login")
                : sendJson(res, 401, { error: "Não autenticado" });
        }

        return serveFile(
            res,
            config.adminDir,
            pathname === "/admin"
                ? "index.html"
                : pathname.slice("/admin/".length),
        );
    }

    if (req.method !== "GET" && req.method !== "HEAD") {
        return sendJson(res, 405, { error: "Método não permitido" });
    }

    const cache = pathname.startsWith("/uploads/")
        ? "public, max-age=86400"
        : pathname.startsWith("/fonts/")
          ? "public, max-age=31536000, immutable"
          : "no-cache";

    return serveFile(
        res,
        config.publicDir,
        pathname === "/" ? "index.html" : pathname.slice(1),
        cache,
    );
}

const server = http.createServer((req, res) => {
    handle(req, res).catch((error) => {
        if (error instanceof ValidationError) {
            res.on("finish", () => {
                if (error.status === 413) req.destroy();
            });

            return sendJson(res, error.status || 400, {
                error: error.message,
            });
        }

        console.error(error);

        sendJson(res, 500, { error: "Erro interno" });
    });
});

auth.ensurePassword();

server.listen(config.port, config.host, () => {
    console.log(`Servidor em http://${config.host}:${config.port}`);

    console.log(`Endereço do cliente: ${config.publicUrl}/`);

    console.log(`Endereço do painel do dono: ${config.publicUrl}/admin`);

    if (auth.isDefaultPassword()) {
        console.log(
            "Senha inicial do painel: 123. Peça ao dono para trocar no primeiro acesso.",
        );
    }

    if (!mailer.configured()) {
        console.log(
            "Envio de e-mail não configurado: o 'Esqueci minha senha' ficará indisponível (veja SMTP_* no README).",
        );
    }
});
