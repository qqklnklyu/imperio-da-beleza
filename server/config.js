const fs = require("fs");

const path = require("path");

const root = path.join(__dirname, "..");

function loadEnv() {
    const file = path.join(root, ".env");

    if (!fs.existsSync(file)) return;

    for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
        const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);

        if (match && !(match[1] in process.env)) {
            process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
        }
    }
}

loadEnv();

const port = Number(process.env.PORT) || 3000;

const host = process.env.HOST || "0.0.0.0";

const smtpPort = Number(process.env.SMTP_PORT) || 587;

const publicUrl = (
    /^https?:\/\//.test(process.env.PUBLIC_URL || "")
        ? process.env.PUBLIC_URL
        : `http://${host === "0.0.0.0" ? "127.0.0.1" : host}:${port}`
).replace(/\/+$/, "");

module.exports = {
    root,
    host,
    port,
    publicUrl,
    ownerEmail: (process.env.OWNER_EMAIL || "").trim(),
    smtp: {
        host: process.env.SMTP_HOST || "",
        port: smtpPort,
        secure: process.env.SMTP_SECURE
            ? process.env.SMTP_SECURE === "true"
            : smtpPort === 465,
        user: process.env.SMTP_USER || "",
        pass: process.env.SMTP_PASS || "",
        from: process.env.SMTP_FROM || process.env.SMTP_USER || "",
    },
    secureCookie: process.env.COOKIE_SECURE === "true",
    trustProxy: process.env.TRUST_PROXY === "true",
    publicDir: path.join(root, "public"),
    adminDir: path.join(root, "admin"),
    dataDir: process.env.DATA_DIR || path.join(root, "data"),
    uploadsDir: path.join(root, "public", "uploads"),
    maxBody: 3 * 1024 * 1024,
    maxUpload: 2 * 1024 * 1024,
};
