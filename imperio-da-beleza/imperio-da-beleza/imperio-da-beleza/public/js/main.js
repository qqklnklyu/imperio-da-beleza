try {
    if (localStorage.getItem("idb_contrast") === "1") {
        document.documentElement.classList.add("high-contrast");
    }
} catch (error) {}

// Dados cravados direto no Frontend (Site Vitrine 100% independente)
let store = {
  "cfg": {
    "name": "Império da Beleza",
    "eyebrow": "Barbearia",
    "title": "Confiança e conforto em cada corte.",
    "sub": "Um espaço para cuidar do visual sem pressa, com profissionais experientes.",
    "about": "Tradição de barbeiro com técnica moderna, em um ambiente pensado para você.",
    "whats": "5517999999999", 
    "insta": "@imperiodabeleza",
    "addr": "São José do Rio Preto, SP",
    "hue": 30
  },
  "hours": [
    {"o": 1, "a": "09:00", "c": "19:00"},
    {"o": 1, "a": "09:00", "c": "19:00"},
    {"o": 1, "a": "09:00", "c": "19:00"},
    {"o": 1, "a": "09:00", "c": "19:00"},
    {"o": 1, "a": "09:00", "c": "19:00"},
    {"o": 1, "a": "09:00", "c": "19:00"},
    {"o": 0, "a": "00:00", "c": "00:00"}
  ],
  "services": [
    {"id": "s1", "n": "Corte", "d": "Tesoura ou máquina, com acabamento.", "p": 40, "m": 40, "a": true},
    {"id": "s2", "n": "Barba", "d": "Toalha quente e navalha.", "p": 30, "m": 30, "a": true},
    {"id": "s3", "n": "Corte + Barba", "d": "O pacote completo.", "p": 70, "m": 70, "a": true}
  ],
  "imgs": [
    "/img/foto1.jpg",
    "/img/foto2.jpg",
    "/img/foto3.jpg",
    "/img/foto4.jpg"
  ]
};

function start() {
    // Como os dados já estão no "store" acima, não precisamos mais do fetch()
    theme();
    Site();
}

start();