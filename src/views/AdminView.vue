<template>
  <div class="admin-shell" @keydown="onGlobalHotkeys">
    <!-- Sidebar -->
    <aside class="sidebar" aria-label="Hoofdnavigatie">
      <div class="brand" aria-label="Merk en omgeving">
        <span class="logo" aria-hidden="true">
          <img
            src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS5qSSSB_FtpaYm4-ETjGLbkpmDbHX45ewlIw&s"
            alt="Logo"
            style="width: 1.5em; height: 1.5em; vertical-align: middle"
          />
        </span>

        <div class="brand-text">
          <strong>Ben &amp; Jerry’s</strong>
          <span>Backoffice</span>
        </div>
      </div>

      <nav class="nav" role="navigation">
        <button
          type="button"
          class="nav-item active"
          aria-current="page"
          @click="scrollTo('orders')"
        >
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

      <div class="sidebar-spacer" aria-hidden="true"></div>
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

      <section id="orders" class="panel" aria-label="Bestellingen">
        <!-- Header: zoekbalk neemt de volledige plek in -->
        <div class="panel-header">
          <div class="controls controls--inline" role="search" aria-label="Zoeken en acties">
            <div class="search-input">
              <span class="search-ico" aria-hidden="true">🔎</span>
              <input
                ref="search"
                v-model.trim="query"
                type="search"
                :placeholder="placeholder"
                inputmode="search"
                aria-label="Zoek op klantnaam"
                @input="debouncedFilter()"
                @keydown.enter.prevent
              />
              <button
                v-if="query"
                class="btn-clear"
                @click="clearSearch"
                aria-label="Zoekopdracht wissen"
                title="Wissen (Esc)"
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
              <button class="btn ghost" @click="scrollToBottom">Naar beneden</button>
            </div>
          </div>
        </div>

        <!-- LAYOUT; <OrderList/> blijft identiek -->
        <div class="panel-body orders-grid" ref="ordersGrid">
          <OrderList />
          <!-- Lege-staat -->
          <div v-if="query && visibleCount === 0" class="empty-state" aria-live="polite">
            <div class="empty-emoji" aria-hidden="true">🧁</div>
            <h3>Geen bestellingen voor “{{ query }}”</h3>
            <p class="muted">Controleer de spelling of wis de zoekopdracht om alles te tonen.</p>
            <button class="btn primary" @click="clearSearch">Alles weergeven</button>
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
      return 'Zoek op klantnaam…'
    },
  },
  mounted() {
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
    /* ---------- UX ---------- */
    confirmLogout() {
      if (confirm('Weet je zeker dat je wilt uitloggen?')) {
        localStorage.removeItem('token')
        this.$router.push('/login')
      }
    },
    refreshOrders() {
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
    /* NIEUW: naar beneden */
    scrollToBottom() {
      window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' })
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
      this.debounceHandle = setTimeout(() => this.applyFilter(), 100)
    },

    /* ---------- Helpers ---------- */
    norm(s) {
      return (s || '')
        .toString()
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .toLowerCase()
        .trim()
        .replace(/\s+/g, ' ')
    },

    // Vind de visuele kaart-root (border/radius/schaduw/padding)
    findCardRoot(node, gridRoot) {
      let el = node
      const visited = new Set()
      while (el && el !== gridRoot && el.nodeType === 1 && !visited.has(el)) {
        visited.add(el)
        const cs = getComputedStyle(el)

        if (cs.display !== 'contents') {
          const hasRadius =
            parseFloat(cs.borderTopLeftRadius) >= 8 || parseFloat(cs.borderRadius) >= 8
          const hasShadow = cs.boxShadow && cs.boxShadow !== 'none'
          const hasBorder =
            ['solid', 'dashed', 'double'].includes(cs.borderTopStyle) ||
            ['solid', 'dashed', 'double'].includes(cs.borderLeftStyle)
          const pad =
            parseFloat(cs.paddingTop) +
            parseFloat(cs.paddingRight) +
            parseFloat(cs.paddingBottom) +
            parseFloat(cs.paddingLeft)
          const hasPadding = pad >= 8

          const bg = cs.backgroundColor
          const m = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([0-9.]+))?\)/i)
          const alpha = m ? (m[4] === undefined ? 1 : parseFloat(m[4])) : 1
          const opaqueBg = alpha > 0.05

          const looksLikeCard = (hasShadow || hasRadius || hasBorder) && hasPadding && opaqueBg
          if (looksLikeCard) return el
        }

        el = el.parentElement
      }
      return null
    },

    // Verzamel ALLE kaarten (ook verborgen) zodat filter steeds werkt
    getOrderCards() {
      const root = this.$refs.ordersGrid
      if (!root) return []

      const allNodes = Array.from(root.querySelectorAll('*'))
      const cardSet = new Set()

      for (const el of allNodes) {
        const txt = (el.innerText || el.textContent || '').trim()
        if (txt.length < 10) continue // te weinig inhoud
        const card = this.findCardRoot(el, root)
        if (card) cardSet.add(card)
      }

      return Array.from(cardSet)
    },

    // Klantnaam uit kaart halen
    extractCustomerName(card) {
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
          'header h4',
          'h3',
          '.title',
          'strong',
          'b',
          '[role="heading"]',
        ].join(','),
      )
      if (sel) {
        const guess = (sel.innerText || sel.textContent || '').trim()
        if (/\b\p{L}+\b(?:\s+\p{L}+\b)+/u.test(guess)) return guess
      }

      const text = (card.innerText || card.textContent || '').trim()
      const m = text.match(/\b(?:Klant|Naam|Customer|Besteller)\s*:\s*([^\n\r|•]+)/i)
      if (m && m[1]) return m[1].trim()

      return ''
    },

    // Indexeer kaarten + cache naam
    indexOrders() {
      const cards = this.getOrderCards()
      cards.forEach((el) => {
        const raw = this.extractCustomerName(el)
        el.__customerNameRaw = raw
        el.__customerName = this.norm(raw)
      })
      this.totalCount = cards.length
      this.visibleCount = cards.filter(
        (el) => !el.classList.contains('is-hidden') && !el.hidden,
      ).length
    },

    // Deel-match standaard (AND op woorden); exact met ="..." of "..."
    applyFilter() {
      const cards = this.getOrderCards()
      const rawQ = (this.query || '').trim()
      const qNormalized = this.norm(rawQ)

      if (!qNormalized) {
        for (const el of cards) {
          el.classList.remove('is-hidden')
          el.hidden = false
          el.setAttribute('aria-hidden', 'false')
        }
        this.visibleCount = cards.length
        return
      }

      // Exacte modus?
      let exact = false
      let qExact = qNormalized
      if (rawQ.startsWith('=') && rawQ.length > 1) {
        exact = true
        qExact = this.norm(rawQ.slice(1))
      } else if (
        (rawQ.startsWith('"') && rawQ.endsWith('"') && rawQ.length > 1) ||
        (rawQ.startsWith('“') && rawQ.endsWith('”') && rawQ.length > 1)
      ) {
        exact = true
        qExact = this.norm(rawQ.slice(1, -1))
      }

      const tokens = exact ? [] : qNormalized.split(' ').filter(Boolean)

      let shown = 0
      for (const el of cards) {
        const name = el.__customerName ?? this.norm(this.extractCustomerName(el))
        let hit = false
        if (exact) {
          hit = !!name && name === qExact
        } else {
          hit = !!name && tokens.every((t) => name.includes(t))
        }

        el.classList.toggle('is-hidden', !hit) // CSS fallback (scoped-safe met :deep)
        el.hidden = !hit // native verbergen
        el.setAttribute('aria-hidden', hit ? 'false' : 'true')

        if (hit) shown++
      }
      this.visibleCount = shown
    },

    observeOrderListMutations() {
      const root = this.$refs.ordersGrid
      if (!root || this._observer) return
      this._observer = new MutationObserver(() => {
        this.indexOrders()
        this.applyFilter()
      })
      this._observer.observe(root, { childList: true, subtree: true, characterData: true })
    },
  },
}
</script>

<style scoped>
/* -------------------------------------------------
   BEN & JERRY’S — DELUXE UI THEME
   Visueel fris, toegankelijk, responsief, dark-mode aware
   ------------------------------------------------- */

/* Fonts */
@import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@500;700&family=Nunito:wght@400;600;700;800&display=swap');

/* -------------- Design Tokens -------------- */
.admin-shell {
  /* Base palette (light) */
  --sky: #6ecff6;
  --navy: #003a8c;
  --pink: #f9a7c3;
  --yellow: #ffd166;
  --mint: #a7f9b7;
  --choco: #6b4e3d;

  --text: #0d1b2a;
  --muted: #5b7083;

  --surface: #ffffff;
  --surface-2: #f7fbff;
  --surface-3: #eef7ff;
  --border: #e4eef7;

  --primary: #0a3a7a;
  --primary-contrast: #fff;

  --radius: 20px;
  --radius-sm: 14px;
  --radius-lg: 26px;

  --shadow-xs: 0 1px 3px rgba(13, 27, 42, 0.08);
  --shadow-sm: 0 2px 10px rgba(13, 27, 42, 0.06);
  --shadow-md: 0 16px 36px rgba(13, 27, 42, 0.12);
  --shadow-lg: 0 28px 64px rgba(13, 27, 42, 0.16);

  --ring: 0 0 0 4px rgba(110, 207, 246, 0.28);
  --ring-strong: 0 0 0 4px rgba(0, 123, 255, 0.35);

  --ease: cubic-bezier(0.2, 0.8, 0.2, 1);
  --ease-snap: cubic-bezier(0.15, 0.9, 0.1, 1);

  color-scheme: light;
}

@media (prefers-color-scheme: dark) {
  .admin-shell {
    --text: #e6eef6;
    --muted: #a9bbcf;

    --surface: #0f1723;
    --surface-2: #0b1220;
    --surface-3: #0e1a2b;
    --border: #203048;

    --primary: #9bd8ff;
    --primary-contrast: #0a243e;

    --ring: 0 0 0 4px rgba(110, 207, 246, 0.35);
    --ring-strong: 0 0 0 4px rgba(110, 207, 246, 0.45);

    color-scheme: dark;
  }
}

/* -------------- Layout Shell -------------- */
.admin-shell {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 300px 1fr;
  background:
    radial-gradient(120% 70% at 0% 0%, rgba(255, 255, 255, 0.85) 0%, rgba(255, 255, 255, 0) 50%),
    radial-gradient(80% 48% at 100% 0%, rgba(255, 255, 255, 0.75) 0%, rgba(255, 255, 255, 0) 45%),
    linear-gradient(180deg, #b8e9fb 0%, #e0f6ff 45%, #ffffff 100%);
  color: var(--text);
  font-family:
    'Nunito',
    system-ui,
    -apple-system,
    Segoe UI,
    Roboto,
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  overscroll-behavior: none;
}

@media (prefers-color-scheme: dark) {
  .admin-shell {
    background:
      radial-gradient(120% 70% at 0% 0%, rgba(38, 55, 81, 0.35) 0%, rgba(38, 55, 81, 0) 55%),
      radial-gradient(80% 48% at 100% 0%, rgba(38, 55, 81, 0.25) 0%, rgba(38, 55, 81, 0) 45%),
      linear-gradient(180deg, #0a1220 0%, #0d1a2c 60%, #0e1420 100%);
  }
}

/* Nice selection & scrollbar tweaks */
::selection {
  background: rgba(110, 207, 246, 0.55);
  color: #001123;
}
:root {
  scrollbar-color: rgba(110, 207, 246, 0.6) transparent;
}
::-webkit-scrollbar {
  height: 10px;
  width: 10px;
}
::-webkit-scrollbar-thumb {
  border-radius: 999px;
  background: rgba(110, 207, 246, 0.6);
}
::-webkit-scrollbar-track {
  background: transparent;
}

/* -------------------- Sidebar -------------------- */
.sidebar {
  position: sticky;
  top: 0;
  height: 100vh;
  background: radial-gradient(100% 100% at 0% 0%, #ffffff 0%, #fff6fb 100%);
  border-right: 3px solid #d9ecff;
  padding: 1.25rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  backdrop-filter: saturate(135%) blur(4px);
}

@media (prefers-color-scheme: dark) {
  .sidebar {
    background: linear-gradient(180deg, #0c1524, #0a1220);
    border-right-color: #183252;
  }
}

.brand {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 1rem;
  border-radius: 18px;
  background: linear-gradient(135deg, var(--sky), #9be8ff);
  color: #08315b;
  box-shadow: var(--shadow-sm);
}
.logo {
  display: grid;
  place-items: center;
  width: 54px;
  height: 54px;
  border-radius: 14px;
  background: #fff;
  font-size: 1.6rem;
  box-shadow: inset 0 -2px 0 rgba(0, 0, 0, 0.05);
}
.brand-text {
  line-height: 1.1;
}
.brand-text strong {
  font-family: 'Fredoka', cursive;
  letter-spacing: 0.2px;
  font-size: 1.15rem;
  display: block;
}
.brand-text span {
  color: #093a6b;
  font-weight: 700;
  opacity: 0.85;
}

.nav {
  display: grid;
  gap: 0.35rem;
}
.nav-item {
  width: 100%;
  display: grid;
  grid-template-columns: 22px 1fr auto;
  gap: 0.75rem;
  align-items: center;
  text-align: left;
  padding: 0.75rem 0.9rem;
  border-radius: 16px;
  border: 2px solid transparent;
  background: var(--surface);
  color: #163b69;
  cursor: pointer;
  font-weight: 800;
  transition:
    background 0.15s var(--ease),
    transform 0.15s var(--ease),
    border-color 0.15s var(--ease),
    box-shadow 0.15s var(--ease);
}
.nav-item:hover {
  background: #f2fbff;
  border-color: #cfeefe;
  transform: translateX(4px);
  box-shadow: var(--shadow-xs);
}
.nav-item.active,
.nav-item[aria-current='page'] {
  border-color: #b6e7ff;
  background: linear-gradient(180deg, #fff, #f2faff);
  box-shadow: 0 8px 24px rgba(120, 194, 255, 0.18);
}
.nav-item[disabled] {
  opacity: 0.5;
  cursor: not-allowed;
}
.badge {
  justify-self: end;
  font-size: 0.72rem;
  padding: 0.2rem 0.5rem;
  border-radius: 999px;
  background: #fff2f8;
  color: #b9467d;
  border: 1px dashed #ffd1e7;
}

.sidebar-spacer {
  flex: 1;
}

.btn-logout {
  width: 100%;
  border: 0;
  background: linear-gradient(135deg, #ffe8ef, #fff);
  color: #b0224a;
  padding: 0.7rem 1rem;
  border-radius: 14px;
  font-weight: 800;
  cursor: pointer;
  box-shadow: var(--shadow-sm);
  transition:
    transform 0.12s var(--ease),
    box-shadow 0.12s var(--ease);
}
.btn-logout:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}
.btn-logout:focus-visible {
  outline: none;
  box-shadow: var(--ring-strong);
}

/* --------------------- Topbar --------------------- */
.content {
  min-width: 0;
  display: grid;
  grid-template-rows: auto 1fr auto;
}

.topbar {
  position: sticky;
  top: 0;
  z-index: 10;
  backdrop-filter: saturate(140%) blur(8px);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.85), rgba(255, 255, 255, 0.85));
  border-bottom: 2px solid #dbefff;
  padding: 1rem 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
@media (prefers-color-scheme: dark) {
  .topbar {
    background: linear-gradient(180deg, rgba(12, 21, 36, 0.7), rgba(12, 21, 36, 0.7));
    border-bottom-color: #183252;
  }
}
.title-wrap h1 {
  margin: 0;
  font-family: 'Fredoka', cursive;
  letter-spacing: 0.4px;
  font-size: 1.7rem;
  color: #0a2f57;
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.7);
}
@media (prefers-color-scheme: dark) {
  .title-wrap h1 {
    color: #bfe5ff;
    text-shadow: none;
  }
}
.subtitle {
  margin: 0.15rem 0 0;
  color: var(--muted);
  font-weight: 700;
}

.btn {
  appearance: none;
  border: 0;
  background: var(--surface);
  color: var(--text);
  padding: 0.65rem 1.1rem;
  border-radius: 999px;
  font-weight: 800;
  cursor: pointer;
  box-shadow: var(--shadow-sm);
  transition:
    transform 0.12s var(--ease),
    box-shadow 0.12s var(--ease),
    filter 0.12s var(--ease),
    background 0.12s var(--ease);
}
.btn:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}
.btn:focus-visible {
  outline: none;
  box-shadow: var(--ring);
}
.btn.primary {
  color: #08315b;
  background: linear-gradient(135deg, #ffe1ef, #d8f5ff);
  border: 2px solid #cdefff;
}
.btn.ghost {
  background: transparent;
  box-shadow: none;
}

/* Refresh button: lightweight spinner when busy */
.btn[aria-busy='true'] {
  position: relative;
  pointer-events: none;
  opacity: 0.85;
}
.btn[aria-busy='true']::after {
  content: '';
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid rgba(13, 27, 42, 0.15);
  border-top-color: var(--sky);
  animation: spin 0.75s linear infinite;
}
@keyframes spin {
  to {
    transform: translateY(-50%) rotate(360deg);
  }
}

/* --------------------- Panel --------------------- */
.panel {
  margin: 1.5rem 2rem 2rem;
  padding: 0 0 2rem;
}

/* Paneel-header: geen titel meer, zoekbalk gebruikt de volle breedte */
.panel-header {
  display: block; /* i.p.v. grid met 2 kolommen */
  margin: 1.25rem 0 0.75rem;
}
.controls--inline {
  width: 100%;
}

.controls {
  display: grid;
  grid-template-columns: 1fr auto auto; /* zoekveld = 1fr => maximaal breed */
  gap: 12px;
  align-items: center;
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
  opacity: 0.82;
  transform: translateY(-1px);
}
.search-input input[type='search'] {
  width: 100%;
  appearance: none;
  background: var(--surface);
  border: 2px solid #cfe9ff;
  border-radius: 14px;
  padding: 0.75rem 2.2rem 0.75rem 2.2rem;
  line-height: 1.35;
  font-size: 1rem;
  font-weight: 800;
  transition:
    border-color 0.12s var(--ease),
    box-shadow 0.12s var(--ease),
    background 0.12s var(--ease);
}
.search-input input::placeholder {
  color: var(--muted);
  font-weight: 700;
  opacity: 0.8;
}
.search-input input:focus {
  outline: none;
  border-color: #aee2ff;
  box-shadow: var(--ring);
  background: #fff;
}
.btn-clear {
  position: absolute;
  right: 8px;
  border: 0;
  background: transparent;
  font-size: 1.1rem;
  cursor: pointer;
  padding: 0.25rem 0.4rem;
  border-radius: 8px;
}
.btn-clear:hover {
  filter: contrast(1.1);
}
.btn-clear:focus-visible {
  outline: none;
  box-shadow: var(--ring);
}

.control-meta {
  color: var(--muted);
  font-weight: 800;
  white-space: nowrap;
}
.control-meta .muted {
  color: var(--muted);
  font-weight: 700;
}
.control-actions {
  display: flex;
  gap: 8px;
}

/* -------------------- Orders grid ---------------- */
.panel-body {
  background: var(--surface);
  border: 2px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow-lg);
  padding: 1.5rem;
}

.orders-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(460px, 1fr));
  gap: 24px;
  align-content: start;
  container-type: inline-size; /* container queries ready */
}
.orders-grid > * {
  display: contents;
}

/* Kaarten (generic selectors zodat <OrderList/> vrij is) */
.orders-grid :deep(.order),
.orders-grid :deep(.order-item),
.orders-grid :deep(.order-card),
.orders-grid :deep(.list-item),
.orders-grid :deep(article),
.orders-grid :deep(section),
.orders-grid :deep(li) {
  background:
    radial-gradient(120px 60px at 105% 110%, rgba(255, 241, 228, 0.65), transparent 60%),
    radial-gradient(100px 60px at -5% -15%, rgba(233, 255, 248, 0.75), transparent 60%),
    var(--surface);
  border: 2px solid #e7f2ff;
  border-radius: 18px;
  padding: 1.15rem 1.2rem;
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 140px;
  transition:
    transform 0.12s var(--ease),
    border-color 0.12s var(--ease),
    box-shadow 0.12s var(--ease),
    background 0.12s var(--ease);
}
@media (prefers-color-scheme: dark) {
  .orders-grid :deep(.order),
  .orders-grid :deep(.order-item),
  .orders-grid :deep(.order-card),
  .orders-grid :deep(.list-item),
  .orders-grid :deep(article),
  .orders-grid :deep(section),
  .orders-grid :deep(li) {
    background:
      radial-gradient(140px 80px at 108% 115%, rgba(255, 255, 255, 0.05), transparent 60%),
      radial-gradient(120px 70px at -8% -20%, rgba(255, 255, 255, 0.045), transparent 60%),
      var(--surface-2);
    border-color: #274261;
  }
}

.orders-grid :deep(.order:hover),
.orders-grid :deep(.order-card:hover),
.orders-grid :deep(article:hover),
.orders-grid :deep(section:hover),
.orders-grid :deep(li:hover) {
  transform: translateY(-3px);
  border-color: #cde8ff;
  box-shadow: var(--shadow-md);
}

.orders-grid :deep(h3),
.orders-grid :deep(.title),
.orders-grid :deep(header h4) {
  margin: 0 0 6px 0;
  font-size: 1.22rem;
  line-height: 1.25;
  font-family: 'Fredoka', cursive;
  color: #0a2f57;
  letter-spacing: 0.2px;
}
@media (prefers-color-scheme: dark) {
  .orders-grid :deep(h3),
  .orders-grid :deep(.title),
  .orders-grid :deep(header h4) {
    color: #bfe5ff;
  }
}
.orders-grid :deep(p) {
  color: var(--muted);
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
}

/* Inputs & selects in kaart */
.orders-grid :deep(select),
.orders-grid :deep(input[type='text']),
.orders-grid :deep(input[type='number']) {
  appearance: none;
  background: var(--surface);
  border: 2px solid #e4eef9;
  border-radius: 12px;
  padding: 0.55rem 0.7rem;
  line-height: 1.3;
  font-size: 1rem;
  font-weight: 700;
  transition:
    border-color 0.12s var(--ease),
    box-shadow 0.12s var(--ease),
    background 0.12s var(--ease);
  accent-color: var(--sky);
}
.orders-grid :deep(select:focus),
.orders-grid :deep(input:focus) {
  outline: none;
  border-color: #cfe4ff;
  box-shadow: var(--ring);
  background: #fff;
}

/* Buttons in kaart */
.orders-grid :deep(button) {
  appearance: none;
  border: 2px solid #e6eef8;
  background: linear-gradient(180deg, var(--surface), #f8fbff);
  color: #0b345e;
  padding: 0.55rem 0.9rem;
  border-radius: 999px;
  cursor: pointer;
  font-weight: 900;
  transition:
    transform 0.12s var(--ease),
    box-shadow 0.12s var(--ease),
    border-color 0.12s var(--ease),
    background 0.12s var(--ease);
}
.orders-grid :deep(button:hover) {
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
  border-color: #d7e9ff;
}
.orders-grid :deep(button:focus-visible) {
  outline: none;
  box-shadow: var(--ring);
}
.orders-grid :deep(button.danger),
.orders-grid :deep(button[aria-label*='Verwijderen']),
.orders-grid :deep(button[data-variant='danger']) {
  border-color: #ffd8e5;
  background: linear-gradient(180deg, var(--surface), #fff5f8);
  color: #b11d49;
}

/* Verbergen bij filter (scoped → via :deep) */
.orders-grid :deep(.is-hidden) {
  display: none !important;
}

/* Lege-staat */
.empty-state {
  grid-column: 1 / -1;
  border: 3px dashed #d6ecff;
  border-radius: 18px;
  padding: 2rem;
  text-align: center;
  background: linear-gradient(180deg, #f0fff7, #ffffff);
}
@media (prefers-color-scheme: dark) {
  .empty-state {
    background: linear-gradient(180deg, #0b1c15, #0f1723);
    border-color: #265b6b;
  }
}
.empty-state .empty-emoji {
  font-size: 2rem;
  margin-bottom: 0.25rem;
}

/* Footer */
.footer {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem 2rem;
  color: var(--muted);
  font-weight: 800;
}

/* ---------- Responsiveness ---------- */
@container (max-width: 980px) {
  .orders-grid {
    gap: 18px;
  }
}
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
  .panel-header {
    margin: 1rem 0 0.5rem;
  }
  .controls {
    grid-template-columns: 1fr auto; /* knoppen wrappen beter op small */
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
    border-bottom: 2px solid #dbefff;
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

/* ---------- Accessibility & Motion ---------- */
.btn,
.nav-item,
.orders-grid :deep(button),
.orders-grid :deep(.order),
.btn-logout {
  will-change: transform, box-shadow;
}

@media (prefers-reduced-motion: reduce) {
  * {
    transition: none !important;
    animation: none !important;
  }
}
</style>
