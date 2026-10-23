class ValidationError extends Error {}

const FONTS = ["'Playfair Display'", "'Cinzel'", "'Oswald'", "Georgia"];
const STATUS = ["pendente", "confirmado", "concluído", "cancelado"];
const HEX = /^#[0-9a-fA-F]{6}$/;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const ID = /^[a-z0-9]{2,24}$/;
const PHONE = /^[0-9()+\-\s]{10,20}$/;
const IMAGE = /^\/(img\/foto[1-4]\.jpg|uploads\/[a-f0-9]{16}\.(jpg|png|webp))$/;

function fail(message) {
    throw new ValidationError(message);
}

function isObject(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
}

function text(value, max, name, min = 0) {
    if (
        typeof value !== "string" ||
        value.length > max ||
        value.trim().length < min
    ) {
        fail(`Campo inválido: ${name}`);
    }

    return value.trim();
}

function number(value, min, max, name) {
    const parsed = Number(value);

    if (!Number.isFinite(parsed) || parsed < min || parsed > max) {
        fail(`Valor inválido: ${name}`);
    }

    return parsed;
}

function pattern(value, regex, name) {
    if (typeof value !== "string" || !regex.test(value)) {
        fail(`Formato inválido: ${name}`);
    }

    return value;
}

function validateConfig(input) {
    if (!isObject(input)) fail("Configurações inválidas");

    if (!FONTS.includes(input.head)) fail("Fonte inválida");

    return {
        name: text(input.name, 80, "nome", 1),
        eyebrow: text(input.eyebrow, 60, "chamada"),
        title: text(input.title, 120, "título", 1),
        sub: text(input.sub, 300, "subtítulo"),
        about: text(input.about, 1000, "sobre nós"),
        whats:
            input.whats === "" ? "" : pattern(input.whats, PHONE, "WhatsApp"),
        insta: text(input.insta, 60, "Instagram"),
        addr: text(input.addr, 200, "endereço"),
        hue: Math.round(number(input.hue, 0, 360, "tom")),
        accent: pattern(input.accent, HEX, "cor de destaque").toLowerCase(),
        head: input.head,
        pr: pattern(input.pr, HEX, "poste vermelho").toLowerCase(),
        pw: pattern(input.pw, HEX, "poste branco").toLowerCase(),
        pb: pattern(input.pb, HEX, "poste azul").toLowerCase(),
    };
}

function validateHours(input) {
    if (!Array.isArray(input) || input.length !== 7) fail("Horários inválidos");

    return input.map((day) => {
        if (!isObject(day)) fail("Horários inválidos");

        const open = day.o ? 1 : 0;
        const from = pattern(day.a, TIME, "abertura");

        const to = pattern(day.c, TIME, "fechamento");

        if (open && from >= to)
            fail("O fechamento deve ser depois da abertura");

        return { o: open, a: from, c: to };
    });
}

function validateServices(input) {
    if (!Array.isArray(input) || input.length > 30) fail("Serviços inválidos");

    return input.map((service) => {
        if (!isObject(service)) fail("Serviço inválido");

        return {
            id: pattern(service.id, ID, "id do serviço"),
            n: text(service.n, 60, "nome do serviço", 1),
            d: text(service.d, 160, "descrição do serviço"),
            p: Math.round(number(service.p, 0, 100000, "preço") * 100) / 100,
            m: Math.round(number(service.m, 5, 480, "duração")),
            a: service.a !== false,
        };
    });
}

function validateImages(input) {
    if (!Array.isArray(input) || input.length !== 4) fail("Imagens inválidas");

    return input.map((path) => pattern(path, IMAGE, "imagem"));
}

function validateSite(input) {
    if (!isObject(input)) fail("Dados do site inválidos");

    return {
        cfg: validateConfig(input.cfg),
        hours: validateHours(input.hours),
        services: validateServices(input.services),
        imgs: validateImages(input.imgs),
    };
}

function validateClients(input) {
    if (!Array.isArray(input) || input.length > 2000)
        fail("Lista de clientes inválida");

    return input.map((client) => {
        if (!isObject(client)) fail("Cliente inválido");

        const date = pattern(client.date, /^\d{4}-\d{2}-\d{2}$/, "dia");

        if (Number.isNaN(Date.parse(date))) fail("Dia inválido");

        if (!STATUS.includes(client.status)) fail("Status inválido");

        return {
            id: pattern(client.id, ID, "id do cliente"),
            name: text(client.name, 80, "nome do cliente", 2),
            phone: pattern(client.phone, PHONE, "telefone do cliente"),
            sid: pattern(client.sid, ID, "serviço do cliente"),
            date,
            t: Math.round(number(client.t, 0, 1439, "hora")),
            m: Math.round(number(client.m, 5, 480, "duração")),
            price: number(client.price, 0, 100000, "preço"),
            status: client.status,
            created: number(client.created, 0, 9e15, "criação"),
        };
    });
}

module.exports = { ValidationError, validateSite, validateClients };
