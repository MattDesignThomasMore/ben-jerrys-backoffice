<template>
  <div class="admin-shell">
    <!-- Sidebar -->
    <aside class="sidebar" aria-label="Hoofdnavigatie">
      <div class="brand">
        <span class="logo" aria-hidden="true">🍦</span>
        <div class="brand-text">
          <strong>Ben &amp; Jerry’s</strong>
          <span>Backoffice</span>
        </div>
      </div>

      <nav class="nav">
        <button type="button" class="nav-item active" @click="scrollTo('orders')">
          <span class="nav-ico">📦</span>
          <span>Bestellingen</span>
        </button>
        <button type="button" class="nav-item" disabled>
          <span class="nav-ico">📊</span>
          <span>Rapporten</span>
          <span class="badge">binnenkort</span>
        </button>
        <button type="button" class="nav-item" disabled>
          <span class="nav-ico">⚙️</span>
          <span>Instellingen</span>
        </button>
        <button type="button" class="nav-item" disabled>
          <span class="nav-ico">❓</span>
          <span>Help</span>
        </button>
      </nav>

      <div class="sidebar-spacer"></div>

      <button type="button" class="btn-logout" @click="logout">🚪 Uitloggen</button>
    </aside>

    <!-- Content -->
    <main class="content">
      <header class="topbar">
        <div class="title-wrap">
          <h1>Adminpaneel</h1>
          <p class="subtitle">Beheer van alle custom ijs-bestellingen</p>
        </div>

        <button type="button" class="btn primary only-desktop" @click="logout">Logout</button>
      </header>

      <section id="orders" class="panel">
        <div class="panel-header">
          <h2>Alle bestellingen</h2>
        </div>

        <!-- BELANGRIJK: alleen layout; functionaliteit <OrderList/> blijft identiek -->
        <div class="panel-body orders-grid">
          <OrderList />
        </div>
      </section>

      <footer class="footer">
        <span>© {{ year }} Ben &amp; Jerry’s – Backoffice</span>
      </footer>
    </main>
  </div>
</template>

<script>
import OrderList from '../components/OrderList.vue'

export default {
  name: 'AdminView',
  components: { OrderList },
  data() {
    return { year: new Date().getFullYear() }
  },
  methods: {
    logout() {
      localStorage.removeItem('token')
      this.$router.push('/login')
    },
    scrollTo(id) {
      const el = this.$el.querySelector(`#${id}`)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    },
  },
}
</script>

<style scoped>
/* ---------- Design tokens ---------- */
.admin-shell {
  --bg: #f6f7fb;
  --surface: #ffffff;
  --surface-2: #f3f4f6;
  --text: #0f172a;
  --muted: #64748b;
  --border: #e5e7eb;

  --primary: #2563eb;
  --primary-600: #1d4ed8;
  --primary-50: #eff6ff;

  --success: #10b981;
  --warning: #f59e0b;
  --danger: #e11d48;

  --radius: 16px;
  --shadow-sm: 0 1px 2px rgba(16, 24, 40, 0.06);
  --shadow-md: 0 10px 26px rgba(16, 24, 40, 0.1);
  --ring: 0 0 0 4px rgba(37, 99, 235, 0.15);

  min-height: 100vh;
  display: grid;
  grid-template-columns: 300px 1fr;
  background:
    radial-gradient(1200px 500px at -10% -10%, #e8efff 0%, transparent 50%),
    radial-gradient(1000px 400px at 110% 0%, #eaf7ff 0%, transparent 55%), var(--bg);
  color: var(--text);
}

/* ---------- Sidebar ---------- */
.sidebar {
  position: sticky;
  top: 0;
  height: 100vh;
  background: var(--surface);
  border-right: 1px solid var(--border);
  padding: 1.25rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 0.5rem;
  border-radius: 12px;
}
.logo {
  display: grid;
  place-items: center;
  font-size: 1.4rem;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: var(--primary-50);
  box-shadow: var(--shadow-sm);
}
.brand-text {
  line-height: 1.1;
}
.brand-text strong {
  display: block;
  font-size: 1rem;
}
.brand-text span {
  display: block;
  color: var(--muted);
  font-size: 0.85rem;
}

.nav {
  display: grid;
  gap: 0.25rem;
}
.nav-item {
  width: 100%;
  display: grid;
  grid-template-columns: 22px 1fr auto;
  gap: 0.75rem;
  align-items: center;
  text-align: left;
  padding: 0.7rem 0.8rem;
  border-radius: 12px;
  border: 1px solid transparent;
  background: transparent;
  color: var(--text);
  cursor: pointer;
  transition:
    border-color 120ms ease,
    background 120ms ease,
    transform 120ms ease;
}
.nav-item .nav-ico {
  opacity: 0.9;
}
.nav-item:hover {
  background: var(--surface-2);
}
.nav-item:focus-visible {
  outline: none;
  box-shadow: var(--ring);
}
.nav-item.active {
  background: #f0f5ff;
  border-color: #dbe7ff;
}
.nav-item[disabled] {
  opacity: 0.55;
  cursor: not-allowed;
}
.badge {
  justify-self: end;
  font-size: 0.7rem;
  padding: 0.15rem 0.45rem;
  border-radius: 999px;
  background: var(--surface-2);
  color: var(--muted);
  border: 1px dashed var(--border);
}

.sidebar-spacer {
  flex: 1;
}

.btn-logout {
  width: 100%;
  border: 1px solid #fbe3e7;
  background: linear-gradient(180deg, #fff 0%, #fff 60%, #fff5f6 100%);
  color: var(--danger);
  padding: 0.7rem 1rem;
  border-radius: 12px;
  font-weight: 700;
  cursor: pointer;
  transition:
    transform 120ms ease,
    box-shadow 120ms ease,
    background 120ms ease;
}
.btn-logout:hover {
  box-shadow: var(--shadow-sm);
  transform: translateY(-1px);
}
.btn-logout:active {
  transform: translateY(0);
}

/* ---------- Topbar ---------- */
.content {
  min-width: 0;
  display: grid;
  grid-template-rows: auto 1fr auto;
}
.topbar {
  position: sticky;
  top: 0;
  z-index: 10;
  backdrop-filter: saturate(150%) blur(6px);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.9));
  border-bottom: 1px solid var(--border);
  padding: 1rem 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.title-wrap h1 {
  font-size: 1.4rem;
  margin: 0;
}
.subtitle {
  margin: 0.15rem 0 0;
  color: var(--muted);
  font-size: 0.95rem;
}

/* ---------- Button ---------- */
.btn {
  appearance: none;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text);
  padding: 0.6rem 1rem;
  border-radius: 12px;
  font-weight: 700;
  cursor: pointer;
  transition:
    box-shadow 120ms ease,
    transform 120ms ease,
    background 120ms ease,
    border-color 120ms ease;
}
.btn:hover {
  background: var(--surface-2);
}
.btn:focus-visible {
  outline: none;
  box-shadow: var(--ring);
}
.btn.primary {
  background: linear-gradient(180deg, #3b82f6 0%, var(--primary) 100%);
  color: #fff;
  border: 1px solid var(--primary-600);
}
.btn.primary:hover {
  filter: brightness(0.98);
  transform: translateY(-1px);
}
.btn.primary:active {
  transform: translateY(0);
}

/* ---------- Panel ---------- */
/* Max-breedte loslaten zodat alles écht over het hele vlak kan */
.panel {
  max-width: none;
  margin: 1.5rem 2rem 2rem;
  padding: 0 0 2rem;
}
.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin: 1.5rem 0 0.75rem;
}
.panel-header h2 {
  margin: 0;
  font-size: 1.1rem;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.panel-body {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow-md);
  padding: 1.5rem;
}

/* =======================================================================
   MEGA BREDE GRID VOOR ORDERLIJST
   - vult het hele paneel
   - grote, duidelijke kaarten
   - responsive van 1 -> 5 kolommen
   ======================================================================= */
.orders-grid {
  display: grid;
  /* Grote cellen die prettig lezen; wordt 2-5 kolommen afhankelijk van breedte */
  grid-template-columns: repeat(auto-fill, minmax(460px, 1fr));
  gap: 24px;
  align-content: start;
}

/* Flatten eventuele wrapper(s) van <OrderList/> zodat de 'order cards' zelf grid-items worden */
.orders-grid > * {
  display: contents;
}

/* Kaarten — zo breed mogelijk selecteren zodat het werkt ongeacht klassenaam */
.orders-grid :deep(.order),
.orders-grid :deep(.order-item),
.orders-grid :deep(.order-card),
.orders-grid :deep(.list-item),
.orders-grid :deep(article),
.orders-grid :deep(section),
.orders-grid :deep(li) {
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 1.1rem 1.2rem;
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 140px;
}

/* Typografie & spacing in de kaart */
.orders-grid :deep(h3),
.orders-grid :deep(.title),
.orders-grid :deep(header h4) {
  margin: 0 0 6px 0;
  font-size: 1.15rem;
  line-height: 1.25;
}
.orders-grid :deep(p) {
  color: var(--muted);
  margin: 0;
  font-size: 1rem;
}

/* Form controls in de kaart */
.orders-grid :deep(select),
.orders-grid :deep(input[type='text']),
.orders-grid :deep(input[type='number']) {
  appearance: none;
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 0.55rem 0.7rem;
  line-height: 1.3;
  font-size: 1rem;
  transition:
    border-color 120ms ease,
    box-shadow 120ms ease;
}
.orders-grid :deep(select:focus),
.orders-grid :deep(input:focus) {
  outline: none;
  border-color: #c7d2fe;
  box-shadow: var(--ring);
}

/* Buttons in de kaart */
.orders-grid :deep(button) {
  appearance: none;
  border: 1px solid var(--border);
  background: linear-gradient(180deg, #fff 0%, #f8fafc 100%);
  color: var(--text);
  padding: 0.55rem 0.85rem;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 700;
  transition:
    transform 120ms ease,
    box-shadow 120ms ease,
    background 120ms ease,
    border-color 120ms ease;
}
.orders-grid :deep(button:hover) {
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}
.orders-grid :deep(button:active) {
  transform: translateY(0);
}
.orders-grid :deep(button.danger),
.orders-grid :deep(button[aria-label*='Verwijderen']),
.orders-grid :deep(button[data-variant='danger']) {
  border-color: #ffd6de;
  background: linear-gradient(180deg, #fff 0%, #fff5f7 100%);
  color: var(--danger);
}

/* Links */
.orders-grid :deep(a) {
  color: var(--primary);
  font-weight: 700;
  text-decoration: none;
  border-bottom: 1px dashed rgba(37, 99, 235, 0.35);
  transition:
    color 120ms ease,
    border-color 120ms ease;
}
.orders-grid :deep(a:hover) {
  color: var(--primary-600);
  border-color: rgba(37, 99, 235, 0.55);
}

/* ---------- Footer ---------- */
.footer {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem 2rem;
  color: var(--muted);
  font-size: 0.9rem;
}

/* ---------- Responsiveness ---------- */
@media (max-width: 1440px) {
  .orders-grid {
    grid-template-columns: repeat(auto-fill, minmax(420px, 1fr));
  }
}
@media (max-width: 1180px) {
  .admin-shell {
    grid-template-columns: 260px 1fr;
  }
  .panel {
    margin: 1rem 1.25rem 1.5rem;
  }
  .orders-grid {
    grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
    gap: 20px;
  }
}
@media (max-width: 860px) {
  .admin-shell {
    grid-template-columns: 1fr;
  }
  .sidebar {
    position: static;
    height: auto;
    border-right: 0;
    border-bottom: 1px solid var(--border);
    border-radius: 0 0 var(--radius) var(--radius);
  }
  .topbar {
    position: static;
  }
  .only-desktop {
    display: none;
  }
  .orders-grid {
    grid-template-columns: 1fr;
    gap: 14px;
  }
}

/* Toegankelijkheidsvoorkeuren */
@media (prefers-reduced-motion: reduce) {
  * {
    transition: none !important;
  }
}
</style>
