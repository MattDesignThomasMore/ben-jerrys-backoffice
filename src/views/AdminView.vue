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
          <span class="nav-ico" aria-hidden="true">📦</span>
          <span class="nav-label">Bestellingen</span>
        </button>

        <button type="button" class="nav-item" disabled>
          <span class="nav-ico" aria-hidden="true">📊</span>
          <span class="nav-label">Rapporten</span>
          <span class="badge">binnenkort</span>
        </button>

        <button type="button" class="nav-item" disabled>
          <span class="nav-ico" aria-hidden="true">⚙️</span>
          <span class="nav-label">Instellingen</span>
        </button>

        <button type="button" class="nav-item" disabled>
          <span class="nav-ico" aria-hidden="true">❓</span>
          <span class="nav-label">Help</span>
        </button>
      </nav>

      <div class="sidebar-spacer" aria-hidden="true"></div>
    </aside>

    <!-- Content -->
    <main class="content">
      <header class="topbar" role="banner">
        <div class="title-wrap">
          <h1 class="topbar-title">Adminpaneel</h1>
        </div>

        <div class="topbar-actions only-desktop">
          <button
            type="button"
            class="refresh-link"
            @click="refreshOrders"
            :aria-busy="isRefreshing ? 'true' : 'false'"
            :aria-label="isRefreshing ? 'Lijst vernieuwen bezig' : 'Vernieuwen'"
          >
            <span class="refresh-ico" :class="{ 'is-rotating': isRefreshing }" aria-hidden="true"
              >↻</span
            >
            <span v-if="!isRefreshing">Vernieuwen</span>
            <span v-else>Bezig…</span>
          </button>

          <button type="button" class="btn logout" @click="confirmLogout">Logout</button>
        </div>
      </header>

      <section id="orders" class="panel" aria-label="Bestellingen">
        <!-- Header: zoekbalk + filters -->
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
                autocomplete="off"
                autocapitalize="off"
                spellcheck="false"
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

            <div class="filters" role="group" aria-label="Filters">
              <label class="select">
                <span class="sr">Statusfilter</span>
                <select v-model="statusFilter" @change="applyFilter" aria-label="Filter op status">
                  <option value="">Alle statussen</option>
                  <option value="te verwerken">Te verwerken</option>
                  <option value="verzonden">Verzonden</option>
                  <option value="geannuleerd">Geannuleerd</option>
                </select>
              </label>

              <label class="select">
                <span class="sr">Sorteren</span>
                <select v-model="sortBy" @change="applySort" aria-label="Sorteer volgorde">
                  <option value="none">Sorteer: —</option>
                  <option value="name-asc">Naam A → Z</option>
                  <option value="name-desc">Naam Z → A</option>
                </select>
              </label>
            </div>

            <div class="control-meta" role="status" aria-live="polite">
              <template v-if="!query && !statusFilter">
                <span>Totaal: {{ totalCount }}</span>
              </template>
              <template v-else>
                <span>
                  Zichtbaar: <strong>{{ visibleCount }}</strong>
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

        <!-- Lijsttitel -->
        <div class="panel-subheader sticky" :class="{ 'has-filter': !!statusFilter || !!query }">
          <div class="subheader-dot" aria-hidden="true">•</div>
          <h2 class="subheader-title">Alle bestellingen</h2>
          <div v-if="activeChips.length" class="chips" role="list" aria-label="Actieve filters">
            <button
              v-for="chip in activeChips"
              :key="chip.key"
              class="chip"
              role="listitem"
              @click="chip.onClear()"
              :aria-label="chip.aria"
              title="Filter verwijderen"
            >
              {{ chip.label }} ✕
            </button>
          </div>
        </div>

        <!-- Orders lijst -->
        <div class="panel-body">
          <!-- Kolomkoppen -->
          <div class="table-head" role="row" aria-hidden="true">
            <div class="th th--customer">Klant</div>
            <div class="th th--details">Omschrijving</div>
            <div class="th th--status">Status</div>
            <div class="th th--actions">Acties</div>
          </div>

          <!-- Inhoud -->
          <div class="orders-grid" ref="ordersGrid">
            <!--
              Tip voor 100% deterministische matching:
              Render in OrderList elk item als wrapper met role="row"
              + data-customer="Naam" + data-status="te verwerken|verzonden|geannuleerd".
            -->
            <OrderList />

            <!-- Lege-staat -->
            <div
              v-if="(query || statusFilter) && visibleCount === 0"
              class="empty-state"
              aria-live="polite"
            >
              <div class="empty-emoji" aria-hidden="true">🧁</div>
              <h3>Geen resultaten</h3>
              <p class="muted">Pas filters aan of wis je zoekopdracht om alles te tonen.</p>
              <div class="empty-actions">
                <button class="btn" @click="clearFilters">Filters wissen</button>
                <button class="btn primary" @click="clearSearch">Zoekopdracht wissen</button>
              </div>
            </div>
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

/* ============== Helpers ============== */
const removeDiacritics = (s) => s.normalize('NFKD').replace(/\p{Diacritic}/gu, '')
const baseNorm = (s) =>
  removeDiacritics(
    String(s || '')
      .toLowerCase()
      .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
      .replace(/[\u201C\u201D\u201E\u201F]/g, '"')
      .replace(/[\u2010-\u2015]/g, '-')
      .replace(/[._]/g, ' ')
      .replace(/[\s\t\n\r]+/g, ' ')
      .trim(),
  )

// Canonieke statuswaarden (exact die jij gebruikt)
const CANON = ['te verwerken', 'verzonden', 'geannuleerd']

// Synoniemen/varianten → canoniek (géén "in behandeling" meer)
const STATUS_ALIASES = new Map([
  ['te-verwerken', 'te verwerken'],
  ['te verwerken ', 'te verwerken'],
  ['teverwerken', 'te verwerken'],
  ['pending', 'te verwerken'],
  ['todo', 'te verwerken'],
  ['shipped', 'verzonden'],
  ['sent', 'verzonden'],
  ['cancelled', 'geannuleerd'],
  ['canceled', 'geannuleerd'],
  ['geannuleerde', 'geannuleerd'],
])

function normalizeStatus(raw) {
  const n = baseNorm(raw)
  if (STATUS_ALIASES.has(n)) return STATUS_ALIASES.get(n)
  return CANON.includes(n) ? n : ''
}

function levenshtein(a, b) {
  if (a === b) return 0
  let al = a.length,
    bl = b.length
  if (!al) return bl
  if (!bl) return al
  const v = Array.from({ length: bl + 1 }, (_, i) => i)
  for (let i = 1; i <= al; i++) {
    let prev = i - 1,
      cur = i
    for (let j = 1; j <= bl; j++) {
      const t =
        b.charCodeAt(j - 1) === a.charCodeAt(i - 1) ? prev : Math.min(prev + 1, v[j] + 1, cur + 1)
      prev = v[j]
      v[j] = t
      cur = t
    }
  }
  return v[bl]
}

// Vind de visuele "rij" (werkt ook bij display: contents)
function findRowRoot(node, gridRoot) {
  let el = node
  const visited = new Set()
  while (el && el !== gridRoot && el.nodeType === 1 && !visited.has(el)) {
    visited.add(el)
    const cs = getComputedStyle(el)
    if (cs.display !== 'contents') {
      const hasBorderRow = cs.borderBottomStyle !== 'none' || cs.borderTopStyle !== 'none'
      const hasRadius = parseFloat(cs.borderTopLeftRadius) >= 6 || parseFloat(cs.borderRadius) >= 6
      const hasShadow = cs.boxShadow && cs.boxShadow !== 'none'
      const pad = ['Top', 'Right', 'Bottom', 'Left'].reduce(
        (n, side) => n + parseFloat(cs['padding' + side] || 0),
        0,
      )
      const looksLikeRow = (hasBorderRow || hasRadius || hasShadow) && pad >= 8
      if (looksLikeRow) return el
    }
    el = el.parentElement
  }
  return null
}

// Klantnaam uit rij
function extractCustomerFromRow(row) {
  const byAttr = row.getAttribute('data-customer') || row.getAttribute('data-client')
  if (byAttr) return byAttr.trim()

  const sel = row.querySelector(
    [
      '.customer-name',
      '.customer',
      '[data-customer]',
      '[data-client]',
      '[aria-label*="Klant" i]',
      '[aria-labelledby*="klant" i]',
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
    if (guess) return guess
  }

  const text = (row.innerText || row.textContent || '').replace(/\s+/g, ' ').trim()
  const byLabel = text.match(/\b(?:Klant|Naam|Customer|Besteller)\s*:\s*([^\n\r|•]+)/i)
  if (byLabel && byLabel[1]) return byLabel[1].trim()

  const cap = text.match(
    /([A-ZÀ-ÖØ-Þ][\p{L}'\-]+(?:\s+(?:van|de|der|den|da|dos|di|du|la|le|von|op|ten|te)\s+)?[A-ZÀ-ÖØ-Þ]?[\p{L}'\-]+(?:\s+[A-ZÀ-ÖØ-Þ][\p{L}'\-]+)*)/u,
  )
  if (cap && cap[1]) return cap[1].trim()

  return ''
}

// Status uit rij (data-attr, badge of <select>)
function extractStatusFromRow(row) {
  const attrSelf = row.getAttribute('data-status')
  if (attrSelf) return normalizeStatus(attrSelf)

  const attrChild = row.querySelector('[data-status]')
  if (attrChild) return normalizeStatus(attrChild.getAttribute('data-status'))

  // Kijk eerst naar een expliciet status-select
  const select =
    row.querySelector('select[aria-label*="status" i]') ||
    row.querySelector('select[name*="status" i]') ||
    row.querySelector('select')
  if (select) {
    const val = select.value || (select.selectedOptions && select.selectedOptions[0]?.value) || ''
    const txt =
      (select.selectedOptions && select.selectedOptions[0]?.textContent) ||
      select.options?.[select.selectedIndex || 0]?.textContent ||
      ''
    const preferred = normalizeStatus(val) || normalizeStatus(txt)
    if (preferred) return preferred
  }

  // Badge/label
  const badge =
    row.querySelector('.status, .status-badge, [class*="status-"]') ||
    row.querySelector('[aria-label*="Status" i]')
  if (badge) {
    const t = badge.textContent || ''
    const n = normalizeStatus(t)
    if (n) return n
  }

  // Fallback: plain text zoeken naar canonieke waarden/synoniemen
  const t = baseNorm(row.textContent || '')
  for (const key of CANON) {
    if (t.includes(key)) return key
  }
  for (const [alias, canon] of STATUS_ALIASES.entries()) {
    if (t.includes(alias)) return canon
  }
  return ''
}

export default {
  name: 'AdminViewPro',
  components: { OrderList },

  data() {
    return {
      year: new Date().getFullYear(),
      query: '',
      statusFilter: '',
      sortBy: 'none', // 'none' | 'name-asc' | 'name-desc'
      totalCount: 0,
      visibleCount: 0,
      isRefreshing: false,
      debounceHandle: null,
      _observer: null,
      _index: new Map(), // Element -> { raw, norm, status }
      _rows: [],
      _collator: new Intl.Collator(undefined, {
        sensitivity: 'base',
        usage: 'search',
        ignorePunctuation: true,
      }),
    }
  },

  computed: {
    placeholder() {
      return 'Zoek op klantnaam…'
    },
    activeChips() {
      const chips = []
      if (this.query) {
        chips.push({
          key: 'q',
          label: `Zoek: “${this.query}”`,
          aria: 'Zoekfilter verwijderen',
          onClear: this.clearSearch,
        })
      }
      if (this.statusFilter) {
        chips.push({
          key: 's',
          label: `Status: ${this.statusFilter}`,
          aria: 'Statusfilter verwijderen',
          onClear: () => {
            this.statusFilter = ''
            this.applyFilter()
          },
        })
      }
      return chips
    },
  },

  mounted() {
    this.$nextTick(() => {
      this.reindexRows()
      this.applyFilter()
      this.applySort()
      this.observeOrderListMutations()
      this.bindStatusChangeDelegation()
    })
  },

  beforeUnmount() {
    if (this._observer) this._observer.disconnect()
    if (this.debounceHandle) clearTimeout(this.debounceHandle)
    this.unbindStatusChangeDelegation()
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
      // Zelfde effect als browser refresh (Ctrl+R)
      this.isRefreshing = true
      // Heel korte delay zodat de "Bezig…" UI zichtbaar is
      setTimeout(() => {
        window.location.reload()
      }, 50)
    },

    clearFilters() {
      this.statusFilter = ''
      this.applyFilter()
    },

    scrollTo(id) {
      const el = this.$el.querySelector(`#${id}`)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    },

    scrollToBottom() {
      window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' })
    },

    onGlobalHotkeys(e) {
      if (e.key === '/') {
        e.preventDefault()
        this.focusSearch()
      } else if (e.key === 'Escape' && (this.query || this.statusFilter)) {
        this.query ? this.clearSearch() : this.clearFilters()
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
      this.debounceHandle = setTimeout(() => {
        this.applyFilter()
        this.applySort()
      }, 100)
    },

    /* ---------- Indexering & selectie ---------- */
    getOrderRows() {
      const root = this.$refs.ordersGrid
      if (!root) return []
      const allNodes = Array.from(root.querySelectorAll('*'))
      const rows = new Set()
      for (const el of allNodes) {
        const txt = (el.innerText || el.textContent || '').trim()
        if (txt.length < 8) continue
        const row = findRowRoot(el, root)
        if (row) rows.add(row)
      }
      return Array.from(rows)
    },

    reindexRows() {
      const rows = this.getOrderRows()
      this._rows = rows
      this._index.clear()

      for (const el of rows) {
        const raw = extractCustomerFromRow(el)
        const norm = baseNorm(raw)
        const status = extractStatusFromRow(el)
        el.__customerRaw = raw
        el.__customerNorm = norm
        el.__statusNorm = status
        el.setAttribute('role', el.getAttribute('role') || 'row')
        if (raw) el.setAttribute('data-index-customer', raw)
        if (status) el.setAttribute('data-index-status', status)
        this._index.set(el, { raw, norm, status })
      }

      this.totalCount = rows.length
      this.visibleCount = rows.filter(
        (el) => !el.classList.contains('is-hidden') && !el.hidden,
      ).length
    },

    /* ---------- Zoeken ---------- */
    parseQuery(raw) {
      const q = String(raw || '').trim()
      if (!q) return { exact: false, terms: [] }
      if (q.startsWith('=') && q.length > 1) {
        return { exact: true, phrase: baseNorm(q.slice(1)) }
      }
      const first = q[0],
        last = q[q.length - 1]
      if ((first === '"' && last === '"') || (first === '“' && last === '”')) {
        return { exact: true, phrase: baseNorm(q.slice(1, -1)) }
      }
      const orParts = q
        .split(/\s+OR\s+|\|/i)
        .map((s) => s.trim())
        .filter(Boolean)
      const groups = orParts.map((part) => part.split(/\s+/).filter(Boolean))
      const structured = groups.map((tokens) =>
        tokens.map((t) => {
          let kind = 'sub'
          if (t.startsWith('^')) {
            kind = 'prefix'
            t = t.slice(1)
          }
          if (t.endsWith('$')) {
            kind = 'suffix'
            t = t.slice(0, -1)
          }
          return { kind, value: baseNorm(t) }
        }),
      )
      return { exact: false, groups: structured }
    },

    matchesName(nameNorm, q) {
      if (!nameNorm) return false
      if (q.exact) return nameNorm === q.phrase
      const orGroups = q.groups || []
      if (!orGroups.length) return true
      outer: for (const andGroup of orGroups) {
        for (const term of andGroup) {
          if (!this.matchTerm(nameNorm, term)) continue outer
        }
        return true
      }
      return false
    },

    matchTerm(nameNorm, term) {
      const value = term.value
      if (!value) return true
      if (term.kind === 'prefix') {
        if (nameNorm.startsWith(value)) return true
      } else if (term.kind === 'suffix') {
        if (nameNorm.endsWith(value)) return true
      } else {
        if (nameNorm.includes(value)) return true
      }
      const words = nameNorm.split(' ')
      for (const w of words) {
        if (this._collator.compare(w, value) === 0) return true
      }
      const distCap = value.length <= 4 ? 1 : value.length <= 7 ? 2 : 3
      for (const w of words) {
        if (Math.abs(w.length - value.length) > distCap) continue
        if (levenshtein(w, value) <= distCap) return true
      }
      return false
    },

    /* ---------- Filter + sort ---------- */
    applyFilter() {
      const rows = this._rows.length ? this._rows : this.getOrderRows()
      if (!rows.length) {
        this.visibleCount = 0
        this.totalCount = 0
        return
      }
      if (!this._index.size || rows.some((el) => !this._index.has(el))) this.reindexRows()

      const q = this.parseQuery(this.query)
      const wantedStatus = normalizeStatus(this.statusFilter)

      let shown = 0
      for (const el of rows) {
        let idx = this._index.get(el)
        if (!idx) {
          idx = {
            raw: el.__customerRaw || extractCustomerFromRow(el),
            norm: el.__customerNorm || baseNorm(extractCustomerFromRow(el)),
            status: el.__statusNorm || extractStatusFromRow(el),
          }
          this._index.set(el, idx)
        }

        // live status her-evalueren (select/wijzigingen)
        const liveStatus = extractStatusFromRow(el)
        if (liveStatus && liveStatus !== idx.status) {
          idx.status = liveStatus
          el.__statusNorm = liveStatus
          el.setAttribute('data-index-status', liveStatus)
        }

        const nameNorm = idx.norm || baseNorm(idx.raw)
        const hitName = this.matchesName(nameNorm, q)
        const hitStatus = wantedStatus ? idx.status === wantedStatus : true
        const hit = hitName && hitStatus

        el.classList.toggle('is-hidden', !hit)
        el.hidden = !hit
        el.setAttribute('aria-hidden', hit ? 'false' : 'true')
        if (hit) shown++
      }
      this.totalCount = rows.length
      this.visibleCount = shown
    },

    applySort() {
      const rows = this._rows.length ? this._rows : this.getOrderRows()
      if (!rows.length) return

      if (this.sortBy === 'none') {
        rows.forEach((el) => (el.style.order = '0'))
        return
      }

      const map = rows.map((el) => {
        const idx = this._index.get(el) || {}
        const norm = idx.norm || el.__customerNorm || baseNorm(extractCustomerFromRow(el))
        return { el, norm }
      })

      map.sort((a, b) => {
        const cmp = this._collator.compare(a.norm, b.norm)
        return this.sortBy === 'name-asc' ? cmp : -cmp
      })

      map.forEach((item, order) => {
        item.el.style.order = String(order)
      })
    },

    observeOrderListMutations() {
      const root = this.$refs.ordersGrid
      if (!root || this._observer) return
      let scheduled = false
      const run = () => {
        scheduled = false
        this.reindexRows()
        this.applyFilter()
        this.applySort()
      }
      const schedule = () => {
        if (!scheduled) {
          scheduled = true
          ;(window.requestIdleCallback || ((fn) => setTimeout(fn, 60)))(run)
        }
      }
      this._observer = new MutationObserver(schedule)
      this._observer.observe(root, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true, // ook wanneer data-status/class verandert
      })
    },

    // Luister op changes van <select> (status switch) via event delegation
    bindStatusChangeDelegation() {
      const root = this.$refs.ordersGrid
      if (!root) return
      this._onChange = (e) => {
        const t = e.target
        if (!(t instanceof HTMLSelectElement)) return
        const row = findRowRoot(t, root)
        if (!row) return
        const status = extractStatusFromRow(row)
        const idx = this._index.get(row) || {}
        idx.status = status
        row.__statusNorm = status
        row.setAttribute('data-index-status', status)
        this._index.set(row, idx)
        this.applyFilter() // direct her-evalueren
      }
      root.addEventListener('change', this._onChange, true)
    },

    unbindStatusChangeDelegation() {
      const root = this.$refs.ordersGrid
      if (root && this._onChange) root.removeEventListener('change', this._onChange, true)
      this._onChange = null
    },
  },
}
</script>

<!-- GLOBAL RESET -->
<style>
html,
body,
#app {
  height: 100%;
}
html,
body {
  margin: 0;
  padding: 0;
}
* {
  box-sizing: border-box;
}
.sr {
  position: absolute !important;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>

<style scoped>
/* -------------------------------------------------
   BEN & JERRY’S — PROFESSIONAL BACKOFFICE TABLE LIST
   ------------------------------------------------- */
@import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@500;700&family=Nunito:wght@400;600;700;800&display=swap');

/* ---------- Shell ---------- */
.admin-shell {
  display: grid;
  grid-template-columns: 300px 1fr;
  min-height: 100vh;
  background:
    white,
    radial-gradient(80% 48% at 100% 0%, rgba(255, 255, 255, 0.75) 0%, rgba(255, 255, 255, 0) 45%),
    linear-gradient(180deg, #f7fbff 0%, #fff 100%);
  color: #0d1b2a;
  font-family:
    'Nunito',
    system-ui,
    -apple-system,
    Segoe UI,
    Roboto,
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* ---------- Sidebar ---------- */
.sidebar {
  position: sticky;
  top: 0;
  height: 100vh;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.25rem 1rem;
  background: #fff;
  border-right: 1px solid #e8eef5;
}
.brand {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 1rem;
  border-radius: 14px;
  background: linear-gradient(135deg, #6ecff6, #9be8ff);
  color: #08315b;
  box-shadow: 0 2px 10px rgba(13, 27, 42, 0.06);
}
.logo {
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: #fff;
  font-size: 1.4rem;
  box-shadow: inset 0 -2px 0 rgba(0, 0, 0, 0.05);
}
.brand-text {
  line-height: 1.1;
}
.brand-text strong {
  display: block;
  font-family: 'Fredoka', cursive;
  font-size: 1.05rem;
  letter-spacing: 0.2px;
}
.brand-text span {
  color: #08315b;
  font-weight: 800;
  opacity: 0.85;
}

.nav {
  display: grid;
  gap: 0.35rem;
  justify-items: start;
}
.nav-item {
  width: 100%;
  display: grid;
  grid-template-columns: 22px 1fr auto;
  gap: 0.75rem;
  align-items: center;
  padding: 0.65rem 0.9rem;
  border-radius: 12px;
  border: 1px solid transparent;
  background: #fff;
  color: #0b2a4a;
  cursor: pointer;
  font-weight: 800;
  text-align: left;
  transition:
    background 0.15s,
    border-color 0.15s,
    box-shadow 0.15s;
}
.nav-ico {
  width: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.nav-item:hover {
  background: #f7fbff;
  border-color: #cfe6fb;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.06);
}
.nav-item.active,
[aria-current='page'] {
  border-color: #1d4754;
  background: linear-gradient(180deg, #fff, #f5f9ff);
  box-shadow: 0 4px 18px rgba(0, 0, 0, 0.08);
}
.nav-item[disabled] {
  opacity: 0.5;
  cursor: not-allowed;
}
.badge {
  justify-self: end;
  padding: 0.18rem 0.5rem;
  border-radius: 999px;
  font-size: 0.72rem;
  background: #fff2f8;
  color: #b9467d;
  border: 1px dashed #ffd1e7;
}
.sidebar-spacer {
  flex: 1;
}

/* ---------- Content + Topbar ---------- */
.content {
  min-width: 0;
  display: grid;
  grid-template-rows: auto 1fr auto;
}
.topbar {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.9rem 1.5rem;
  background: linear-gradient(180deg, #164b77, #1a5a8c);
  color: #fff;
  box-shadow: 0 2px 12px rgba(22, 75, 119, 0.25);
}
.topbar-title {
  margin: 0;
  color: #fff;
  font-family: 'Fredoka', cursive;
  font-size: 1.6rem;
  letter-spacing: 0.3px;
}
.topbar-actions {
  display: flex;
  align-items: center;
  gap: 18px;
}
.refresh-link {
  appearance: none;
  border: 0;
  background: transparent;
  padding: 0;
  color: #f2f7fc;
  font-weight: 900;
  cursor: pointer;
  display: inline-flex;
  gap: 8px;
  align-items: center;
}
.refresh-ico {
  font-size: 1.05rem;
  transform: translateY(-1px);
  display: inline-flex;
}
.refresh-ico.is-rotating {
  animation: spin 0.9s linear infinite;
}
@keyframes spin {
  to {
    transform: translateY(-1px) rotate(360deg);
  }
}
@media (prefers-reduced-motion: reduce) {
  .refresh-ico.is-rotating {
    animation: none;
  }
}
.btn {
  appearance: none;
  border: 1px solid #d9e4ee;
  padding: 0.55rem 1rem;
  border-radius: 999px;
  background: #fff;
  color: #0d1b2a;
  cursor: pointer;
  font-weight: 800;
  transition:
    box-shadow 0.14s ease,
    background 0.14s ease,
    border-color 0.14s ease,
    color 0.14s ease;
}
.btn:hover {
  box-shadow: 0 10px 24px rgba(13, 27, 42, 0.1);
  border-color: #cfe2f3;
}
.btn:focus-visible {
  outline: none;
  box-shadow:
    0 0 0 4px rgba(110, 207, 246, 0.28),
    0 6px 18px rgba(13, 27, 42, 0.1);
}
.btn.primary {
  background: #0a3056;
  color: #fff;
  border-color: #0a3056;
}
.btn.ghost {
  background: transparent;
  box-shadow: none;
}
.btn.logout {
  background: #6ecff6;
  color: #ffffff;
  font-weight: 900;
  border-color: #56b8e1;
  transition:
    box-shadow 0.18s,
    background 0.18s,
    border-color 0.18s;
}
.btn.logout:hover {
  box-shadow:
    0 0 0 4px rgba(110, 207, 246, 0.22),
    0 6px 18px rgba(13, 27, 42, 0.12);
  border-color: #45acd4;
  background: linear-gradient(180deg, #74d3f8 0%, #67c7f1 100%);
}
.btn.logout:active {
  box-shadow: 0 0 0 3px rgba(110, 207, 246, 0.25) inset;
}
.btn:disabled,
.btn[aria-disabled='true'] {
  opacity: 0.6;
  cursor: not-allowed;
  box-shadow: none;
}

/* ---------- Panel & Controls ---------- */
.panel {
  margin: 1.25rem 1.5rem 2rem;
  padding: 0 0 2rem;
}
.panel-header {
  margin: 1rem 0 0.25rem;
}

.controls {
  display: grid;
  grid-template-columns: 1fr auto auto auto;
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
}
.search-input input[type='search'] {
  width: 100%;
  padding: 0.6rem 2.2rem;
  border: 1px solid #d6e2ee;
  border-radius: 10px;
  background: #fff;
  line-height: 1.35;
  font-size: 1rem;
  font-weight: 800;
  transition:
    border-color 0.12s,
    box-shadow 0.12s,
    background 0.12s;
}
.search-input input::placeholder {
  color: #5b7083;
  font-weight: 700;
  opacity: 0.8;
}
.search-input input:focus {
  outline: none;
  border-color: #9fd8ff;
  box-shadow: 0 0 0 4px rgba(110, 207, 246, 0.24);
}
.btn-clear {
  position: absolute;
  right: 8px;
  padding: 0.2rem 0.4rem;
  border: 0;
  border-radius: 8px;
  background: transparent;
  font-size: 1.1rem;
  cursor: pointer;
}

.filters {
  display: flex;
  gap: 8px;
  align-items: center;
}
.select select {
  padding: 0.56rem 0.8rem;
  border: 1px solid #d6e2ee;
  border-radius: 10px;
  background: #fff;
  font-weight: 800;
}

.control-meta {
  color: #5b7083;
  font-weight: 800;
  white-space: nowrap;
}
.control-meta .muted {
  color: #5b7083;
  font-weight: 700;
}
.control-actions {
  display: flex;
  gap: 8px;
}

/* Subheader */
.panel-subheader {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.2rem 0.35rem;
  margin: 0.2rem 0 0.4rem;
  color: #0b2a4a;
  font-weight: 900;
}
.panel-subheader.sticky {
  position: sticky;
  top: 62px;
  z-index: 5;
  background: #fff;
  border-bottom: 1px solid #e8eef5;
}
.subheader-dot {
  font-size: 1.4rem;
  color: #79c2f3;
  transform: translateY(-1px);
}
.subheader-title {
  margin: 0;
  font-size: 1.02rem;
  letter-spacing: 0.2px;
}
.chips {
  display: flex;
  gap: 6px;
  margin-left: 0.5rem;
}
.chip {
  padding: 0.25rem 0.55rem;
  border-radius: 999px;
  border: 1px solid #d6e2ee;
  background: #f7fbff;
  font-weight: 900;
  cursor: pointer;
}

/* ---------- Tabel ---------- */
.panel-body {
  background: #fff;
  border: 1px solid #e8eef5;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(13, 27, 42, 0.08);
  overflow: hidden;
}
.table-head {
  display: grid;
  grid-template-columns: minmax(220px, 1.2fr) minmax(180px, 1fr) 160px 180px;
  gap: 0;
  align-items: center;
  padding: 0.65rem 1rem;
  background: #f7faff;
  border-bottom: 1px solid #e8eef5;
  font-weight: 900;
  color: #0b2a4a;
}
.th {
  opacity: 0.9;
  font-size: 0.88rem;
}
.th--actions {
  justify-self: end;
}

.orders-grid {
  display: flex;
  flex-direction: column;
}
.orders-grid > * {
  display: contents;
}

.orders-grid :deep(.order),
.orders-grid :deep(.order-item),
.orders-grid :deep(.order-card),
.orders-grid :deep(.list-item),
.orders-grid :deep(article),
.orders-grid :deep(section),
.orders-grid :deep(li) {
  display: grid;
  grid-template-columns: minmax(220px, 1.2fr) minmax(180px, 1fr) 160px 180px;
  gap: 0;
  align-items: center;
  padding: 0.75rem 1rem;
  background: #fff;
  border-bottom: 1px solid #eef3f8;
  line-height: 1.25;
}
.orders-grid :deep(.order:nth-child(odd)),
.orders-grid :deep(.order-item:nth-child(odd)),
.orders-grid :deep(.order-card:nth-child(odd)),
.orders-grid :deep(.list-item:nth-child(odd)),
.orders-grid :deep(article:nth-child(odd)),
.orders-grid :deep(section:nth-child(odd)),
.orders-grid :deep(li:nth-child(odd)) {
  background: #fcfdff;
}
.orders-grid :deep(.order:hover),
.orders-grid :deep(.order-item:hover),
.orders-grid :deep(.order-card:hover),
.orders-grid :deep(.list-item:hover),
.orders-grid :deep(article:hover),
.orders-grid :deep(section:hover),
.orders-grid :deep(li:hover) {
  background: #f6fbff;
}

.orders-grid :deep(h3),
.orders-grid :deep(.title),
.orders-grid :deep(header h4),
.orders-grid :deep(.customer-name) {
  margin: 0;
  font-family: 'Fredoka', cursive;
  font-size: 1rem;
  color: #0b2a4a;
  font-weight: 700;
  letter-spacing: 0.2px;
}
.orders-grid :deep(p),
.orders-grid :deep(.meta),
.orders-grid :deep(.description) {
  margin: 0;
  color: #425a70;
  font-size: 0.95rem;
  font-weight: 700;
  opacity: 0.95;
}

/* Status badge + kleuren */
.orders-grid :deep(.status),
.orders-grid :deep(.status-badge) {
  justify-self: start;
  padding: 0.28rem 0.6rem;
  border-radius: 999px;
  font-weight: 900;
  font-size: 0.8rem;
  background: #eef6ff;
  color: #0b345e;
  border: 1px solid #d6eaff;
  white-space: nowrap;
}
.orders-grid :deep([data-status='verzonden' i]),
.orders-grid :deep(.status-verzonden) {
  background: #effaf5;
  color: #0b3d2c;
  border-color: #cdeee0;
}
.orders-grid :deep([data-status='geannuleerd' i]),
.orders-grid :deep(.status-geannuleerd) {
  background: #fff0f4;
  color: #6f1233;
  border-color: #ffd5e1;
}
.orders-grid :deep([data-status='te verwerken' i]),
.orders-grid :deep(.status-te-verwerken) {
  background: #fff8e8;
  color: #5a3a03;
  border-color: #ffe2a6;
}

/* Acties */
.orders-grid :deep(button),
.orders-grid :deep(a.button) {
  padding: 0.4rem 0.7rem;
  border: 1px solid #d9e4ee;
  border-radius: 10px;
  background: #fff;
  color: #0b345e;
  font-weight: 900;
  cursor: pointer;
  text-decoration: none;
  justify-self: end;
  transition:
    box-shadow 0.12s,
    border-color 0.12s,
    background 0.12s;
}
.orders-grid :deep(button:hover),
.orders-grid :deep(a.button:hover) {
  border-color: #9bd9ff;
  box-shadow: 0 6px 14px rgba(13, 27, 42, 0.08);
}
.orders-grid :deep(button:focus-visible),
.orders-grid :deep(a.button:focus-visible) {
  outline: none;
  box-shadow: 0 0 0 4px rgba(110, 207, 246, 0.28);
}
.orders-grid :deep(button.danger),
.orders-grid :deep(button[aria-label*='Verwijderen']),
.orders-grid :deep(button[data-variant='danger']) {
  border-color: #ffd8e5;
  background: #fff5f8;
  color: #b11d49;
}

/* Hidden */
.orders-grid :deep(.is-hidden) {
  display: none !important;
}

/* Lege-staat */
.empty-state {
  margin: 0.85rem;
  padding: 1.2rem;
  border: 1px dashed #d6ecff;
  border-radius: 10px;
  text-align: center;
  background: linear-gradient(180deg, #f7fffb, #fff);
}
.empty-state .empty-emoji {
  margin-bottom: 0.25rem;
  font-size: 2rem;
}
.empty-actions {
  display: flex;
  gap: 8px;
  justify-content: center;
  margin-top: 0.5rem;
}

/* Footer */
.footer {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.2rem 2rem;
  color: #5b7083;
  font-weight: 800;
}

/* ---------- Responsive ---------- */
@media (max-width: 1180px) {
  .admin-shell {
    grid-template-columns: 260px 1fr;
  }
  .panel {
    margin: 1rem 1rem 1.5rem;
  }
  .controls {
    grid-template-columns: 1fr auto auto;
    grid-auto-flow: row;
  }
  .table-head,
  .orders-grid :deep(.order),
  .orders-grid :deep(.order-item),
  .orders-grid :deep(.order-card),
  .orders-grid :deep(.list-item),
  .orders-grid :deep(article),
  .orders-grid :deep(section),
  .orders-grid :deep(li) {
    grid-template-columns: 1.25fr 1fr 140px 150px;
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
    border-bottom: 1px solid #e8eef5;
  }
  .topbar {
    position: static;
  }
  .only-desktop {
    display: none;
  }
  .table-head {
    display: none;
  }
  .orders-grid :deep(.order),
  .orders-grid :deep(.order-item),
  .orders-grid :deep(.order-card),
  .orders-grid :deep(.list-item),
  .orders-grid :deep(article),
  .orders-grid :deep(section),
  .orders-grid :deep(li) {
    grid-template-columns: 1fr;
    gap: 6px 10px;
    padding: 0.8rem 1rem;
  }
  .orders-grid :deep(.order > *:last-child) {
    justify-self: start;
  }
}
</style>
