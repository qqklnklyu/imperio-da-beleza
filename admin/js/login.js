const form = select("#loginForm");

form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: select("#password").value }),
    });

    if (response.ok) {
        location.href = "/admin";

        return;
    }

    const data = await response.json().catch(() => ({}));

    toast(data.error || "Não foi possível entrar");
});
