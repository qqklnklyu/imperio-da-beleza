try {
    if (localStorage.getItem("idb_contrast") === "1") {
        document.documentElement.classList.add("high-contrast");
    }
} catch (error) {}

async function start() {
    try {
        const response = await fetch("/api/public/site");

        if (!response.ok) throw new Error("Falha ao carregar");

        store = await response.json();

        theme();

        Site();
    } catch (error) {
        select("#app").innerHTML =
            '<div class="load-error"><h2>Não foi possível carregar o site</h2><p>Tente novamente em instantes.</p></div>';
    }
}

start();
