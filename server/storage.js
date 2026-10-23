const fs = require("fs");

const path = require("path");

const config = require("./config");

function filePath(name) {
    return path.join(config.dataDir, name);
}

function readJson(name, fallback) {
    try {
        return JSON.parse(fs.readFileSync(filePath(name), "utf8"));
    } catch (error) {
        return fallback;
    }
}

function writeJson(name, value) {
    fs.mkdirSync(config.dataDir, { recursive: true });

    const temporary = filePath(name + ".tmp");

    fs.writeFileSync(temporary, JSON.stringify(value, null, 2));

    fs.renameSync(temporary, filePath(name));
}

module.exports = {
    getSite: () =>
        readJson("site.json", null) || readJson("site.default.json", {}),
    saveSite: (site) => writeJson("site.json", site),
    getClients: () => readJson("clients.json", []),
    saveClients: (clients) => writeJson("clients.json", clients),
    getSessions: () => readJson("sessions.json", {}),
    saveSessions: (sessions) => writeJson("sessions.json", sessions),
    getAuth: () => readJson("auth.json", null),
    saveAuth: (auth) => writeJson("auth.json", auth),
};
