<template>
  <div
    class="admin-scene"
    @mousemove="onParallax"
    :class="{ 'reduced-motion': prefersReducedMotion }"
    @keydown="onGlobalHotkeys"
  >
    <a href="#orders" class="skip-link">Overslaan naar hoofdinhoud</a>

    <div class="bg-layer bg-1" aria-hidden="true"></div>
    <div class="bg-layer bg-2" aria-hidden="true"></div>
    <div class="bg-layer bg-3" aria-hidden="true"></div>
    <div class="cloud cloud-1" aria-hidden="true"></div>
    <div class="cloud cloud-2" aria-hidden="true"></div>
    <div class="cloud cloud-3" aria-hidden="true"></div>

    <div class="admin-shell">
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
              title="Vernieuwen"
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
                  <select
                    v-model="statusFilter"
                    @change="applyFilter"
                    aria-label="Filter op status"
                  >
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

          <div class="panel-body">
            <div class="table-head" role="row" aria-hidden="true">
              <div class="th th--customer">Klant</div>
              <div class="th th--details">Omschrijving</div>
              <div class="th th--status">Status</div>
              <div class="th th--actions">Acties</div>
            </div>

            <div class="orders-grid" ref="ordersGrid">
              <OrderList />

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
  </div>
</template>

<script>
import OrderList from '../components/OrderList.vue'

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

const CANON = ['te verwerken', 'verzonden', 'geannuleerd']

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

function extractStatusFromRow(row) {
  const attrSelf = row.getAttribute('data-status')
  if (attrSelf) return normalizeStatus(attrSelf)
  const attrChild = row.querySelector('[data-status]')
  if (attrChild) return normalizeStatus(attrChild.getAttribute('data-status'))
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
  const badge =
    row.querySelector('.status, .status-badge, [class*="status-"]') ||
    row.querySelector('[aria-label*="Status" i]')
  if (badge) {
    const t = badge.textContent || ''
    const n = normalizeStatus(t)
    if (n) return n
  }
  const t = baseNorm(row.textContent || '')
  for (const key of CANON) if (t.includes(key)) return key
  for (const [alias, canon] of STATUS_ALIASES.entries()) if (t.includes(alias)) return canon
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
      sortBy: 'none',
      totalCount: 0,
      visibleCount: 0,
      isRefreshing: false,
      debounceHandle: null,
      _observer: null,
      _index: new Map(),
      _rows: [],
      _collator: new Intl.Collator(undefined, {
        sensitivity: 'base',
        usage: 'search',
        ignorePunctuation: true,
      }),
      prefersReducedMotion: false,
      parallax: { x: 0, y: 0 },
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
    // ✅ Extra safety: als er geen token is, direct naar login
    const token = localStorage.getItem('token')
    if (!token) {
      this.$router.replace('/login')
      return
    }

    try {
      this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    } catch (_) {}

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
    onParallax(e) {
      if (this.prefersReducedMotion) return
      const { innerWidth, innerHeight } = window
      const x = (e.clientX / innerWidth - 0.5) * 2
      const y = (e.clientY / innerHeight - 0.5) * 2
      this.parallax = { x, y }
      document.documentElement.style.setProperty('--parallax-x', (x * 10).toFixed(2) + 'px')
      document.documentElement.style.setProperty('--parallax-y', (y * 10).toFixed(2) + 'px')
    },

    confirmLogout() {
      if (confirm('Weet je zeker dat je wilt uitloggen?')) {
        localStorage.removeItem('token')
        this.$router.replace('/login') // replace i.p.v. push om back-stack te voorkomen
      }
    },

    // Optioneel mooier: in plaats van reload, vraag het kind component te refreshem
    refreshOrders() {
      this.isRefreshing = true
      // eenvoudig: herlaad pagina
      setTimeout(() => {
        window.location.reload()
      }, 50)
      // Wil je zonder reload? Geef OrderList een ref en roep this.$refs.orderList.fetchOrders() aan.
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

    parseQuery(raw) {
      const q = String(raw || '').trim()
      if (!q) return { exact: false, terms: [] }
      if (q.startsWith('=') && q.length > 1) return { exact: true, phrase: baseNorm(q.slice(1)) }
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
        attributes: true,
      })
    },

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
        this.applyFilter()
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

<style>
:root {
  --bj-blue-900: #133c5a;
  --bj-blue-800: #145a7a;
  --bj-blue-700: #1676a1;
  --bj-blue-600: #1992c1;
  --bj-mint-200: #b6f5e1;
  --bj-sky-200: #b6e7ff;
  --bj-sky-300: #7fd3ff;
  --bj-straw-200: #ffd1e1;
  --border: #e7eef6;
  --card: #ffffff;
  --cloud: #ffffff;
  --content-w: min(1600px, 96vw);
  --muted: #667a8b;
  --parallax-x: 0px;
  --parallax-y: 0px;
  --ring: 0 0 0 3px rgba(25, 146, 193, 0.22);
}

#app,
body,
html {
  background: linear-gradient(180deg, #f9fcff 0%, #ffffff 40%);
  color: var(--bj-blue-900);
  font-family:
    'Nunito',
    system-ui,
    -apple-system,
    Segoe UI,
    Roboto,
    sans-serif;
  height: 100%;
  overflow-x: clip;
}

*,
*::before,
*::after {
  box-sizing: border-box;
}

:where(a, button, select):focus-visible {
  border-radius: 999px;
  box-shadow: var(--ring);
  outline: none;
}

.reduced-motion * {
  animation: none !important;
  transition: none !important;
}

@media (prefers-reduced-motion: reduce) {
  .bg-layer,
  .cloud {
    animation: none !important;
    transition: none !important;
  }
}

@media (prefers-color-scheme: dark) {
  :root {
    --bj-blue-900: #e6f3ff;
    --border: #1e2a38;
    --card: #0f1720;
    --muted: #9bb3c3;
  }

  #app,
  body,
  html {
    background: linear-gradient(180deg, #0b1220 0%, #0f1720 40%);
  }
}

body,
html {
  margin: 0;
  padding: 0;
}

.sr {
  border: 0;
  clip: rect(0, 0, 0, 0);
  height: 1px;
  margin: -1px;
  overflow: hidden;
  padding: 0;
  position: absolute !important;
  white-space: nowrap;
  width: 1px;
}
</style>

<style scoped>
.admin-scene {
  min-height: 100vh;
  overflow-x: clip;
  position: relative;
}

.skip-link {
  background: #0a3056;
  border-radius: 10px;
  color: #fff;
  left: 12px;
  padding: 8px 12px;
  position: absolute;
  top: -40px;
  transition: top 0.15s ease;
  z-index: 1000;
}

.skip-link:focus {
  top: 12px;
}

.bg-layer {
  inset: -8%;
  opacity: 0.7;
  pointer-events: none;
  position: fixed;
  transform: translate(var(--parallax-x), var(--parallax-y));
  transition: transform 160ms ease-out;
  z-index: 0;
}

.bg-1 {
  background:
    radial-gradient(600px 300px at -5% -10%, #e9f7ff 0%, rgba(233, 247, 255, 0) 60%),
    radial-gradient(700px 360px at 110% -8%, #fff6f9 0%, rgba(255, 246, 249, 0) 62%);
}

.bg-2 {
  background:
    radial-gradient(420px 260px at 90% 98%, #f1fffb 0%, rgba(241, 255, 251, 0) 60%),
    radial-gradient(360px 200px at 12% 96%, #f3f8ff 0%, rgba(243, 248, 255, 0) 62%);
  mix-blend-mode: multiply;
}

.bg-3 {
  background:
    conic-gradient(from 210deg at 120% -10%, rgba(110, 207, 246, 0.12), rgba(255, 255, 255, 0) 45%),
    conic-gradient(from 120deg at -20% 110%, rgba(255, 200, 230, 0.14), rgba(255, 255, 255, 0) 38%);
  opacity: 0.9;
}

.cloud {
  animation: float 9s ease-in-out infinite;
  background: var(--cloud);
  border-radius: 70px;
  filter: drop-shadow(0 14px 30px rgba(19, 60, 90, 0.08));
  height: 120px;
  position: fixed;
  width: 280px;
  z-index: 0;
}

.cloud::before,
.cloud::after {
  background: var(--cloud);
  border-radius: 80px;
  content: '';
  position: absolute;
}

.cloud::before {
  height: 120px;
  left: -60px;
  top: -18px;
  width: 160px;
}

.cloud::after {
  height: 140px;
  right: -70px;
  top: -24px;
  width: 200px;
}

.cloud-1 {
  animation-delay: 0.2s;
  left: 6%;
  top: 8%;
}

.cloud-2 {
  animation-delay: 1s;
  right: 6%;
  top: 16%;
  width: 320px;
}

.cloud-3 {
  animation-delay: 0.6s;
  bottom: 10%;
  left: 3%;
  width: 260px;
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0) translateX(0);
  }
  50% {
    transform: translateY(-8px) translateX(6px);
  }
}

.admin-shell {
  color: #0d1b2a;
  display: grid;
  grid-template-columns: 300px 1fr;
  min-height: 100vh;
  position: relative;
  z-index: 1;
}

.sidebar {
  backdrop-filter: saturate(1.05) blur(2px);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.82));
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  gap: 1rem;
  height: 100vh;
  padding: 1.25rem 1rem;
  position: sticky;
  top: 0;
}

.brand {
  align-items: center;
  background: linear-gradient(135deg, #6ecff6, #9be8ff);
  border-radius: 14px;
  box-shadow: 0 2px 10px rgba(13, 27, 42, 0.06);
  color: #08315b;
  display: flex;
  gap: 0.8rem;
  padding: 1rem;
}

.logo {
  background: #fff;
  border-radius: 12px;
  box-shadow: inset 0 -2px 0 rgba(0, 0, 0, 0.05);
  display: grid;
  font-size: 1.4rem;
  height: 48px;
  place-items: center;
  width: 48px;
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
  align-items: center;
  background: #fff;
  border: 1px solid transparent;
  border-radius: 12px;
  color: #0b2a4a;
  cursor: pointer;
  display: grid;
  font-weight: 800;
  gap: 0.75rem;
  grid-template-columns: 22px 1fr auto;
  padding: 0.65rem 0.9rem;
  text-align: left;
  transition:
    background 0.15s,
    border-color 0.15s,
    box-shadow 0.15s;
  width: 100%;
}

.nav-ico {
  display: flex;
  justify-content: center;
  width: 22px;
  align-items: center;
}

.nav-item:hover {
  background: #f7fbff;
  border-color: #cfe6fb;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.06);
}

.nav-item.active,
[aria-current='page'] {
  background: linear-gradient(180deg, #fff, #f5f9ff);
  border-color: #1d4754;
  box-shadow: 0 4px 18px rgba(0, 0, 0, 0.08);
}

.nav-item[disabled] {
  cursor: not-allowed;
  opacity: 0.5;
}

.badge {
  background: #fff2f8;
  border: 1px dashed #ffd1e7;
  border-radius: 999px;
  color: #b9467d;
  font-size: 0.72rem;
  justify-self: end;
  padding: 0.18rem 0.5rem;
}

.sidebar-spacer {
  flex: 1;
}

.content {
  display: grid;
  grid-template-rows: auto 1fr auto;
  min-width: 0;
}

.topbar {
  background-image:
    url('/wood-texture.png'),
    repeating-linear-gradient(
      90deg,
      #a67853 0px,
      #a67853 28px,
      #8f6242 28px,
      #8f6242 56px,
      #b6845d 56px,
      #b6845d 84px,
      #9c6b48 84px,
      #9c6b48 112px
    ),
    linear-gradient(180deg, #b98a63 0%, #8c5a34 100%);
  background-position:
    center,
    top center,
    center;
  background-repeat: repeat-x, repeat, no-repeat;
  background-size:
    cover,
    600px 120px,
    cover;
  box-shadow: 0 10px 24px rgba(40, 30, 16, 0.28);
  color: #fff;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.9rem 1.5rem;
  position: sticky;
  top: 0;
  z-index: 10;
}

.topbar::before {
  background:
    linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.35) 0%,
      rgba(255, 255, 255, 0.1) 35%,
      rgba(0, 0, 0, 0.08) 100%
    ),
    radial-gradient(120% 80% at 50% -30%, rgba(255, 255, 255, 0.35), rgba(255, 255, 255, 0) 60%);
  content: '';
  inset: 0;
  mix-blend-mode: overlay;
  pointer-events: none;
  position: absolute;
}

.topbar > * {
  position: relative;
  z-index: 1;
}

.topbar-title {
  color: #fff;
  font-family: 'Fredoka', cursive;
  font-size: 1.6rem;
  letter-spacing: 0.3px;
  margin: 0;
  text-shadow: 0 2px 0 rgba(0, 0, 0, 0.18);
}

.topbar-actions {
  align-items: center;
  display: flex;
  gap: 18px;
}

.refresh-link {
  appearance: none;
  background: rgba(255, 255, 255, 0.85);
  border: 0;
  border-radius: 999px;
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.12);
  color: #0b2239;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  font-weight: 900;
  gap: 8px;
  padding: 0.45rem 0.9rem;
}

.refresh-link:hover {
  background: #fff;
}

.refresh-ico {
  display: inline-flex;
  font-size: 1.05rem;
  transform: translateY(-1px);
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
  background: #fff;
  border: 1px solid #d9e4ee;
  border-radius: 999px;
  color: #0d1b2a;
  cursor: pointer;
  font-weight: 800;
  padding: 0.55rem 1rem;
  transition:
    box-shadow 0.14s ease,
    background 0.14s ease,
    border-color 0.14s ease,
    color 0.14s ease;
}

.btn:hover {
  border-color: #cfe2f3;
  box-shadow: 0 10px 24px rgba(13, 27, 42, 0.1);
}

.btn:focus-visible {
  box-shadow:
    0 0 0 4px rgba(110, 207, 246, 0.28),
    0 6px 18px rgba(13, 27, 42, 0.1);
  outline: none;
}

.btn.primary {
  background: #0a3056;
  border-color: #0a3056;
  color: #fff;
}

.btn.ghost {
  background: transparent;
  box-shadow: none;
  color: var(--bj-blue-700);
}

.btn.logout {
  background: #6ecff6;
  border-color: #56b8e1;
  color: #fff;
  font-weight: 900;
}

.btn.logout:hover {
  background: linear-gradient(180deg, #74d3f8 0%, #67c7f1 100%);
  border-color: #45acd4;
  box-shadow:
    0 0 0 4px rgba(110, 207, 246, 0.22),
    0 6px 18px rgba(13, 27, 42, 0.12);
}

.btn:disabled,
.btn[aria-disabled='true'] {
  box-shadow: none;
  cursor: not-allowed;
  opacity: 0.6;
}

.panel {
  margin: 1.25rem 1.5rem 2rem;
  padding: 0 0 2rem;
}

.panel-header {
  margin: 1rem 0 0.25rem;
}

.controls {
  align-items: center;
  display: grid;
  gap: 12px;
  grid-template-columns: 1fr auto auto auto;
}

.search-input {
  align-items: center;
  display: flex;
  position: relative;
}

.search-ico {
  left: 12px;
  opacity: 0.82;
  pointer-events: none;
  position: absolute;
}

.search-input input[type='search'] {
  background: #fff;
  border: 1px solid #d6e2ee;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 800;
  line-height: 1.35;
  padding: 0.6rem 2.2rem;
  transition:
    border-color 0.12s,
    box-shadow 0.12s,
    background 0.12s;
  width: 100%;
}

.search-input input::placeholder {
  color: #5b7083;
  font-weight: 700;
  opacity: 0.8;
}

.search-input input:focus {
  border-color: #9fd8ff;
  box-shadow: 0 0 0 4px rgba(110, 207, 246, 0.24);
  outline: none;
}

.btn-clear {
  background: transparent;
  border: 0;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1.1rem;
  padding: 0.2rem 0.4rem;
  position: absolute;
  right: 8px;
}

.filters {
  align-items: center;
  display: flex;
  gap: 8px;
}

.select select {
  background: #fff;
  border: 1px solid #d6e2ee;
  border-radius: 10px;
  font-weight: 800;
  padding: 0.56rem 0.8rem;
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

.panel-subheader {
  align-items: center;
  color: #0b2a4a;
  display: flex;
  font-weight: 900;
  gap: 0.5rem;
  margin: 0.2rem 0 0.4rem;
  padding: 0.5rem 0.2rem 0.35rem;
}

.panel-subheader.sticky {
  background: rgba(255, 255, 255, 0.92);
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 62px;
  z-index: 5;
  backdrop-filter: blur(2px);
}

.subheader-dot {
  color: #79c2f3;
  font-size: 1.4rem;
  transform: translateY(-1px);
}

.subheader-title {
  font-size: 1.02rem;
  letter-spacing: 0.2px;
  margin: 0;
}

.chips {
  display: flex;
  gap: 6px;
  margin-left: 0.5rem;
}

.chip {
  background: #f7fbff;
  border: 1px solid #d6e2ee;
  border-radius: 999px;
  cursor: pointer;
  font-weight: 900;
  padding: 0.25rem 0.55rem;
}

.panel-body {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(13, 27, 42, 0.08);
  overflow: hidden;
}

.table-head {
  align-items: center;
  background: #f7faff;
  border-bottom: 1px solid var(--border);
  color: #0b2a4a;
  display: grid;
  font-weight: 900;
  grid-template-columns: minmax(220px, 1.2fr) minmax(180px, 1fr) 160px 180px;
  padding: 0.65rem 1rem;
}

.th {
  font-size: 0.88rem;
  opacity: 0.9;
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
  align-items: center;
  background: #fff;
  border-bottom: 1px solid #eef3f8;
  display: grid;
  gap: 0;
  grid-template-columns: minmax(220px, 1.2fr) minmax(180px, 1fr) 160px 180px;
  line-height: 1.25;
  padding: 0.75rem 1rem;
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
  color: #0b2a4a;
  font-family: 'Fredoka', cursive;
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: 0.2px;
  margin: 0;
}

.orders-grid :deep(p),
.orders-grid :deep(.meta),
.orders-grid :deep(.description) {
  color: #425a70;
  font-size: 0.95rem;
  font-weight: 700;
  margin: 0;
  opacity: 0.95;
}

.orders-grid :deep(.status),
.orders-grid :deep(.status-badge) {
  background: #eef6ff;
  border: 1px solid #d6eaff;
  border-radius: 999px;
  color: #0b345e;
  font-size: 0.8rem;
  font-weight: 900;
  justify-self: start;
  padding: 0.28rem 0.6rem;
  white-space: nowrap;
}

.orders-grid :deep([data-status='verzonden' i]),
.orders-grid :deep(.status-verzonden) {
  background: #effaf5;
  border-color: #cdeee0;
  color: #0b3d2c;
}

.orders-grid :deep([data-status='geannuleerd' i]),
.orders-grid :deep(.status-geannuleerd) {
  background: #fff0f4;
  border-color: #ffd5e1;
  color: #6f1233;
}

.orders-grid :deep([data-status='te verwerken' i]),
.orders-grid :deep(.status-te-verwerken) {
  background: #fff8e8;
  border-color: #ffe2a6;
  color: #5a3a03;
}

.orders-grid :deep(a.button),
.orders-grid :deep(button) {
  background: #fff;
  border: 1px solid #d9e4ee;
  border-radius: 10px;
  color: #0b345e;
  cursor: pointer;
  font-weight: 900;
  justify-self: end;
  padding: 0.4rem 0.7rem;
  text-decoration: none;
  transition:
    box-shadow 0.12s,
    border-color 0.12s,
    background 0.12s;
}

.orders-grid :deep(a.button:hover),
.orders-grid :deep(button:hover) {
  border-color: #9bd9ff;
  box-shadow: 0 6px 14px rgba(13, 27, 42, 0.08);
}

.orders-grid :deep(a.button:focus-visible),
.orders-grid :deep(button:focus-visible) {
  box-shadow: 0 0 0 4px rgba(110, 207, 246, 0.28);
  outline: none;
}

.orders-grid :deep(button.danger),
.orders-grid :deep(button[aria-label*='Verwijderen']),
.orders-grid :deep(button[data-variant='danger']) {
  background: #fff5f8;
  border-color: #ffd8e5;
  color: #b11d49;
}

.orders-grid :deep(.is-hidden) {
  display: none !important;
}

.empty-state {
  background: linear-gradient(180deg, #f7fffb, #fff);
  border: 1px dashed #d6ecff;
  border-radius: 10px;
  margin: 0.85rem;
  padding: 1.2rem;
  text-align: center;
}

.empty-state .empty-emoji {
  font-size: 2rem;
  margin-bottom: 0.25rem;
}

.empty-actions {
  display: flex;
  gap: 8px;
  justify-content: center;
  margin-top: 0.5rem;
}

.footer {
  align-items: center;
  color: #5b7083;
  display: flex;
  font-weight: 800;
  justify-content: center;
  padding: 1.2rem 2rem;
}

@media (max-width: 1180px) {
  .admin-shell {
    grid-template-columns: 260px 1fr;
  }

  .panel {
    margin: 1rem 1rem 1.5rem;
  }

  .controls {
    grid-auto-flow: row;
    grid-template-columns: 1fr auto auto;
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
    border-bottom: 1px solid var(--border);
    border-right: 0;
    height: auto;
    position: static;
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
    gap: 6px 10px;
    grid-template-columns: 1fr;
    padding: 0.8rem 1rem;
  }

  .orders-grid :deep(.order > *:last-child) {
    justify-self: start;
  }
}
</style>
