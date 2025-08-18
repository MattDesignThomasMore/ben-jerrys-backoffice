<template>
  <div class="admin-shell" @keydown="onGlobalHotkeys">
    <!-- Sidebar -->
    <aside class="sidebar" aria-label="Hoofdnavigatie">
      <div class="brand" aria-label="Merk en omgeving">
        <span class="logo" aria-hidden="true">🍦</span>
        <div class="brand-text">
          <strong>Ben &amp; Jerry’s</strong>
          <span>Backoffice</span>
        </div>
      </div>

      <nav class="nav" role="navigation">
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

      <button type="button" class="btn-logout" @click="confirmLogout">🚪 Uitloggen</button>
    </aside>

    <!-- Content -->
    <main class="content">
      <header class="topbar" role="banner">
        <div class="title-wrap">
          <h1>Adminpaneel</h1>
          <p class="subtitle">Beheer van alle custom ijs-bestellingen</p>
        </div>

        <div class="topbar-actions only-desktop">
          <button
            type="button"
            class="btn"
            @click="refreshOrders"
            :aria-busy="isRefreshing ? 'true' : 'false'"
          >
            <span v-if="!isRefreshing">↻ Vernieuwen</span>
            <span v-else>Bezig…</span>
          </button>
          <button type="button" class="btn primary" @click="confirmLogout">Logout</button>
        </div>
      </header>

      <section id="orders" class="panel" aria-labelledby="orders-title">
        <div class="panel-header">
          <h2 id="orders-title">Alle bestellingen</h2>
        </div>

        <!-- CONTROLES -->
        <div class="controls" role="search">
          <div class="search-input">
            <span class="search-ico" aria-hidden="true">🔎</span>
            <input
              ref="search"
              v-model.trim="query"
              type="search"
              :placeholder="placeholder"
              inputmode="search"
              aria-label="Zoek op klantnaam (exacte match)"
              @input="debouncedFilter()"
              @keydown.enter.prevent
            />
            <button
              v-if="query"
              class="btn-clear"
              @click="clearSearch"
              aria-label="Zoekopdracht wissen"
            >
              ✕
            </button>
          </div>
          <div class="control-meta" role="status" aria-live="polite">
            <template v-if="!query">
              <span>Totaal: {{ totalCount }}</span>
            </template>
            <template v-else>
              <span>
                Naam-matches: <strong>{{ visibleCount }}</strong>
                <span class="muted">van {{ totalCount }}</span>
              </span>
            </template>
          </div>
          <div class="control-actions">
            <button class="btn ghost" @click="focusSearch" title="Sneltoets: /">/ Focus</button>
            <button class="btn ghost" @click="scrollTo('orders')">Naar boven</button>
          </div>
        </div>

        <!-- BELANGRIJK: alleen layout; functionaliteit <OrderList/> blijft identiek -->
        <div class="panel-body orders-grid" ref="ordersGrid">
          <OrderList />
          <!-- Lege-staat voor wanneer er geen exacte naam-match is -->
          <div v-if="query && visibleCount === 0" class="empty-state" aria-live="polite">
            <div class="empty-emoji" aria-hidden="true">🧁</div>
            <h3>Geen bestellingen voor “{{ query }}”</h3>
            <p class="muted">Controleer de spelling of wis de zoekopdracht om alles te tonen.</p>
            <button class="btn" @click="clearSearch">Alles weergeven</button>
          </div>
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
  name: 'AdminViewPro',
  components: { OrderList },
  data() {
    return {
      year: new Date().getFullYear(),
      query: '',
      totalCount: 0,
      visibleCount: 0,
      isRefreshing: false,
      debounceHandle: null,
      _observer: null,
    }
  },
  computed: {
    placeholder() {
      return 'Zoek op klantnaam (exacte match, druk / om te focussen)'
    },
  },
  mounted() {
    // Initialiseer filtering zodra OrderList in de DOM staat
    this.$nextTick(() => {
      this.indexOrders()
      this.applyFilter()
      this.observeOrderListMutations()
    })
  },
  beforeUnmount() {
    if (this._observer) this._observer.disconnect()
    if (this.debounceHandle) clearTimeout(this.debounceHandle)
  },
  methods: {
    // ---------- UX ----------
    confirmLogout() {
      if (confirm('Weet je zeker dat je wilt uitloggen?')) {
        localStorage.removeItem('token')
        this.$router.push('/login')
      }
    },
    refreshOrders() {
      // UI feedback – echte data-refresh blijft bij <OrderList/>
      this.isRefreshing = true
      requestAnimationFrame(() => {
        this.indexOrders()
        this.applyFilter()
        setTimeout(() => (this.isRefreshing = false), 350)
      })
    },
    scrollTo(id) {
      const el = this.$el.querySelector(`#${id}`)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    },
    onGlobalHotkeys(e) {
      if (e.key === '/') {
        e.preventDefault()
        this.focusSearch()
      } else if (e.key === 'Escape' && this.query) {
        this.clearSearch()
      }
    },
    focusSearch() {
      this.$refs.search?.focus()
    },
    clearSearch() {
      this.query = ''
      this.applyFilter()
      this.focusSearch()
    },
    debouncedFilter() {
      if (this.debounceHandle) clearTimeout(this.debounceHandle)
      this.debounceHandle = setTimeout(() => this.applyFilter(), 120)
    },

    // ---------- Kern: DOM-gebaseerde naam-filter zonder OrderList te wijzigen ----------
    // Selecteer alle potentiële order kaarten
    getOrderCards() {
      const root = this.$refs.ordersGrid
      if (!root) return []
      const selector = [
        '.order',
        '.order-item',
        '.order-card',
        '.list-item',
        'article',
        'section',
        'li',
      ]
        .map((s) => `:scope ${s}`)
        .join(',')

      const nodes = Array.from(root.querySelectorAll(selector)).filter((el) => {
        const rect = el.getBoundingClientRect()
        return (
          rect.width > 0 &&
          rect.height > 0 &&
          (el.innerText || el.textContent || '').trim().length > 0
        )
      })

      return nodes
    },

    // Normaliseer voor robuuste, accent-ongevoelige vergelijkingen
    norm(s) {
      return (s || '')
        .toString()
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .toLowerCase()
        .trim()
        .replace(/\s+/g, ' ')
    },

    // Probeer klantnaam uit een kaart te halen via meerdere strategieën
    extractCustomerName(card) {
      // 1) Expliciete attributen/selectors
      const byAttr = card.getAttribute('data-customer') || card.getAttribute('data-client') || null

      if (byAttr) return byAttr

      const sel = card.querySelector(
        [
          '.customer-name',
          '.customer',
          '[data-customer]',
          '[data-client]',
          '[aria-label*="Klant"]',
          '[aria-label*="klant"]',
          '[aria-labelledby*="klant"]',
        ].join(','),
      )
      if (sel && (sel.innerText || sel.textContent)) {
        return (sel.innerText || sel.textContent).trim()
      }

      // 2) Tekst-patronen in de kaart
      const text = (card.innerText || card.textContent || '').trim()
      // Veelvoorkomende labels: "Klant:", "Customer:", "Naam:"
      const m =
        text.match(/\b(?:Klant|Naam|Customer)\s*:\s*([^\n\r|•]+)/i) ||
        text.match(/\bBesteller\s*:\s*([^\n\r|•]+)/i)
      if (m && m[1]) return m[1].trim()

      // 3) Fallback: eerste sterke/naam-achtige heading
      const heading =
        card.querySelector('header h4, h3, .title, strong, b') ||
        card.querySelector('[role="heading"]')
      if (heading) {
        const guess = (heading.innerText || heading.textContent || '').trim()
        // Heuristiek: twee woorden => waarschijnlijk naam
        if (/\b\p{L}+\b\s+\b\p{L}+\b/u.test(guess)) return guess
      }

      return ''
    },

    // Indexeer kaarten + cache klantnaam en algemene zoektekst
    indexOrders() {
      const cards = this.getOrderCards()
      cards.forEach((el) => {
        const name = this.extractCustomerName(el)
        el.__customerNameRaw = name
        el.__customerName = this.norm(name)
        el.__searchText = this.norm(el.innerText || el.textContent || '')
      })
      this.totalCount = cards.length
      this.visibleCount = cards.filter((el) => !el.classList.contains('is-hidden')).length
    },

    // Toepassen van de naam-filter (exacte match, accent/hoofdletter-ongevoelig)
    applyFilter() {
      const cards = this.getOrderCards()
      if (!cards.length) return

      const q = this.norm(this.query)

      if (!q) {
        cards.forEach((el) => el.classList.remove('is-hidden'))
        this.visibleCount = cards.length
        return
      }

      let shown = 0

      for (const el of cards) {
        // Exacte match op klantnaam
        const name = el.__customerName ?? this.norm(this.extractCustomerName(el))
        const isExactNameMatch = name && name === q

        // (optioneel) als er geen expliciete naam gevonden is, kun je fallbacken op algemene tekst
        // maar we houden het strikt op naam zoals gevraagd:
        const hit = isExactNameMatch

        el.classList.toggle('is-hidden', !hit)
        if (hit) shown++
      }

      this.visibleCount = shown
    },

    observeOrderListMutations() {
      const root = this.$refs.ordersGrid
      if (!root || this._observer) return
      this._observer = new MutationObserver(() => {
        // Wanneer OrderList wijzigt (laden/toevoegen/verwijderen), re-indexeer en her-filter
        this.indexOrders()
        this.applyFilter()
      })
      this._observer.observe(root, { childList: true, subtree: true, characterData: true })
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
.topbar-actions {
  display: flex;
  gap: 0.5rem;
}

/* ---------- Button ----------- */
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
.btn.ghost {
  background: transparent;
}

/* ---------- Panel ---------- */
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

/* ---------- Controls (zoek/filter) ---------- */
.controls {
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: 12px;
  align-items: center;
  margin: 0 2rem 1rem;
}
.search-input {
  position: relative;
  display: flex;
  align-items: center;
}
.search-ico {
  position: absolute;
  left: 12px;
  pointer-events: none;
  opacity: 0.7;
}
.search-input input[type='search'] {
  width: 100%;
  appearance: none;
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 0.7rem 2.2rem 0.7rem 2rem;
  line-height: 1.3;
  font-size: 1rem;
  transition:
    border-color 120ms ease,
    box-shadow 120ms ease;
}
.search-input input:focus {
  outline: none;
  border-color: #c7d2fe;
  box-shadow: var(--ring);
}
.btn-clear {
  position: absolute;
  right: 8px;
  border: 0;
  background: transparent;
  font-size: 1rem;
  cursor: pointer;
  padding: 0.25rem 0.4rem;
}
.control-meta {
  color: var(--muted);
  font-size: 0.95rem;
}
.control-meta .muted {
  color: var(--muted);
}
.control-actions {
  display: flex;
  gap: 8px;
}

/* =======================================================================
   GRID VOOR ORDERLIJST
   ======================================================================= */
.orders-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(460px, 1fr));
  gap: 24px;
  align-content: start;
}
.orders-grid > * {
  display: contents;
}

/* Kaarten — breed geselecteerd */
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

/* Controls in kaart */
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

/* Buttons in kaart */
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
}
.orders-grid :deep(a:hover) {
  color: var(--primary-600);
  border-color: rgba(37, 99, 235, 0.55);
}

/* Filter resultaat verbergen */
.is-hidden {
  display: none !important;
}

/* Lege-staat */
.empty-state {
  grid-column: 1 / -1;
  border: 1px dashed var(--border);
  border-radius: 16px;
  padding: 2rem;
  text-align: center;
  background: var(--surface-2);
}
.empty-state .empty-emoji {
  font-size: 2rem;
  margin-bottom: 0.25rem;
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
  .controls {
    margin: 0 1.25rem 1rem;
    grid-template-columns: 1fr auto;
    grid-auto-flow: row;
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
