const forgotForm = select("#forgotForm");

const resetForm = select("#resetForm");

async function post(url, body) {
    const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });

    const data = await response.json().catch(() => ({}));

    return { ok: response.ok, data };
}

if (forgotForm) {
    forgotForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const { ok, data } = await post("/api/admin/forgot", {
            email: select("#email").value.trim(),
        });

        if (ok) {
            forgotForm.innerHTML = `<p>${esc(data.message)}</p><a class="link center" href="/admin/login">Voltar para o login</a>`;

            return;
        }

        toast(data.error || "Não foi possível enviar o e-mail");
    });
}

if (resetForm) {
    const token = new URLSearchParams(location.search).get("token") || "";

    resetForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const password = select("#password").value;

        if (password !== select("#confirm").value) {
            toast("As senhas não são iguais");

            return;
        }

        const { ok, data } = await post("/api/admin/reset", { token, password });

        if (ok) {
            resetForm.innerHTML =
                '<p>Senha alterada. Entre com a nova senha.</p><a class="btn" href="/admin/login">Ir para o login</a>';

            history.replaceState(null, "", "/admin/redefinir");

            return;
        }

        toast(data.error || "Não foi possível alterar a senha");
    });
}
