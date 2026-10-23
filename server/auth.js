const crypto = require("crypto");

const config = require("./config");

const storage = require("./storage");

const DEFAULT_PASSWORD = "123";

const SESSION_MS = 8 * 60 * 60 * 1000;
const WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;

const RESET_MS = 30 * 60 * 1000;
const FORGOT_WINDOW_MS = 60 * 60 * 1000;
const FORGOT_MAX_PER_IP = 3;
const FORGOT_MAX_TOTAL = 6;

const EMAIL = /^[^\s@<>"',;]{1,64}@[^\s@<>"',;]+\.[^\s@<>"',;]+$/;

const attempts = new Map();

const resets = new Map();

const forgotLog = [];

let sessions = new Map();

function sha256(value) {
    return crypto.createHash("sha256").update(value).digest("hex");
}

function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString("hex");

    const hash = crypto.scryptSync(password, salt, 64).toString("hex");

    return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
    const [salt, hash] = String(stored).split(":");

    if (!salt || !hash) return false;

    const candidate = crypto.scryptSync(password, salt, 64);

    const expected = Buffer.from(hash, "hex");

    return (
        candidate.length === expected.length &&
        crypto.timingSafeEqual(candidate, expected)
    );
}

function validPassword(password) {
    return (
        typeof password === "string" &&
        password.length >= 8 &&
        password.length <= 128
    );
}

function loadSessions() {
    const now = Date.now();

    sessions = new Map(
        Object.entries(storage.getSessions()).filter(
            ([, expires]) => expires > now,
        ),
    );
}

function persistSessions() {
    storage.saveSessions(Object.fromEntries(sessions));
}

function ensurePassword() {
    if (!storage.getAuth()) {
        storage.saveAuth({
            hash: hashPassword(DEFAULT_PASSWORD),
            isDefault: true,
        });
    }

    loadSessions();
}

function isDefaultPassword() {
    const auth = storage.getAuth();

    return Boolean(auth && auth.isDefault);
}

function validEmail(value) {
    return typeof value === "string" && value.length <= 254 && EMAIL.test(value.trim());
}

function getEmail() {
    const auth = storage.getAuth() || {};

    if (auth.email) return auth.email;

    return validEmail(config.ownerEmail) ? config.ownerEmail : "";
}

function sameEmail(a, b) {
    return String(a).trim().toLowerCase() === String(b).trim().toLowerCase();
}

function blocked(key) {
    const entry = attempts.get(key);

    if (!entry) return false;

    if (Date.now() - entry.first > WINDOW_MS) {
        attempts.delete(key);

        return false;
    }

    return entry.count >= MAX_ATTEMPTS;
}

function registerFailure(key) {
    const entry = attempts.get(key) || { count: 0, first: Date.now() };

    entry.count += 1;
    attempts.set(key, entry);
}

function login(password, ip) {
    if (blocked(ip)) {
        return {
            status: 429,
            error: "Muitas tentativas. Aguarde alguns minutos.",
        };
    }

    const auth = storage.getAuth();

    if (
        typeof password !== "string" ||
        !auth ||
        !verifyPassword(password, auth.hash)
    ) {
        registerFailure(ip);

        return { status: 401, error: "Senha incorreta." };
    }

    attempts.delete(ip);

    const token = crypto.randomBytes(32).toString("hex");

    sessions.set(sha256(token), Date.now() + SESSION_MS);

    persistSessions();

    return { token };
}

function sessionToken(req) {
    const match = (req.headers.cookie || "").match(
        /(?:^|;\s*)idb_session=([a-f0-9]{64})/,
    );

    if (!match) return null;

    const key = sha256(match[1]);

    const expires = sessions.get(key);

    if (!expires || expires < Date.now()) {
        if (expires) {
            sessions.delete(key);

            persistSessions();
        }

        return null;
    }

    return match[1];
}

function logout(token) {
    sessions.delete(sha256(token));

    persistSessions();
}

function cookie(token, maxAge, secureRequest) {
    const secure = config.secureCookie || secureRequest ? "; Secure" : "";

    return `idb_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${maxAge}${secure}`;
}

function changePassword(current, next, keepToken) {
    const auth = storage.getAuth();

    if (typeof current !== "string" || !verifyPassword(current, auth.hash)) {
        return { status: 401, error: "Senha atual incorreta." };
    }

    if (!validPassword(next)) {
        return {
            status: 400,
            error: "A nova senha deve ter de 8 a 128 caracteres.",
        };
    }

    const { isDefault, ...rest } = auth;

    storage.saveAuth({ ...rest, hash: hashPassword(next) });

    const keep = keepToken ? sha256(keepToken) : null;

    for (const key of [...sessions.keys()]) {
        if (key !== keep) sessions.delete(key);
    }

    persistSessions();

    return { ok: true };
}

function changeEmail(current, email) {
    const auth = storage.getAuth();

    if (typeof current !== "string" || !verifyPassword(current, auth.hash)) {
        return { status: 401, error: "Senha atual incorreta." };
    }

    if (!validEmail(email)) {
        return { status: 400, error: "E-mail inválido." };
    }

    storage.saveAuth({ ...auth, email: email.trim() });

    return { ok: true };
}

function allowForgot(ip) {
    const now = Date.now();

    while (forgotLog.length && now - forgotLog[0].at > FORGOT_WINDOW_MS) {
        forgotLog.shift();
    }

    const mine = forgotLog.filter((entry) => entry.ip === ip).length;

    if (mine >= FORGOT_MAX_PER_IP || forgotLog.length >= FORGOT_MAX_TOTAL) {
        return false;
    }

    forgotLog.push({ ip, at: now });

    return true;
}

function createResetToken() {
    const token = crypto.randomBytes(32).toString("hex");

    resets.clear();

    resets.set(sha256(token), Date.now() + RESET_MS);

    return token;
}

function resetPassword(token, next, ip) {
    const key = "reset:" + ip;

    if (blocked(key)) {
        return {
            status: 429,
            error: "Muitas tentativas. Aguarde alguns minutos.",
        };
    }

    const hash = /^[a-f0-9]{64}$/.test(String(token)) ? sha256(token) : null;

    const expires = hash ? resets.get(hash) : null;

    if (!expires || expires < Date.now()) {
        registerFailure(key);

        return {
            status: 400,
            error: "Link inválido ou expirado. Peça um novo.",
        };
    }

    if (!validPassword(next)) {
        return {
            status: 400,
            error: "A nova senha deve ter de 8 a 128 caracteres.",
        };
    }

    resets.delete(hash);

    const { isDefault, ...rest } = storage.getAuth() || {};

    storage.saveAuth({ ...rest, hash: hashPassword(next) });

    sessions.clear();

    persistSessions();

    return { ok: true };
}

module.exports = {
    ensurePassword,
    isDefaultPassword,
    login,
    logout,
    sessionToken,
    cookie,
    changePassword,
    changeEmail,
    getEmail,
    validEmail,
    sameEmail,
    allowForgot,
    createResetToken,
    resetPassword,
    SESSION_MS,
    RESET_MS,
};
