function Site() {
    const c = store.cfg;
    const cards = [
        [
            "Bem-vindo",
            "Corte, barba e estilo com atendimento tranquilo e acolhedor.",
        ],
        [
            "Nossa história",
            "Tradição de barbeiro com técnica moderna, em um ambiente pensado para você.",
        ],
        ["Serviços", "Confira os serviços, os preços e agende pelo WhatsApp."],
        ["Nosso espaço", "Conheça o ambiente onde você será atendido."],
        ["Clientes", "O que quem já passou por aqui diz sobre a experiência."],
        ["Fale conosco", "WhatsApp, endereço e horários de atendimento."],
    ];
    const links = [
        ["s0", "Início"],
        ["s1", "Sobre nós"],
        ["s2", "Serviços e preços"],
        ["s3", "Galeria"],
        ["s4", "Depoimentos"],
        ["s5", "Contato"],
    ];
    const g = (i) => `role="img" style="background-image:var(--img${i})"`;
    select("#app").innerHTML = `
<header>
    <div class="navbar"><a class="logo" href="#" data-s="s0">✂ ${esc(c.name)}</a>
        <nav><button class="contrast-button" id="contrastButton" type="button" aria-pressed="false" aria-label="Alto contraste" title="Alto contraste">◐</button><button class="menu-button" id="menuButton" aria-label="Abrir menu" aria-expanded="false"><span></span><span></span><span></span></button>
            <ul class="nav-links" id="navLinks">${links.map(([id, label]) => `<li><a href="#" data-s="${id}">${label}</a></li>`).join("")}
            </ul>
        </nav>
    </div>
</header>

<div class="wrap">
    <div class="left" aria-hidden="true">
        <div class="polebox">
            <div class="pole" id="pole"></div>
        </div>

        <div class="conv" id="conv">${cards.map((k, i) => `<div class="card"><small>0${i + 1}</small><b>${k[0]}</b><span>${k[1]}</span></div>`).join("")}</div>

        <div class="dots" id="dots"></div>
    </div>

    <main class="right">
        <section class="section" id="s0">
            <div class="eyebrow rv">${esc(c.eyebrow)}</div>

            <h1 class="rv">${esc(c.title)}</h1>

            <p class="rv">${esc(c.sub)}</p>

            <div class="btns rv"><a class="btn wa" href="${scheduleLink() || "#"}" data-book target="_blank" rel="noopener">Agendar pelo WhatsApp</a><a class="btn ghost" href="#" data-s="s2">Ver serviços</a></div>

            <div class="pill rv">🕕 Atendimento: ${hoursLabel()}</div>
        </section>

        <section class="section" id="s1">
            <div class="eyebrow rv">Sobre nós</div>

            <h2 class="rv">Tradição de barbeiro, olhar moderno.</h2>

            <p class="rv">${esc(c.about)}</p>

            <div class="pic rv" ${g(2)} aria-label="Espaço de atendimento"></div>

            <div class="feat rv">
                <div class="it"><em>✂</em>
                    <div><b>Técnica apurada</b><span>Cortes feitos com precisão, do clássico ao contemporâneo.</span></div>
                </div>

                <div class="it"><em>☕</em>
                    <div><b>Ambiente acolhedor</b><span>Um lugar para relaxar enquanto cuidamos de você.</span></div>
                </div>

                <div class="it"><em>⏱</em>
                    <div><b>Hora marcada</b><span>Agende pelo WhatsApp e evite esperas.</span></div>
                </div>
            </div>
        </section>

        <section class="section" id="s2">
            <div class="eyebrow rv">Serviços e preços</div>

            <h2 class="rv">O que fazemos por você.</h2>

            <div class="prices rv">${store.services
                .map(
                    (s) => `<div class="price">
    <h3>${esc(s.n)}</h3>

    <p>${esc(s.d)}</p>
    <strong>${money(s.p)} <small>· ${s.m} min</small></strong>

    <a class="link" href="${scheduleLink(s.n) || "#"}" data-book target="_blank" rel="noopener">Agendar pelo WhatsApp →</a></div>`,
                )
                .join("")}</div>

            <div class="btns rv"><a class="btn wa" href="${scheduleLink() || "#"}" data-book target="_blank" rel="noopener">Agendar pelo WhatsApp</a></div>
        </section>

        <section class="section" id="s3">
            <div class="eyebrow rv">Galeria</div>

            <h2 class="rv">Nosso espaço.</h2>

            <!-- NOVA GALERIA ÚNICA CLICÁVEL -->
            <div class="rv" id="abrirModalBtn" style="position:relative; width:100%; height:350px; border-radius:8px; overflow:hidden; cursor:pointer; margin-bottom:15px;">
                <div id="imagemPrincipalCapa" style="width:100%; height:100%; background-image:var(--img1); background-size:cover; background-position:center; transition:transform 0.3s ease;"></div>
                <div style="position:absolute; bottom:13px; right:21px; background:rgba(0,0,0,0.7); color:#fff; padding:8px 13px; border-radius:4px; font-size:0.9rem; pointer-events:none;">Clique para ampliar</div>
            </div>

            <p class="rv">📍 ${esc(c.addr)} · <a class="link" href="${mapsLink()}" target="_blank" rel="noopener">Como chegar</a></p>
        </section>

        <section class="section" id="s4">
            <div class="eyebrow rv">Depoimentos</div>

            <h2 class="rv">Quem já passou por aqui.</h2>

            <div class="quote rv">
                <p>“Depoimento de exemplo de um cliente satisfeito, a ser substituído por um real.”</p>
                <small>— NOME DO CLIENTE</small></div>
        </section>

        <section class="section" id="s5">
            <div class="eyebrow rv">Contato</div>

            <h2 class="rv">Agende seu horário.</h2>

            <div class="info rv">
                <div>Endereço <span>${esc(c.addr)}</span></div>${store.hours
                    .map((h, i) => [i, h])
                    .filter((x) => true)
                    .map(
                        ([i, h]) =>
                            `<div>${DAYS[i]} <span>${h.o ? h.a + " às " + h.c : "Fechado"}</span></div>`,
                    )
                    .join("")}<div>Instagram <span>${esc(c.insta)}</span></div>
            </div>

            <div class="btns rv"><a class="btn wa" href="${scheduleLink() || "#"}" data-book target="_blank" rel="noopener">Agendar pelo WhatsApp</a><a class="btn ghost" href="${mapsLink()}" target="_blank" rel="noopener">Como chegar</a></div>
        </section>

        <footer id="foot"><span>Desenvolvido por Alunos de Tecnologia da FATEC São José do Rio Preto. </span><span>© ${esc(c.name)}
    </main>
</div>
<a class="fab wa" href="${scheduleLink() || "#"}" data-book target="_blank" rel="noopener">Agendar pelo WhatsApp</a>

<!-- MODAL TELA CHEIA (LIGHTBOX) -->
<div id="modalGaleria" style="display:none; position:fixed; z-index:99999; left:0; top:0; width:100%; height:100%; background:rgba(0,0,0,0.9); backdrop-filter:blur(5px);">
    <span id="fecharModalBtn" style="position:absolute; top:21px; right:34px; color:#fff; font-size:50px; font-weight:bold; cursor:pointer; z-index:100000; padding:10px;">&times;</span>
    <div style="position:relative; display:flex; justify-content:space-between; align-items:center; height:100%; width:100%; padding: 0 5vw;">
        <button id="setaEsq" style="background:rgba(255,255,255,0.2); color:white; border:none; font-size:30px; padding:13px 21px; border-radius:50%; cursor:pointer; z-index:100000; transition:0.3s;">&#10094;</button>
        <div id="imagemModalBox" style="width:70vw; height:80vh; background-image:var(--img1); background-size:contain; background-repeat:no-repeat; background-position:center;"></div>
        <button id="setaDir" style="background:rgba(255,255,255,0.2); color:white; border:none; font-size:30px; padding:13px 21px; border-radius:50%; cursor:pointer; z-index:100000; transition:0.3s;">&#10095;</button>
    </div>
</div>
`;
    const pole = select("#pole"),
        conv = select("#conv"),
        cs = selectAll(".card"),
        secs = selectAll("section"),
        dots = select("#dots"),
        navA = selectAll(".nav-links a[data-s]"),
        calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
    cs.forEach(() => dots.appendChild(document.createElement("i")));

    let target = 0,
        cur = 0,
        alive = true;
    const ease = (t) => {
        t = t * t * (3 - 2 * t);

        return t * t * (3 - 2 * t);
    };

    function calc() {
        const o = secs.map((s) => s.getBoundingClientRect().top + scrollY),
            y = scrollY + innerHeight * 0.15;
        let f = 0;
        for (let k = 0; k < o.length - 1; k++)
            if (y >= o[k] && y < o[k + 1])
                f = k + ease((y - o[k]) / (o[k + 1] - o[k]));
        if (y >= o[o.length - 1]) f = o.length - 1;
        target = Math.min(f, cs.length - 1);

        const n = Math.round(target);

        [...dots.children].forEach((d, i) => d.classList.toggle("on", i === n));

        navA.forEach((a, i) => a.classList.toggle("on", i === n));
    }

    function loop() {
        if (!alive) return;
        cur = calm ? target : cur + (target - cur) * 0.08;
        const spread = conv.clientWidth * 0.95;
        cs.forEach((k, i) => {
            const d = i - cur,
                a = Math.abs(d);
            k.style.opacity = Math.max(0, 1 - a * 1.15);

            k.style.transform = `translate(calc(-50% + ${-d * spread}px),-50%) scale(${1 - Math.min(a, 1) * 0.05})`;
        });

        pole.style.backgroundPosition =
            "0 " + -(cur * innerHeight * 0.6 + scrollY * 0.15) + "px";
        requestAnimationFrame(loop);
    }

    const contrastButton = select("#contrastButton");

    const syncContrast = () =>
        contrastButton.setAttribute(
            "aria-pressed",
            document.documentElement.classList.contains("high-contrast"),
        );

    syncContrast();

    contrastButton.addEventListener("click", () => {
        const on = document.documentElement.classList.toggle("high-contrast");

        try {
            localStorage.setItem("idb_contrast", on ? "1" : "0");
        } catch (error) {
            toast("Não foi possível lembrar a escolha neste aparelho");
        }

        syncContrast();
    });

    const menuButton = select("#menuButton"),
        navLinks = select("#navLinks"),
        tog = (v) => {
            const o = navLinks.classList.toggle("active", v);

            menuButton.classList.toggle("x", o);

            menuButton.setAttribute("aria-expanded", o);
        };
    menuButton.onclick = () => tog();

    select("#app").onclick = (e) => {
        const book = e.target.closest("a[data-book]");

        if (book && !scheduleLink()) {
            e.preventDefault();

            toast("Informe o WhatsApp no painel do dono");

            return;
        }

        const a = e.target.closest("a[data-s]");

        if (a) {
            e.preventDefault();

            tog(false);

            const s = document.getElementById(a.dataset.s);

            s && s.scrollIntoView({ behavior: calm ? "auto" : "smooth" });
        } else if (e.target.closest(".nav-links a")) tog(false);
    };

    // --- NOVA LÓGICA DA GALERIA EM CARROSSEL ---
    const modalGaleria = document.getElementById("modalGaleria");
    const imgCapa = document.getElementById("imagemPrincipalCapa");
    const imgModalBox = document.getElementById("imagemModalBox");
    let fotoAtual = 1; // Controla de 1 a 4

    document.getElementById("abrirModalBtn").onclick = () => {
        modalGaleria.style.display = "block";
        document.body.style.overflow = "hidden"; // Trava o scroll da página
        imgModalBox.style.backgroundImage = `var(--img${fotoAtual})`; // Puxa a variável do servidor
    };

    document.getElementById("fecharModalBtn").onclick = () => {
        modalGaleria.style.display = "none";
        document.body.style.overflow = "auto"; // Libera o scroll
    };

    const trocarFoto = (direcao) => {
        fotoAtual += direcao;
        if(fotoAtual > 4) fotoAtual = 1;
        if(fotoAtual < 1) fotoAtual = 4;
        
        const novaImg = `var(--img${fotoAtual})`;
        imgModalBox.style.backgroundImage = novaImg; // Muda a foto do modal
        imgCapa.style.backgroundImage = novaImg; // Muda a foto da página de fundo também!
    };

    document.getElementById("setaEsq").onclick = (e) => { e.stopPropagation(); trocarFoto(-1); };
    document.getElementById("setaDir").onclick = (e) => { e.stopPropagation(); trocarFoto(1); };
    // --- FIM DA LÓGICA DA GALERIA ---

    const io = new IntersectionObserver(
        (es) =>
            es.forEach((e) => {
                if (e.isIntersecting) {
                    e.target.classList.add("in");

                    io.unobserve(e.target);
                }
            }),
        { threshold: 0.15 },
    );

    selectAll(".rv").forEach((el) => io.observe(el));

    addEventListener("scroll", calc, { passive: true });

    addEventListener("resize", calc);

    calc();

    loop();

    return () => {
        alive = false;
        io.disconnect();

        removeEventListener("scroll", calc);

        removeEventListener("resize", calc);
    };
}
