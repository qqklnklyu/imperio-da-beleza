const DAYS = [
    "Domingo",
    "Segunda",
    "Terça",
    "Quarta",
    "Quinta",
    "Sexta",
    "Sábado",
];
let store;
const select = (selector, root = document) => root.querySelector(selector),
    selectAll = (selector, root = document) => [
        ...root.querySelectorAll(selector),
    ];
const esc = (s) =>
    String(s ?? "").replace(
        /[&<>"']/g,
        (c) =>
            ({
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;",
            })[c],
    );
const money = (v) =>
    v > 0 ? "R$ " + Number(v).toFixed(2).replace(".", ",") : "Consulte";
const pad = (n) => String(n).padStart(2, "0"),
    hm = (m) => pad(Math.floor(m / 60)) + ":" + pad(m % 60),
    tm = (s) => {
        const [a, b] = s.split(":");

        return +a * 60 + +b;
    };
const ymd = (d) =>
    d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
const pd = (s) => {
    const [y, m, d] = s.split("-");

    return new Date(+y, m - 1, +d);
};

const dateBR = (s) => {
    const d = pd(s);

    return (
        DAYS[d.getDay()] + ", " + pad(d.getDate()) + "/" + pad(d.getMonth() + 1)
    );
};

const digits = (s) => String(s || "").replace(/\D/g, "");

const uid = () =>
    Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
let tt;
function toast(m) {
    const t = select("#toast");

    t.textContent = m;
    t.classList.add("on");

    clearTimeout(tt);

    tt = setTimeout(() => t.classList.remove("on"), 2600);
}

function waLink(t, num) {
    const n = digits(num || store.cfg.whats);

    if (!n) return "";
    return (
        "https://wa.me/" +
        (n.length <= 11 ? "55" + n : n) +
        "?text=" +
        encodeURIComponent(t)
    );
}

function theme() {
    const c = store.cfg,
        h = +c.hue,
        st = document.documentElement.style,
        set = (k, v) => st.setProperty(k, v);
    set("--c1", `hsl(${h} 40% 61.8%)`);

    set("--c2", `hsl(${h} 42% 38.2%)`);

    set("--c3", `hsl(${h} 32% 23.6%)`);

    set("--c4", `hsl(${h - 2} 26% 14.6%)`);

    set("--c5", `hsl(${h - 2} 22% 9%)`);

    set("--c6", `hsl(${h - 2} 20% 5.6%)`);

    set("--cream", `hsl(${h + 8} 42% 88%)`);

    set("--muted", `hsl(${h + 6} 16% 68%)`);

    set("--r", c.accent);

    set("--pr", c.pr);

    set("--pw", c.pw);

    set("--pb", c.pb);

    set("--serif", c.head + ",Georgia,serif");

    store.imgs.forEach((u, i) => set("--img" + (i + 1), `url("${u}")`));
}

function dl(name, txt, type) {
    const u = URL.createObjectURL(new Blob([txt], { type }));

    const a = document.createElement("a");

    a.href = u;
    a.download = name;
    a.click();

    setTimeout(() => URL.revokeObjectURL(u), 500);
}

function hourText(value) {
    const [h, m] = value.split(":");

    return m === "00" ? `${+h}h` : `${+h}h${m}`;
}

function hoursLabel() {
    const open = store.hours.map((h, i) => ({ h, i })).filter((x) => x.h.o);

    if (!open.length) return "";
    const first = open[0].h;
    const same = open.every((x) => x.h.a === first.a && x.h.c === first.c);

    const names = open.map((x) => DAYS[x.i].slice(0, 3));

    const contiguous = open.every(
        (x, k) => k === 0 || x.i === open[k - 1].i + 1,
    );

    const days =
        contiguous && open.length > 2
            ? `${names[0]} a ${names[names.length - 1]}`
            : names.join(", ");
    return same
        ? `${days} · ${hourText(first.a)} às ${hourText(first.c)}`
        : days;
}

function scheduleLink(serviceName) {
    const text = serviceName
        ? `Olá! Gostaria de agendar *${serviceName}* no ${store.cfg.name}. Qual horário você tem disponível?`
        : `Olá! Gostaria de agendar um horário no ${store.cfg.name}. Qual horário você tem disponível?`;

    return waLink(text);
}

function mapsLink() {
    return (
        "https://www.google.com/maps/search/?api=1&query=" +
        encodeURIComponent(store.cfg.addr)
    );
}
