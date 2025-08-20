<template>
  <div class="od-scene" @mousemove="onParallax" :class="{ 'reduced-motion': prefersReducedMotion }">
    <a href="#main" class="skip-link">Overslaan naar hoofdinhoud</a>

    <div class="bg-layer bg-1" aria-hidden="true"></div>
    <div class="bg-layer bg-2" aria-hidden="true"></div>
    <div class="bg-layer bg-3" aria-hidden="true"></div>
    <div class="cloud cloud-1" aria-hidden="true"></div>
    <div class="cloud cloud-2" aria-hidden="true"></div>
    <div class="cloud cloud-3" aria-hidden="true"></div>

    <div class="sprinkle-burst" v-if="saveOk" aria-hidden="true">
      <i v-for="n in 24" :key="n" class="sprinkle" :style="sprinkleStyle(n)"></i>
    </div>

    <div class="topbar" role="region" aria-label="Top acties">
      <div class="topbar-inner">
        <router-link
          class="back-btn"
          to="/admin"
          aria-label="Terug naar overzicht"
          title="Terug naar overzicht"
        >
          <span class="back-ico" aria-hidden="true">
            <svg viewBox="0 0 20 20" width="18" height="18" focusable="false" aria-hidden="true">
              <path
                d="M12.5 3.5a1 1 0 0 1 0 1.4L8.4 9l4.1 4.1a1 1 0 1 1-1.4 1.4l-4.8-4.8a1 1 0 0 1 0-1.4l4.8-4.8a1 1 0 0 1 1.4 0Z"
              />
            </svg>
          </span>
          <span class="back-label">Terug</span>
        </router-link>

        <div class="spacer" role="presentation"></div>
      </div>
      <div
        class="progress"
        v-if="isSaving"
        role="progressbar"
        aria-label="Opslaan..."
        aria-busy="true"
      >
        <div class="progress-bar"></div>
      </div>
    </div>

    <div class="page-center" :aria-busy="isLoading ? 'true' : 'false'">
      <header class="hero" role="banner">
        <div class="hero-wrap">
          <div class="hero-left">
            <div class="gelato" aria-hidden="true">🍦</div>
            <div class="titling">
              <nav class="crumbs" aria-label="Kruimelpad">
                <router-link to="/admin">Overzicht</router-link>
                <span aria-hidden="true">/</span>
                <span>Bestelling</span>
              </nav>
              <h1 class="title">Bestelling Details</h1>
              <p class="subtitle">
                <strong>{{ order.name || '—' }}</strong>
                <span class="dot" aria-hidden="true">•</span>
                <span class="muted">ID: {{ order._id || '—' }}</span>
              </p>
            </div>
          </div>

          <div class="hero-stats" :class="{ loading: isLoading }">
            <div class="stat">
              <div class="stat-k">Status</div>
              <div class="stat-v">
                <span class="status-badge big" :class="statusBadgeClass">
                  {{ order.status || (isLoading ? 'Laden…' : '—') }}
                </span>
              </div>
            </div>
            <div class="stat">
              <div class="stat-k">Totaal</div>
              <div class="stat-v">{{ formatPrice(order.price) }}</div>
            </div>
            <div class="stat">
              <div class="stat-k">Besteld op</div>
              <div class="stat-v">{{ formatDate(order.createdAt) }}</div>
            </div>
          </div>
        </div>
        <div class="hero-wave" aria-hidden="true"></div>
      </header>

      <main id="main" class="stage" aria-label="Hoofdinhoud">
        <section class="card big" :class="{ loading: isLoading }" aria-labelledby="cardCustomer">
          <h2 id="cardCustomer" class="card-title">Klant &amp; Bestelling</h2>

          <div class="kv-grid">
            <div class="field">
              <label class="label">Klant</label>
              <div class="fake-input" :data-skel="isLoading">{{ order.name || '—' }}</div>
            </div>

            <div class="field">
              <label class="label">Adres</label>
              <div class="fake-input" :data-skel="isLoading">{{ order.address || '—' }}</div>
            </div>

            <div class="field">
              <label class="label">Smaak</label>
              <div class="fake-input" :data-skel="isLoading">{{ order.flavor || '—' }}</div>
            </div>

            <div class="field">
              <label class="label">Topping</label>
              <div class="fake-input" :data-skel="isLoading">{{ order.topping || '—' }}</div>
            </div>

            <div class="field">
              <label class="label">Prijs</label>
              <div class="fake-input">{{ formatPrice(order.price) }}</div>
            </div>

            <div class="field">
              <label class="label">Besteld op</label>
              <div class="fake-input">{{ formatDate(order.createdAt) }}</div>
            </div>
          </div>
        </section>

        <section class="card side" aria-labelledby="statusTitle">
          <h2 id="statusTitle" class="card-title">Status &amp; Afhandeling</h2>

          <div class="status-block">
            <label class="label sr-only" for="statusSelect">Wijzig status</label>
            <select
              id="statusSelect"
              class="select"
              v-model="order.status"
              @change="updateStatus"
              :disabled="isSaving || !order._id"
            >
              <option value="te verwerken">Te verwerken</option>
              <option value="verzonden">Verzonden</option>
              <option value="geannuleerd">Geannuleerd</option>
            </select>

            <div class="quick-actions" role="group" aria-label="Snelle acties">
              <button
                class="tag"
                :class="{ active: statusIs('te verwerken') }"
                @click="setStatus('te verwerken')"
              >
                ⏳ Te verwerken
              </button>
              <button
                class="tag"
                :class="{ active: statusIs('verzonden') }"
                @click="setStatus('verzonden')"
              >
                🚚 Verzonden
              </button>
              <button
                class="tag"
                :class="{ active: statusIs('geannuleerd') }"
                @click="setStatus('geannuleerd')"
              >
                ❌ Geannuleerd
              </button>
            </div>
          </div>

          <div class="summary" role="list">
            <div class="sum-item" role="listitem">
              <span class="sum-ico" aria-hidden="true">👤</span>
              <div>
                <div class="sum-label">Klant</div>
                <div class="sum-value">{{ order.name || '—' }}</div>
              </div>
            </div>
            <div class="sum-item" role="listitem">
              <span class="sum-ico" aria-hidden="true">🕒</span>
              <div>
                <div class="sum-label">Laatst bijgewerkt</div>
                <div class="sum-value">
                  {{ formatDate(updatedAt || order.updatedAt || order.createdAt) }}
                </div>
              </div>
            </div>
            <div class="sum-item" role="listitem">
              <span class="sum-ico" aria-hidden="true">💶</span>
              <div>
                <div class="sum-label">Totaal</div>
                <div class="sum-value">{{ formatPrice(order.price) }}</div>
              </div>
            </div>
          </div>

          <ol class="timeline" aria-label="Bestelstatus tijdlijn">
            <li class="tl-item done">
              <span class="dot"></span>
              <div>
                <div class="tl-title">Bestelling geplaatst</div>
                <div class="tl-sub">{{ formatDate(order.createdAt) }}</div>
              </div>
            </li>
            <li class="tl-item" :class="{ done: statusIs('verzonden') || statusIs('geannuleerd') }">
              <span class="dot"></span>
              <div>
                <div class="tl-title">Verwerking</div>
                <div class="tl-sub muted">Order voorbereiden</div>
              </div>
            </li>
            <li class="tl-item" :class="{ done: statusIs('verzonden') }">
              <span class="dot"></span>
              <div>
                <div class="tl-title">Verzonden</div>
                <div class="tl-sub" v-if="statusIs('verzonden')">Onderweg naar klant</div>
                <div class="tl-sub muted" v-else>Wachtend op verzending</div>
              </div>
            </li>
            <li class="tl-item cancelled" v-if="statusIs('geannuleerd')">
              <span class="dot"></span>
              <div>
                <div class="tl-title">Geannuleerd</div>
                <div class="tl-sub">Bestelling is geannuleerd</div>
              </div>
            </li>
          </ol>
        </section>
      </main>
    </div>

    <transition name="toast">
      <div v-if="saveOk" class="toast" role="status" aria-live="polite">
        <span class="toast-ico" aria-hidden="true">🎉</span>
        <strong>Status opgeslagen</strong>
      </div>
    </transition>
    <transition name="toast">
      <div v-if="errorMsg" class="toast error" role="alert" aria-atomic="true">
        <span class="toast-ico" aria-hidden="true">⚠️</span>
        <strong>{{ errorMsg }}</strong>
      </div>
    </transition>
  </div>
</template>

<script>
export default {
  name: 'OrderDetail',
  data() {
    return {
      order: {},
      isSaving: false,
      isLoading: true,
      saveOk: false,
      errorMsg: '',
      updatedAt: null,
      prefersReducedMotion: false,
      parallax: { x: 0, y: 0 },
    }
  },
  computed: {
    statusBadgeClass() {
      const s = (this.order.status || '').toLowerCase()
      return {
        'status--pending': s === 'te verwerken',
        'status--shipped': s === 'verzonden',
        'status--cancelled': s === 'geannuleerd',
      }
    },
  },
  async mounted() {
    try {
      this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    } catch (_) {}
    try {
      const id = this.$route.params.id
      const res = await fetch(`http://localhost:5000/api/orders/${id}`, {
        headers: { Authorization: 'Bearer ' + localStorage.getItem('token') },
      })
      if (!res.ok) throw new Error('Kon bestelling niet ophalen (' + res.status + ')')
      this.order = await res.json()
    } catch (err) {
      console.error(err)
      this.errorMsg = 'Kan bestelling niet laden. Probeer het later opnieuw.'
      setTimeout(() => (this.errorMsg = ''), 4000)
    } finally {
      this.isLoading = false
    }
  },
  methods: {
    formatDate(date) {
      if (!date) return '—'
      try {
        return new Date(date).toLocaleString('nl-BE', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      } catch {
        return '—'
      }
    },
    formatPrice(value) {
      const n = Number(value)
      const safe = Number.isFinite(n) ? n : 0
      try {
        return new Intl.NumberFormat('nl-BE', { style: 'currency', currency: 'EUR' }).format(safe)
      } catch {
        return `€ ${safe.toFixed(2)}`
      }
    },
    statusIs(val) {
      return (this.order.status || '').toLowerCase() === val
    },
    async setStatus(next) {
      if (!this.order._id || this.statusIs(next)) return
      this.order.status = next
      await this.updateStatus()
    },
    async updateStatus() {
      if (!this.order._id) return
      try {
        this.isSaving = true
        this.errorMsg = ''
        const res = await fetch(`http://localhost:5000/api/orders/${this.order._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + localStorage.getItem('token'),
          },
          body: JSON.stringify({ status: this.order.status }),
        })
        if (!res.ok) throw new Error('Update mislukt (' + res.status + ')')
        this.updatedAt = Date.now()
        this.saveOk = true
        setTimeout(() => (this.saveOk = false), 1500)
      } catch (err) {
        console.error('Fout bij updaten status:', err)
        this.errorMsg = 'Opslaan mislukt. Controleer je verbinding.'
        setTimeout(() => (this.errorMsg = ''), 4000)
      } finally {
        this.isSaving = false
      }
    },
    onParallax(e) {
      if (this.prefersReducedMotion) return
      const { innerWidth, innerHeight } = window
      const x = (e.clientX / innerWidth - 0.5) * 2
      const y = (e.clientY / innerHeight - 0.5) * 2
      this.parallax = { x, y }
      document.documentElement.style.setProperty('--parallax-x', (x * 10).toFixed(2) + 'px')
      document.documentElement.style.setProperty('--parallax-y', (y * 10).toFixed(2) + 'px')
    },
    sprinkleStyle(n) {
      const angle = (n - 1) * 15
      const delay = (n % 6) * 70
      return { '--a': angle + 'deg', animationDelay: delay + 'ms' }
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
  --bj-sky-300: #7fd3ff;
  --bj-sky-200: #b6e7ff;
  --bj-mint-200: #b6f5e1;
  --bj-straw-200: #ffd1e1;
  --bj-choco-600: #5a3b22;
  --border: #e7eef6;
  --muted: #667a8b;
  --card: #ffffff;
  --bg: #f7fbff;

  --cloud: #ffffff;
  --spr-1: #ffb3c7;
  --spr-2: #8ae5c2;
  --spr-3: #ffd27a;
  --spr-4: #a7c8ff;
  --spr-5: #ffc89e;

  --content-w: min(1600px, 96vw);
  --radius-lg: 22px;
  --radius-md: 16px;
  --ring: 0 0 0 3px rgba(25, 146, 193, 0.22);

  --parallax-x: 0px;
  --parallax-y: 0px;
}

html,
body,
#app {
  height: 100%;
  overflow-x: clip;
  background: linear-gradient(180deg, #f9fcff 0%, #fff 40%);
  color: var(--bj-blue-900);
  font-family:
    'Nunito',
    system-ui,
    -apple-system,
    Segoe UI,
    Roboto,
    sans-serif;
}

*,
*::before,
*::after {
  box-sizing: border-box;
}

:where(button, a, select):focus-visible {
  outline: none;
  box-shadow: var(--ring);
  border-radius: 999px;
}

.reduced-motion * {
  animation: none !important;
  transition: none !important;
}
@media (prefers-reduced-motion: reduce) {
  .bg-layer,
  .cloud,
  .sprinkle,
  .hero-wave,
  .toast {
    animation: none !important;
    transition: none !important;
  }
}

@media (prefers-color-scheme: dark) {
  :root {
    --card: #0f1720;
    --bg: #0b1220;
    --border: #1e2a38;
    --muted: #9bb3c3;
    --bj-blue-900: #e6f3ff;
  }
  html,
  body,
  #app {
    background: linear-gradient(180deg, #0b1220 0%, #0f1720 40%);
  }
}
</style>

<style scoped>
.od-scene {
  min-height: 100vh;
  position: relative;
  overflow-x: clip;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  background:
    radial-gradient(800px 380px at -10% -12%, #eaf7ff 0%, rgba(234, 247, 255, 0) 60%),
    radial-gradient(820px 420px at 112% -8%, #fff6f9 0%, rgba(255, 246, 249, 0) 58%);
}

.skip-link {
  position: absolute;
  left: 12px;
  top: -40px;
  background: #0a3056;
  color: #fff;
  padding: 8px 12px;
  border-radius: 10px;
  z-index: 1000;
  transition: top 0.15s ease;
}
.skip-link:focus {
  top: 12px;
}

.bg-layer {
  position: absolute;
  inset: -8%;
  pointer-events: none;
  z-index: 0;
  opacity: 0.7;
  transform: translate(var(--parallax-x), var(--parallax-y));
  transition: transform 160ms ease-out;
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
  position: absolute;
  width: 280px;
  height: 120px;
  background: var(--cloud);
  border-radius: 70px;
  filter: drop-shadow(0 14px 30px rgba(19, 60, 90, 0.08));
  z-index: 0;
  animation: float 9s ease-in-out infinite;
}
.cloud::before,
.cloud::after {
  content: '';
  position: absolute;
  background: var(--cloud);
  border-radius: 80px;
}
.cloud::before {
  width: 160px;
  height: 120px;
  left: -60px;
  top: -18px;
}
.cloud::after {
  width: 200px;
  height: 140px;
  right: -70px;
  top: -24px;
}
.cloud-1 {
  top: 8%;
  left: 10%;
  animation-delay: 0.2s;
}
.cloud-2 {
  top: 16%;
  right: 8%;
  width: 320px;
  animation-delay: 1s;
}
.cloud-3 {
  bottom: 12%;
  left: 4%;
  width: 260px;
  animation-delay: 0.6s;
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

.sprinkle-burst {
  position: fixed;
  inset: 0;
  pointer-events: none;
  overflow: visible;
  z-index: 40;
}
.sprinkle {
  position: absolute;
  left: 50%;
  top: calc(100% - 70px);
  width: 10px;
  height: 4px;
  border-radius: 2px;
  transform-origin: center;
  animation: spr-out 700ms ease-out forwards;
}
.sprinkle:nth-child(5n + 1) {
  background: var(--spr-1);
}
.sprinkle:nth-child(5n + 2) {
  background: var(--spr-2);
}
.sprinkle:nth-child(5n + 3) {
  background: var(--spr-3);
}
.sprinkle:nth-child(5n + 4) {
  background: var(--spr-4);
}
.sprinkle:nth-child(5n + 5) {
  background: var(--spr-5);
}
@keyframes spr-out {
  0% {
    opacity: 0;
    transform: translate(-50%, 0) rotate(var(--a)) translateY(0) scale(0.6);
  }
  12% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translate(-50%, 0) rotate(var(--a)) translateY(-180px) scale(1);
  }
}

.topbar {
  position: sticky;
  top: 0;
  z-index: 20;
  background: linear-gradient(180deg, #1676a133, #1676a100);
  backdrop-filter: saturate(1.1) blur(5px);
}

.topbar-inner {
  position: relative;
  max-width: var(--content-w);
  margin: 0 auto;
  padding: 12px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.back-btn {
  --bg: rgba(255, 255, 255, 0.72);
  position: absolute;
  left: 8px;
  top: 8px;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-radius: 999px;
  text-decoration: none;
  font-weight: 900;
  border: 1px solid #d9e4ee;
  background: var(--bg);
  color: var(--bj-blue-700);
  box-shadow: 0 6px 14px rgba(13, 27, 42, 0.08);
  transition:
    transform 0.08s ease,
    box-shadow 0.12s ease,
    background 0.12s ease,
    border-color 0.12s ease;
}
.back-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 22px rgba(13, 27, 42, 0.12);
}
.back-btn:active {
  transform: translateY(0);
}
.back-btn:focus-visible {
  box-shadow:
    0 0 0 3px rgba(25, 146, 193, 0.22),
    0 6px 14px rgba(13, 27, 42, 0.12);
}
.back-btn .back-ico svg {
  display: block;
}
.back-btn .back-ico svg path {
  fill: currentColor;
}
.back-btn .kbd-hint {
  font-weight: 800;
  font-size: 0.78rem;
  padding: 2px 6px;
  border-radius: 8px;
  border: 1px solid #dbe6ef;
  background: #f4f9ff;
  color: #3b6a8a;
}

.progress {
  height: 3px;
  width: 100%;
  overflow: hidden;
}
.progress-bar {
  height: 3px;
  width: 40%;
  background: linear-gradient(90deg, var(--bj-sky-300), var(--bj-mint-200));
  border-radius: 999px;
  animation: indet 1.1s ease-in-out infinite;
}
@keyframes indet {
  0% {
    transform: translateX(-120%);
  }
  100% {
    transform: translateX(340%);
  }
}
.spacer {
  flex: 1;
}

.page-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 0;
  flex: 1;
}
.hero {
  position: relative;
  z-index: 1;
}
.hero-wrap {
  max-width: var(--content-w);
  margin: 6px auto 0;
  padding: 0 12px 6px;
  display: grid;
  grid-template-columns: 1.3fr 1fr;
  gap: 12px;
  align-items: end;
}
@media (max-width: 1200px) {
  .hero-wrap {
    grid-template-columns: 1fr;
    gap: 8px;
  }
}
.hero-left {
  display: flex;
  gap: 14px;
  align-items: center;
}
.gelato {
  width: 64px;
  height: 64px;
  border-radius: 18px;
  display: grid;
  place-items: center;
  background: #fff;
  box-shadow: 0 12px 28px rgba(13, 27, 42, 0.12);
  font-size: 1.35rem;
}
.titling {
  display: grid;
  gap: 3px;
}
.crumbs {
  display: flex;
  gap: 8px;
  font-weight: 900;
  color: var(--muted);
}
.crumbs a {
  color: var(--bj-blue-700);
  text-decoration: none;
}
.crumbs a:hover {
  text-decoration: underline;
}
.title {
  margin: 0;
  font-family: 'Fredoka', system-ui;
  font-weight: 800;
  font-size: 2.15rem;
  letter-spacing: 0.2px;
  color: var(--bj-blue-700);
  text-shadow: 0 2px 0 #ffffff;
}
.subtitle {
  margin: 0;
  font-weight: 900;
  color: var(--muted);
}
.subtitle .dot {
  margin: 0 6px;
  color: #79c2f3;
}

.hero-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}
.stat {
  padding: 12px;
  border: 2px dashed var(--border);
  border-radius: var(--radius-lg);
  background:
    radial-gradient(circle at 20% -10%, #ffffff, #ffffff) padding-box,
    linear-gradient(135deg, #fff 0%, #f9fdff 100%) border-box;
  box-shadow: 0 12px 26px rgba(13, 27, 42, 0.08);
}
.stat-k {
  font-size: 0.84rem;
  color: var(--muted);
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.4px;
}
.stat-v {
  font-weight: 900;
  font-size: 1.04rem;
  color: var(--bj-blue-900);
}

.hero-stats.loading .stat-v,
.card.loading .fake-input[data-skel='true'] {
  position: relative;
  color: transparent;
}
.hero-stats.loading .stat-v::after,
.card.loading .fake-input[data-skel='true']::after {
  content: '';
  display: block;
  height: 1em;
  border-radius: 6px;
  background: linear-gradient(90deg, #edf4fb, #f6fbff, #edf4fb);
  animation: shimmer 1.3s infinite;
}
@keyframes shimmer {
  0% {
    background-position: -120% 0;
  }
  100% {
    background-position: 120% 0;
  }
}

.status-badge {
  display: inline-block;
  padding: 0.34rem 0.7rem;
  border-radius: 999px;
  font-weight: 900;
  font-size: 0.84rem;
  border: 2px solid #d6eaff;
  background: #eef6ff;
  color: var(--bj-blue-800);
  white-space: nowrap;
  box-shadow: 0 2px 0 #ffffff inset;
}
.status-badge.big {
  font-size: 0.92rem;
  padding: 0.38rem 0.74rem;
}
.status--shipped {
  background: #effaf5;
  color: #0b3d2c;
  border-color: #cdeee0;
}
.status--cancelled {
  background: #fff0f4;
  color: #6f1233;
  border-color: #ffd5e1;
}
.status--pending {
  background: #fff8e8;
  color: #5a3a03;
  border-color: #ffe2a6;
}

.hero-wave {
  height: 10px;
  margin: 0 auto;
  max-width: var(--content-w);
  border-radius: 999px 999px 0 0;
  background: repeating-linear-gradient(-45deg, #ffffff 0 10px, #f7fbff 10px 20px);
  box-shadow: 0 -10px 28px rgba(13, 27, 42, 0.05) inset;
}

.stage {
  position: relative;
  z-index: 1;
  max-width: var(--content-w);
  width: 100%;
  margin: 0 auto;
  padding: 0 12px 12px;
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: 1.6fr 1fr;
  align-items: stretch;
  gap: 12px;
  overflow: visible;
}
@media (max-width: 1200px) {
  .stage {
    grid-template-columns: 1fr;
  }
}

.card {
  background:
    radial-gradient(circle at 12% 0%, #ffffff, #ffffff) padding-box,
    linear-gradient(180deg, #ffffff, #fbfeff) border-box;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: 0 18px 42px rgba(13, 27, 42, 0.1);
  padding: 14px;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.card.side {
  align-self: stretch;
}
.card-title {
  margin: 2px 2px 10px;
  font-size: 1.08rem;
  font-weight: 900;
  color: var(--bj-blue-900);
  font-family: 'Fredoka', system-ui;
}

.kv-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px 14px;
  overflow: hidden;
}
@media (max-width: 680px) {
  .kv-grid {
    grid-template-columns: 1fr;
  }
}
.field {
  display: grid;
  gap: 6px;
}
.label {
  font-weight: 900;
  font-size: 0.94rem;
  color: var(--bj-blue-900);
}
.fake-input {
  padding: 12px;
  border: 1px solid #d6e2ee;
  border-radius: var(--radius-md);
  background: #fff;
  font-weight: 900;
  color: #3f5468;
  box-shadow: inset 0 -1px 0 rgba(0, 0, 0, 0.02);
}

.select {
  width: 100%;
  padding: 10px 12px;
  border-radius: var(--radius-md);
  border: 1px solid #d6e2ee;
  background: #fff;
  font-weight: 900;
  color: var(--bj-blue-900);
}
.select:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.quick-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 10px;
}
.tag {
  padding: 0.38rem 0.76rem;
  border-radius: 999px;
  border: 1px solid #d6e2ee;
  background: linear-gradient(180deg, #f7fbff, #eef6ff);
  font-weight: 900;
  cursor: pointer;
  transition:
    transform 0.06s ease,
    box-shadow 0.06s ease;
}
.tag:hover {
  transform: translateY(-1px);
}
.tag:active {
  transform: translateY(0);
}
.tag.active {
  border-color: #0a3056;
  box-shadow: 0 0 0 2px rgba(13, 48, 86, 0.08) inset;
}

.summary {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed var(--border);
  display: grid;
  gap: 12px;
  overflow: hidden;
}
.sum-item {
  display: grid;
  grid-template-columns: 32px 1fr;
  gap: 10px;
  align-items: center;
}
.sum-ico {
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  border-radius: 10px;
  background: #f2f7fc;
  font-size: 1.02rem;
}
.sum-label {
  font-size: 0.84rem;
  color: var(--muted);
  font-weight: 900;
}
.sum-value {
  font-weight: 900;
  color: var(--bj-blue-900);
}

.timeline {
  margin: 14px 0 2px;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 12px;
  overflow: hidden;
}
.tl-item {
  position: relative;
  padding-left: 30px;
}
.tl-item .dot {
  position: absolute;
  left: 0;
  top: 6px;
  width: 16px;
  height: 16px;
  border-radius: 999px;
  background: #cfe6fb;
  border: 3px solid #f0f7ff;
  box-shadow: 0 0 0 2px #e8eef5;
}
.tl-item.done .dot {
  background: #6bd29e;
}
.tl-item.cancelled .dot {
  background: #e86a93;
}
.tl-title {
  font-weight: 900;
  color: var(--bj-blue-900);
}
.tl-sub {
  font-size: 0.9rem;
  font-weight: 800;
  color: #425a70;
}
.tl-sub.muted {
  color: var(--muted);
}

.btn {
  appearance: none;
  border: 1px solid #d9e4ee;
  padding: 0.52rem 0.98rem;
  border-radius: 999px;
  background: #fff;
  color: var(--bj-blue-900);
  cursor: pointer;
  font-weight: 900;
  transition:
    transform 0.06s ease,
    box-shadow 0.12s ease,
    background 0.12s ease;
}
.btn:hover {
  transform: translateY(-1px);
}
.btn:active {
  transform: translateY(0);
}
.btn[disabled] {
  opacity: 0.6;
  cursor: not-allowed;
}
.btn.primary {
  background: #0a3056;
  color: #fff;
  border-color: #0a3056;
}
.btn.primary:hover {
  box-shadow: 0 6px 18px rgba(10, 48, 86, 0.22);
}
.btn.ghost {
  background: transparent;
  box-shadow: none;
  color: var(--bj-blue-700);
}
.btn.danger {
  border-color: #ffd8e5;
}
.btn.danger.ghost {
  color: #b11d49;
}

.toast {
  position: fixed;
  left: 50%;
  bottom: 18px;
  transform: translateX(-50%);
  background: #0a3056;
  color: #fff;
  border: 1px solid #0a3056;
  padding: 10px 16px;
  border-radius: 999px;
  font-weight: 900;
  display: inline-flex;
  gap: 8px;
  align-items: center;
  box-shadow: 0 14px 30px rgba(10, 48, 86, 0.25);
  z-index: 50;
}
.toast.error {
  background: #a3173d;
  border-color: #a3173d;
}
.toast-ico {
  font-size: 1rem;
}
.toast-enter-active,
.toast-leave-active {
  transition: all 0.22s ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translate(-50%, 10px);
}

.sr-only {
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
