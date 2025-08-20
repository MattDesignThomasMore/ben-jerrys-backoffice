# 🧁 Ben & Jerry’s Admin Dashboard – Backoffice App

De **Ben & Jerry’s Backoffice** is een Vue 3-applicatie ontworpen voor admins om bestellingen te beheren die binnenkomen via de Ice Configurator.

---

## 🧱 Tech Stack

- **Framework:** Vue 3 (via Vite)
- **Routing:** Vue Router
- **Styling:** Custom CSS
- **Data Fetching:** Fetch API naar eigen Node.js + Express API
- **State Handling:** Simpele component state (geen Vuex of Pinia vereist)
- **Deployment-ready:** Geoptimaliseerd voor platforms zoals Vercel of Netlify

---

## 🔧 Functionaliteiten

- 📦 Overzicht van alle binnengekomen bestellingen
- 🔍 Detailweergave per bestelling (naam, adres, totaalprijs)
- 🚦 Mogelijkheid om bestellingen van status te veranderen (verzonden, geannuleerd, te verwerken)
- ❌ Bestellingen verwijderen uit de database
- 🔐 Alleen toegankelijk voor admingebruik

---

## 🔌 API Communicatie

Alle data wordt opgehaald en verzonden via de externe [Ben & Jerry’s API](https://github.com/MattDesignThomasMore/ben-jerrys-api), gebouwd met Node.js en Express en gekoppeld aan MongoDB.

---

## 🗂️ Projectstructuur

```bash
src/
├── components/           # OrderCard, UI componenten
├── views/                # AdminView, OrderDetailView, ...
├── router/               # Vue Router configuratie
├── App.vue               # Rootcomponent
└── main.js               # App initialisatie
```

## 🚀 Starten

```bash
npm install
npm run dev
```

---

## 🍨 Live Backoffice

De backoffice is live beschikbaar via Render:  
👉 [Ben & Jerry's Backoffice](https://ben-jerrys-backoffice.onrender.com/)
