function Admin() {
    const app = select("#app");

    let tab = "ag",
        f = "todos";
    const head = (right = "") =>
        `<header>
    <div class="navbar"><a class="logo" href="/admin">✂ ${esc(store.cfg.name)} · Painel</a>
        <div class="btns">${right}</div>
    </div>
</header>`;
    const fld = (l, k, t = "text") =>
        `<label>${l}<input type="${t}" data-c="${k}" value="${esc(store.cfg[k])}"></label>`;
    const stat = (n, l) =>
        `<div class="stat"><b>${n}</b><span>${l}</span></div>`;
    function clientes() {
        const today = ymd(new Date()),
            ap = store.clients,
            hasWhats = digits(store.cfg.whats).length >= 10;
        const list = ap
            .filter((x) => {
                if (f === "hoje") return x.date === today;
                if (f === "fut")
                    return x.date >= today && x.status !== "cancelado";
                if (f === "pend") return x.status === "pendente";
                return true;
            })
            .sort((x, y) => x.date.localeCompare(y.date) || x.t - y.t);
        const rows = list
            .map((x) => {
                const s = store.services.find((v) => v.id === x.sid),
                    link = waLink(
                        `Olá ${x.name}! Sobre o seu horário de ${dateBR(x.date)} às ${hm(x.t)}.`,
                        x.phone,
                    );
                return `<tr>
    <td><b>${esc(x.name)}</b></td>
    <td>${link ? `<a class="link" href="${link}" target="_blank" rel="noopener">${esc(x.phone)}</a>` : esc(x.phone)}</td>
    <td>${esc(s ? s.n : "Serviço")}<br><span>${money(x.price)}</span></td>
    <td>${dateBR(x.date)}</td>
    <td>${hm(x.t)}</td>
    <td><select data-st="${x.id}">${["pendente", "confirmado", "concluído", "cancelado"].map((o) => `<option ${x.status === o ? "selected" : ""}>${o}</option>`).join("")}</select></td>
    <td><button class="btn ghost sm" data-a="del" data-id="${x.id}">Excluir</button></td>
</tr>`;
            })
            .join("");
        const banner = hasWhats
            ? ""
            : `<div class="panel warn">
    <h3>Configure o WhatsApp Business</h3>

    <p>Os clientes serão enviados para este número ao agendar. Informe com DDD.</p>
    <label>WhatsApp Business do dono<input type="tel" data-c="whats" placeholder="(17) 99999-9999" value="${esc(store.cfg.whats)}"></label></div>`;
        const info = (n, l) =>
            `<div class="stat"><b class="sm">${esc(n)}</b><span>${l}</span></div>`;
        const stats = `<div class="stats">${stat(ap.filter((x) => x.date === today && x.status !== "cancelado").length, "clientes hoje")}${stat(ap.filter((x) => x.status === "pendente").length, "aguardando confirmação")}${info(hoursLabel() || "Fechado", "atendimento")}${info(hasWhats ? store.cfg.whats : "não configurado", "WhatsApp Business")}</div>`;
        const chips = `<div class="chips">${[
            ["todos", "Todos"],
            ["hoje", "Hoje"],
            ["fut", "Futuros"],
            ["pend", "Pendentes"],
        ]
            .map(
                ([k, l]) =>
                    `<button class="chip ${f === k ? "on" : ""}" data-a="f" data-id="${k}">${l}</button>`,
            )
            .join("")}</div>`;
        const table = `<div class="panel">
    <div class="table-wrap">
        <table class="table">
            <thead>
                <tr>
                    <th>Cliente</th>
                    <th>WhatsApp</th>
                    <th>Serviço</th>
                    <th>Dia</th>
                    <th>Hora</th>
                    <th>Status</th>
                    <th></th>
                </tr>
            </thead>
            <tbody>${
                rows ||
                `<tr>
    <td colspan="7" class="empty">Nenhum cliente neste filtro.</td>
</tr>`
            }</tbody>
        </table>
    </div>
</div>`;
        const form = `<div class="panel">
    <h3>Novo cliente</h3>

    <p class="hint">Quando o pedido chegar pelo WhatsApp, registre aqui para controlar a agenda.</p>

    <div class="grid g3"><label>Nome<input id="mn"></label><label>WhatsApp<input id="mp" type="tel"></label><label>Serviço<select id="ms">${store.services.map((s) => `<option value="${s.id}">${esc(s.n)}</option>`).join("")}</select></label><label>Dia<input id="md" type="date" value="${today}"></label><label>Hora<input id="mt" type="time" value="18:00"></label></div>
    <button class="btn" data-a="addc">Adicionar cliente</button></div>`;
        return banner + stats + chips + table + form;
    }

    function servicos() {
        return `<div class="panel">
    <h3>Serviços e preços</h3>${store.services.map((s) => `<div class="sv"><label>Nome<input data-sv="${s.id}|n" value="${esc(s.n)}"></label><label>Descrição<input data-sv="${s.id}|d" value="${esc(s.d)}"></label><label>Preço (R$)<input type="number" min="0" step="0.5" data-sv="${s.id}|p" value="${s.p}"></label><label>Minutos<input type="number" min="10" step="5" data-sv="${s.id}|m" value="${s.m}"></label><label class="ck"><input type="checkbox" data-sv="${s.id}|a" ${s.a !== false ? "checked" : ""}> Ativo</label><button class="btn ghost sm" data-a="delsv" data-id="${s.id}">Remover</button></div>`).join("")}<button class="btn" data-a="addsv">+ Novo serviço</button></div>`;
    }

    function aparencia() {
        return `<div class="panel">
    <h3>Textos</h3>

    <div class="grid g2">${fld("Nome da barbearia", "name")}${fld("Chamada acima do título", "eyebrow")}${fld("Título principal", "title")}${fld("Subtítulo", "sub")}${fld("Sobre nós", "about")}${fld("Endereço", "addr")}${fld("Instagram", "insta")}${fld("WhatsApp (com DDD)", "whats", "tel")}</div>
</div>

<div class="panel">
    <h3>Cores e fonte</h3>

    <div class="grid g2"><label>Tom principal dos marrons (matiz)<input type="range" min="0" max="360" data-c="hue" value="${store.cfg.hue}"></label><label>Cor de destaque<input type="color" data-c="accent" value="${store.cfg.accent}"></label><label>Fonte dos títulos<select data-c="head">${["'Playfair Display'", "'Cinzel'", "'Oswald'", "Georgia"].map((x) => `<option value="${x}" ${store.cfg.head === x ? "selected" : ""}>${x.replace(/'/g, "")}</option>`).join("")}</select></label></div>

    <h3>Poste</h3>

    <div class="grid g3"><label>Vermelho<input type="color" data-c="pr" value="${store.cfg.pr}"></label><label>Branco<input type="color" data-c="pw" value="${store.cfg.pw}"></label><label>Azul<input type="color" data-c="pb" value="${store.cfg.pb}"></label></div>
    <button class="btn ghost sm" data-a="pole">Restaurar poste clássico</button></div>

<div class="panel">
    <h3>Fotos</h3>

    <div class="grid g2">${store.imgs
        .map(
            (
                u,
                i,
            ) => `<label>Foto ${i + 1}<div class="thumb" style="background-image:url('${u}')"></div>
<input type="file" accept="image/*" data-img="${i}"></label>`,
        )
        .join("")}</div>
</div>`;
    }

    function horarios() {
        return `<div class="panel">
    <h3>Dias e horários de atendimento</h3>${store.hours.map((h, i) => `<div class="hr"><label class="ck"><input type="checkbox" data-h="${i}|o" ${h.o ? "checked" : ""}> ${DAYS[i]}</label><input type="time" data-h="${i}|a" value="${h.a}"><span>às</span><input type="time" data-h="${i}|c" value="${h.c}"></div>`).join("")}<p class="hint">Estes horários aparecem no site, na seção de contato e no início da página.</p>
</div>`;
    }

    function config() {
        return `<div class="panel">
    <h3>Segurança</h3>

    <p class="hint">A senha de acesso fica guardada de forma criptografada no servidor.</p>

    <div class="grid g2"><label>Senha atual<input id="pw1" type="password" autocomplete="current-password"></label><label>Nova senha (mínimo 8 caracteres)<input id="pw2" type="password" autocomplete="new-password"></label></div>

    <button class="btn" data-a="pw">Alterar senha</button>
</div>

<div class="panel">
    <h3>E-mail de recuperação</h3>

    <p class="hint">Usado em "Esqueci minha senha", na tela de login. Enviamos um link para este e-mail, nunca a senha.</p>

    ${mailConfigured ? "" : '<p class="hint">O envio de e-mail ainda não foi configurado no servidor (variáveis SMTP). Sem isso, o link não é enviado.</p>'}

    <div class="grid g2"><label>E-mail do proprietário<input id="em" type="email" autocomplete="email" value="${esc(recoveryEmail)}" placeholder="nome@exemplo.com"></label><label>Senha atual (para confirmar)<input id="em1" type="password" autocomplete="current-password"></label></div>

    <button class="btn" data-a="email">Salvar e-mail</button>
</div>

<div class="panel">
    <h3>Backup</h3>

    <p class="hint">Os dados ficam salvos no servidor. Exporte um backup de vez em quando.</p>

    <div class="btns"><button class="btn" data-a="exp">Exportar backup</button><label class="btn ghost">Importar backup<input type="file" accept=".json" data-imp hidden></label><button class="btn ghost" data-a="reset">Restaurar tudo ao padrão</button></div>
</div>`;
    }

    function panel() {
        app.innerHTML =
            head(
                `<a class="btn ghost sm" href="/" target="_blank" rel="noopener">Ver site</a><button class="btn ghost sm" data-a="out">Sair</button>`,
            ) +
            `<main class="page wide">
    <div class="eyebrow">Área do dono</div>

    <h1>Painel de controle</h1>

    ${defaultPassword ? `<div class="panel warn"><h3>Troque a senha padrão</h3><p>Você ainda está usando a senha inicial. Enquanto ela não for trocada, qualquer pessoa que saiba o endereço do painel consegue entrar. Troque agora em Configurações.</p><div class="btns"><button class="btn" data-a="tab" data-id="cf">Trocar senha agora</button></div></div>` : ""}

    <div class="tabs">${[
        ["ag", "Clientes"],
        ["sv", "Serviços"],
        ["ap", "Aparência do site"],
        ["hr", "Horários"],
        ["cf", "Configurações"],
    ]
        .map(
            ([k, l]) =>
                `<button class="${tab === k ? "on" : ""}" data-a="tab" data-id="${k}">${l}</button>`,
        )
        .join(
            "",
        )}</div>${{ ag: clientes, sv: servicos, ap: aparencia, hr: horarios, cf: config }[tab]()}</main>`;
        app.onclick = (e) => {
            const b = e.target.closest("button[data-a]");

            if (!b) return;
            const a = b.dataset.a,
                id = b.dataset.id;
            if (a === "tab") tab = id;
            else if (a === "f") f = id;
            else if (a === "out") {
                request("POST", "/api/admin/logout", {}).finally(() => {
                    location.href = "/admin/login";
                });

                return;
            } else if (a === "del") {
                if (!confirm("Excluir este agendamento?")) return;
                store.clients = store.clients.filter((x) => x.id !== id);

                save();
            } else if (a === "addsv") {
                store.services.push({
                    id: uid(),
                    n: "Novo serviço",
                    d: "",
                    p: 0,
                    m: 30,
                    a: true,
                });

                save();
            } else if (a === "delsv") {
                if (!confirm("Remover este serviço?")) return;
                store.services = store.services.filter((x) => x.id !== id);

                save();
            } else if (a === "addc") {
                const nm = select("#mn").value.trim(),
                    p = select("#mp").value,
                    s = store.services.find(
                        (x) => x.id === select("#ms").value,
                    ),
                    d = select("#md").value,
                    t = select("#mt").value;
                if (nm.length < 2 || digits(p).length < 10 || !d || !t)
                    return toast("Preencha nome, WhatsApp, dia e hora");
                const start = tm(t);

                if (
                    store.clients.some(
                        (x) =>
                            x.date === d &&
                            x.status !== "cancelado" &&
                            start < x.t + x.m &&
                            x.t < start + s.m,
                    )
                )
                    return toast("Esse horário já está ocupado");
                store.clients.push({
                    id: uid(),
                    name: nm,
                    phone: p,
                    sid: s.id,
                    date: d,
                    t: start,
                    m: s.m,
                    price: s.p,
                    status: "confirmado",
                    created: Date.now(),
                });

                save();

                toast("Cliente adicionado");
            } else if (a === "pole") {
                Object.assign(store.cfg, {
                    pr: "#c8102e",
                    pw: "#f7f4ee",
                    pb: "#1d3f8f",
                });

                save();

                theme();
            } else if (a === "email") {
                request("POST", "/api/admin/email", {
                    current: select("#em1").value,
                    email: select("#em").value.trim(),
                })
                    .then(() => {
                        recoveryEmail = select("#em").value.trim();

                        select("#em1").value = "";

                        toast("E-mail salvo");
                    })
                    .catch((error) => toast(error.message));

                return;
            } else if (a === "pw") {
                request("POST", "/api/admin/password", {
                    current: select("#pw1").value,
                    next: select("#pw2").value,
                })
                    .then(() => {
                        toast("Senha alterada");

                        defaultPassword = false;

                        panel();

                        select("#pw1").value = "";
                        select("#pw2").value = "";
                    })
                    .catch((error) => toast(error.message));

                return;
            } else if (a === "exp")
                return dl(
                    "backup-imperio-da-beleza.json",
                    JSON.stringify({
                        site: {
                            cfg: store.cfg,
                            hours: store.hours,
                            services: store.services,
                            imgs: store.imgs,
                        },
                        clients: store.clients,
                    }),
                    "application/json",
                );

            panel();
        };

        app.oninput = app.onchange = (e) => {
            const commit = e.type === "change" ? save : () => {};

            const t = e.target,
                d = t.dataset;
            if (d.c !== undefined) {
                store.cfg[d.c] = t.type === "number" ? +t.value : t.value;
                commit();

                theme();
            } else if (d.sv) {
                const [i, k] = d.sv.split("|"),
                    s = store.services.find((x) => x.id === i);
                s[k] =
                    k === "p" || k === "m"
                        ? +t.value
                        : k === "a"
                          ? t.checked
                          : t.value;
                commit();
            } else if (d.h) {
                const [i, k] = d.h.split("|");

                store.hours[i][k] = k === "o" ? (t.checked ? 1 : 0) : t.value;
                commit();
            } else if (d.st && e.type === "change") {
                store.clients.find((x) => x.id === d.st).status = t.value;
                commit();

                panel();
            } else if (
                d.img !== undefined &&
                e.type === "change" &&
                t.files[0]
            ) {
                const fr = new FileReader();

                fr.onload = () => {
                    const im = new Image();

                    im.onload = () => {
                        const k = Math.min(1, 1000 / im.width),
                            c = document.createElement("canvas");
                        c.width = im.width * k;
                        c.height = im.height * k;
                        c.getContext("2d").drawImage(
                            im,
                            0,
                            0,
                            c.width,
                            c.height,
                        );

                        request("POST", "/api/admin/upload", {
                            dataUrl: c.toDataURL("image/jpeg", 0.72),
                        })
                            .then((result) => {
                                store.imgs[+d.img] = result.path;
                                save();

                                theme();

                                panel();
                            })
                            .catch((error) => toast(error.message));
                    };

                    im.src = fr.result;
                };

                fr.readAsDataURL(t.files[0]);
            } else if (
                d.imp !== undefined &&
                e.type === "change" &&
                t.files[0]
            ) {
                const fr = new FileReader();

                fr.onload = () => {
                    try {
                        const data = JSON.parse(fr.result);

                        request("PUT", "/api/admin/data", data)
                            .then(() => location.reload())
                            .catch((error) => toast(error.message));
                    } catch (x) {
                        toast("Arquivo inválido");
                    }
                };

                fr.readAsText(t.files[0]);
            }
        };
    }

    panel();
}

let defaultPassword = false;

let recoveryEmail = "";

let mailConfigured = false;

async function start() {
    try {
        const data = await request("GET", "/api/admin/data");

        store = { ...data.site, clients: data.clients };

        defaultPassword = Boolean(data.defaultPassword);

        recoveryEmail = data.recoveryEmail || "";

        mailConfigured = Boolean(data.mailConfigured);

        theme();

        Admin();
    } catch (error) {
        toast(error.message);
    }
}

start();
