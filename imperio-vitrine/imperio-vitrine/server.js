const http = require("http");

const fs = require("fs");

const path = require("path");

const PORT = process.env.PORT || 3000;

const ROOT = __dirname;

const ALLOWED = new Set(["index.html", "css", "js", "img", "fonts"]);

const TYPES = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".jpg": "image/jpeg",
    ".woff2": "font/woff2",
    ".txt": "text/plain; charset=utf-8",
};

function send(res, status, body, headers = {}) {
    res.writeHead(status, {
        "X-Content-Type-Options": "nosniff",
        ...headers,
    });

    res.end(body);
}

const server = http.createServer((req, res) => {
    if (req.method !== "GET" && req.method !== "HEAD") {
        return send(res, 405, "Método não permitido");
    }

    let pathname;

    try {
        pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
    } catch (error) {
        return send(res, 400, "Requisição inválida");
    }

    if (pathname === "/healthz") return send(res, 200, "ok");

    if (pathname === "/") pathname = "/index.html";

    const relative = path.normalize(pathname).replace(/^[/\\]+/, "");

    const top = relative.split(path.sep)[0];

    const file = path.join(ROOT, relative);

    if (!ALLOWED.has(top) || !file.startsWith(ROOT + path.sep)) {
        return send(res, 404, "Página não encontrada");
    }

    fs.readFile(file, (error, data) => {
        if (error) return send(res, 404, "Página não encontrada");

        const ext = path.extname(file).toLowerCase();

        const isPage = ext === ".html";

        send(res, 200, req.method === "HEAD" ? "" : data, {
            "Content-Type": TYPES[ext] || "application/octet-stream",
            "Cache-Control": isPage
                ? "no-cache"
                : "public, max-age=2592000, immutable",
        });
    });
});

server.listen(PORT, () => {
    console.log(`Império da Beleza rodando na porta ${PORT}`);
});
