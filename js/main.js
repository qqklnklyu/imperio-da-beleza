const root = document.documentElement;

const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;

const pole = document.getElementById("pole");

const conv = document.getElementById("conv");

const dots = document.getElementById("dots");

const cards = [...document.querySelectorAll(".card")];

const sections = [...document.querySelectorAll("section")];

const navLinks = [...document.querySelectorAll(".nav-links a")];

const menuButton = document.getElementById("menuButton");

const navList = document.getElementById("navLinks");

const contrastButton = document.getElementById("contrastButton");

let target = 0;

let current = 0;

try {
    if (localStorage.getItem("idb_contrast") === "1") {
        root.classList.add("high-contrast");
    }
} catch (error) {}

function syncContrast() {
    contrastButton.setAttribute(
        "aria-pressed",
        root.classList.contains("high-contrast"),
    );
}

contrastButton.addEventListener("click", () => {
    const on = root.classList.toggle("high-contrast");

    try {
        localStorage.setItem("idb_contrast", on ? "1" : "0");
    } catch (error) {}

    syncContrast();
});

syncContrast();

function toggleMenu(force) {
    const open = navList.classList.toggle("active", force);

    menuButton.classList.toggle("x", open);

    menuButton.setAttribute("aria-expanded", open);
}

menuButton.addEventListener("click", () => toggleMenu());

navList.addEventListener("click", (event) => {
    if (event.target.closest("a")) toggleMenu(false);
});

cards.forEach(() => dots.appendChild(document.createElement("i")));

function ease(t) {
    t = t * t * (3 - 2 * t);

    return t * t * (3 - 2 * t);
}

function calculate() {
    const tops = sections.map((s) => s.getBoundingClientRect().top + scrollY);

    const y = scrollY + innerHeight * 0.15;

    let f = 0;

    for (let k = 0; k < tops.length - 1; k++) {
        if (y >= tops[k] && y < tops[k + 1]) {
            f = k + ease((y - tops[k]) / (tops[k + 1] - tops[k]));
        }
    }

    if (y >= tops[tops.length - 1]) f = tops.length - 1;

    target = Math.min(f, cards.length - 1);

    const n = Math.round(target);

    [...dots.children].forEach((d, i) => d.classList.toggle("on", i === n));

    navLinks.forEach((a, i) => a.classList.toggle("on", i === n));
}

function loop() {
    current = calm ? target : current + (target - current) * 0.08;

    const spread = conv.clientWidth * 0.95;

    cards.forEach((card, i) => {
        const d = i - current;

        const a = Math.abs(d);

        card.style.opacity = Math.max(0, 1 - a * 1.15);

        card.style.transform = `translate(calc(-50% + ${-d * spread}px), -50%) scale(${1 - Math.min(a, 1) * 0.05})`;
    });

    pole.style.backgroundPosition = `0 ${-(current * innerHeight * 0.6 + scrollY * 0.15)}px`;

    requestAnimationFrame(loop);
}

const observer = new IntersectionObserver(
    (entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;

            entry.target.classList.add("in");

            observer.unobserve(entry.target);
        });
    },
    { threshold: 0.15 },
);

document.querySelectorAll(".rv").forEach((el) => observer.observe(el));

addEventListener("scroll", calculate, { passive: true });

addEventListener("resize", calculate);

calculate();

loop();
