const crypto = require("crypto");

const fs = require("fs");

const path = require("path");

const config = require("./config");

const { ValidationError } = require("./validation");

function detectType(buffer) {
    if (buffer.length < 12) return null;

    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff)
        return "jpg";

    if (
        buffer
            .subarray(0, 8)
            .equals(
                Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
            )
    )
        return "png";

    if (
        buffer.subarray(0, 4).toString() === "RIFF" &&
        buffer.subarray(8, 12).toString() === "WEBP"
    )
        return "webp";

    return null;
}

function saveImage(dataUrl) {
    const match =
        /^data:image\/(?:jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/.exec(
            String(dataUrl),
        );

    if (!match) throw new ValidationError("Formato de imagem inválido");

    const buffer = Buffer.from(match[1], "base64");

    if (buffer.length === 0 || buffer.length > config.maxUpload) {
        throw new ValidationError("A imagem deve ter até 2 MB");
    }

    const type = detectType(buffer);

    if (!type) throw new ValidationError("O arquivo não é uma imagem válida");

    fs.mkdirSync(config.uploadsDir, { recursive: true });

    const name = `${crypto.randomBytes(8).toString("hex")}.${type}`;

    fs.writeFileSync(path.join(config.uploadsDir, name), buffer);

    return `/uploads/${name}`;
}

function cleanOrphans(imgs) {
    const used = new Set(
        imgs.filter((p) => p.startsWith("/uploads/")).map((p) => path.basename(p)),
    );

    const limit = Date.now() - 60 * 60 * 1000;

    for (const name of fs.readdirSync(config.uploadsDir)) {
        if (name.startsWith(".") || used.has(name)) continue;

        const file = path.join(config.uploadsDir, name);

        try {
            if (fs.statSync(file).mtimeMs < limit) fs.rmSync(file, { force: true });
        } catch (error) {
            continue;
        }
    }
}

module.exports = { saveImage, cleanOrphans };
