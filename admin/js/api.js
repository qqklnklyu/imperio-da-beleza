async function request(method, url, body) {
    const response = await fetch(url, {
        method,
        headers: body ? { "Content-Type": "application/json" } : {},
        body: body ? JSON.stringify(body) : undefined,
        credentials: "same-origin",
    });

    if (response.status === 401) {
        location.href = "/admin/login";

        throw new Error("Sessão expirada");
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok)
        throw new Error(data.error || "Erro ao comunicar com o servidor");

    return data;
}

let saveTimer;

function save() {
    clearTimeout(saveTimer);

    saveTimer = setTimeout(async () => {
        try {
            await request("PUT", "/api/admin/data", {
                site: {
                    cfg: store.cfg,
                    hours: store.hours,
                    services: store.services,
                    imgs: store.imgs,
                },
                clients: store.clients,
            });

            toast("Alterações salvas");
        } catch (error) {
            toast(error.message);
        }
    }, 300);
}
