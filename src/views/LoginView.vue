<template>
  <div class="login-page">
    <div class="login-container">
      <div class="overlay"></div>

      <div class="login-card">
        <h2>Admin login</h2>

        <form @submit.prevent="handleLogin">
          <div class="input-group">
            <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="currentColor"
                d="M12 12c2.21 0 4-1.79 4-4S14.21 4 12 4 8 5.79 8 8s1.79 4 4 4Zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4Z"
              />
            </svg>
            <input type="email" v-model="email" placeholder="Email" required />
          </div>

          <div class="input-group">
            <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="currentColor"
                d="M12 1a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V11a2 2 0 0 0-2-2h-1V6a5 5 0 0 0-5-5Zm-3 5a3 3 0 1 1 6 0v3H9V6Zm3 6a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Z"
              />
            </svg>

            <input
              :type="showPassword ? 'text' : 'password'"
              v-model="password"
              placeholder="Wachtwoord"
              required
            />

            <svg class="toggle-icon" @click="togglePassword" viewBox="0 0 24 24" aria-hidden="true">
              <path
                v-if="!showPassword"
                fill="currentColor"
                d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5C21.27 7.61 17 4.5 12 4.5Zm0 12.5c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5Zm0-8a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z"
              />
              <path
                v-else
                fill="currentColor"
                d="M12 7c2.76 0 5 2.24 5 5 0 .74-.16 1.45-.46 2.08l2.15 2.15C20.53 14.9 21.74 13.08 23 12c-1.73-4.39-6-7.5-11-7.5-1.59 0-3.11.29-4.5.82l2.19 2.19C10.55 7.16 11.26 7 12 7Zm-9.9-4.1L3.5 4.3l1.72 1.72C3.82 7.34 2.39 9.45 1 12c1.73 4.39 6 7.5 11 7.5 2.02 0 3.94-.49 5.63-1.36L19.7 20.2l1.41-1.41L3.51 2.49 2.1 2.9ZM7.91 8.71l1.53 1.53c-.3.45-.44.98-.38 1.54.12 1.17 1.05 2.1 2.22 2.22.56.06 1.09-.08 1.54-.38l1.53 1.53c-.88.52-1.89.79-2.95.68-2.02-.22-3.63-1.84-3.85-3.86-.11-1.06.16-2.07.68-2.96Z"
              />
            </svg>
          </div>

          <button type="submit">Login</button>

          <!-- subtiele disclaimer onder de knop -->
          <p class="admin-note">
            Alleen voor beheerders · gekoppeld aan de Ben &amp; Jerry’s Ice Configurator. Klanten
            bestellen via de configurator.
          </p>

          <p v-if="error" class="error">{{ error }}</p>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'LoginView',
  data() {
    return {
      email: '',
      password: '',
      showPassword: false,
      error: '',
    }
  },
  methods: {
    togglePassword() {
      this.showPassword = !this.showPassword
    },
    async handleLogin() {
      try {
        const res = await fetch('http://localhost:5000/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: this.email, password: this.password }),
        })
        if (!res.ok) throw new Error('Login mislukt')
        const data = await res.json()
        localStorage.setItem('token', data.token)
        this.$router.push('/admin')
      } catch (err) {
        this.error = err.message
      }
    },
  },
}
</script>

<style scoped>
/* === Vaste canvas — geen scrollbars === */
.login-page {
  position: fixed;
  inset: 0;
  overflow: hidden;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.login-container {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: url('https://www.benjerry.com/files/live/sites/systemsite/files/US%20and%20Global%20Assets/Misc%20and%20Sitewide%20Assets/Cards/card_scoop_shop_1080x720.jpg?imwidth=1200')
    no-repeat center center / cover;
}

.overlay {
  position: absolute;
  inset: 0;
  background-color: rgba(190, 188, 188, 0.7);
  backdrop-filter: blur(10px);
  z-index: 0;
}

.login-card {
  position: relative;
  z-index: 1;
  background: #fff;
  padding: 2.5rem 2rem;
  border-radius: 1.25rem;
  width: min(660px, 92%);
  max-height: 90%;
  overflow-y: auto;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.1);
}

h2 {
  text-align: center;
  font-size: 2rem;
  font-weight: 700;
  color: #2e3a59;
  margin-bottom: 2rem; /* <-- hier meer ruimte, was 0.5rem */
}

/* Subtiele backoffice vermelding */
.subtle-note {
  text-align: center;
  font-size: 0.9rem;
  color: #6b7280;
  margin-bottom: 1.6rem;
}

/* Form */
form {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
}

.input-group {
  position: relative;
  display: flex;
  align-items: center;
}

.input-group input {
  width: 100%;
  padding: 0.95rem 3.4rem 0.95rem 3rem;
  border: 1px solid #d0d5dd;
  border-radius: 0.75rem;
  font-size: 1rem;
  color: #2e3a59;
  background-color: #f9fafb;
  transition: 0.2s ease;
  appearance: none;
}

.input-group input:focus {
  outline: none;
  border-color: #4facfe;
  background-color: #fff;
  box-shadow: 0 0 0 3px rgba(79, 172, 254, 0.15);
}

.icon {
  position: absolute;
  left: 1rem;
  width: 20px;
  height: 20px;
  fill: #a0aec0;
  pointer-events: none;
}

.toggle-icon {
  position: absolute;
  right: 0.9rem;
  width: 24px;
  height: 24px;
  display: block;
  fill: #4a4a4a;
  cursor: pointer;
  transition: 0.2s ease;
  z-index: 2;
}

.toggle-icon:hover {
  fill: #4facfe;
}

button {
  margin-top: 0.3rem;
  padding: 0.95rem;
  font-size: 1rem;
  font-weight: 700;
  border: none;
  border-radius: 0.75rem;
  background-color: #4facfe;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 6px 24px rgba(79, 172, 254, 0.25);
}

button:hover {
  background-color: #3d9ff5;
  transform: translateY(-2px);
  box-shadow: 0 10px 30px rgba(79, 172, 254, 0.35);
}

/* Subtiele disclaimer onder knop */
.admin-note {
  margin-top: 0.6rem;
  font-size: 0.8rem;
  text-align: center;
  color: #9ca3af; /* lichter grijs */
  line-height: 1.35;
}

.error {
  color: #e74c3c;
  text-align: center;
  font-size: 0.9rem;
}

.login-page * {
  box-sizing: border-box;
  max-width: 100%;
}
</style>
