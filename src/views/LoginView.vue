<template> 
  <div class="login-container">
    <div class="overlay"></div>
    <div class="login-card">
      <h2>Admin login</h2>
      <form @submit.prevent="handleLogin">
        <div class="input-group">
          <svg class="icon" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M12 12c2.21 0 4-1.79 4-4S14.21 4 12 4 8 5.79 8 8s1.79 4 4 4Zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4Z"
            />
          </svg>
          <input type="email" v-model="email" placeholder="Email" required />
        </div>

        <div class="input-group">
          <svg class="icon" viewBox="0 0 24 24">
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
          <svg class="toggle-icon" @click="togglePassword" viewBox="0 0 24 24">
            <path
              v-if="!showPassword"
              fill="currentColor"
              d="M12 4.5c-4.8 0-8.8 3.2-10 7.5 1.2 4.3 5.2 7.5 10 7.5s8.8-3.2 10-7.5c-1.2-4.3-5.2-7.5-10-7.5Zm0 13c-3 0-5.6-2.1-6.4-5 .8-2.9 3.4-5 6.4-5s5.6 2.1 6.4 5c-.8 2.9-3.4 5-6.4 5Zm0-8a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z"
            />
            <path
              v-else
              fill="currentColor"
              d="M2 4.27 3.28 3 21 20.72 19.73 22l-2.4-2.4C15.78 20.16 13.96 21 12 21c-4.8 0-8.8-3.2-10-7.5.6-2.2 2-4.1 3.8-5.4L2 4.27ZM12 5c1.3 0 2.5.4 3.5 1.1l-1.6 1.6A4.98 4.98 0 0 0 12 7a5 5 0 0 0-5 5c0 .7.1 1.3.3 1.9L4.6 9.5C5.7 6.8 8.7 5 12 5Zm0 14c1.3 0 2.5-.4 3.5-1.1l-2.5-2.5a4.98 4.98 0 0 1-6.3-6.3l-2.5-2.5c-1.1 1.7-1.8 3.6-2.1 5.6C3.2 15.8 7.2 19 12 19Z"
            />
          </svg>
        </div>

        <button type="submit">Login</button>
        <p v-if="error" class="error">{{ error }}</p>
      </form>
    </div>
  </div>
</template>

<script>
export default {
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

<style>
html,
body {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  overflow: hidden; 
}

body {
  background: url('https://images.unsplash.com/photo-1542281286-9e0a16bb7366?auto=format&fit=crop&w=1950&q=80')
    no-repeat center center fixed;
  background-size: cover;
}


.login-container {
  height: 100vh; 
  width: 100vw;
  display: flex;
  align-items: center; 
  justify-content: center; 
  position: relative;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.overlay {
  position: absolute;
  inset: 0;
  background-color: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
  z-index: 0;
}

.login-card {
  position: relative;
  z-index: 1;
  background: #fff;
  padding: 2.5rem 2rem;
  border-radius: 1.25rem;
  width: 90%;
  max-width: 420px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.1);
}

h2 {
  text-align: center;
  font-size: 1.8rem;
  font-weight: 600;
  color: #2e3a59;
  margin-bottom: 2rem;
}

form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.input-group {
  position: relative;
  display: flex;
  align-items: center;
}

.input-group input {
  width: 100%;
  padding: 0.9rem 2.8rem;
  border: 1px solid #d0d5dd;
  border-radius: 0.75rem;
  font-size: 1rem;
  color: #2e3a59;
  background-color: #f9fafb;
  transition: 0.2s ease;
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
}

.toggle-icon {
  position: absolute;
  right: 1rem;
  width: 20px;
  height: 20px;
  fill: #4a4a4a;
  cursor: pointer;
  transition: 0.2s ease;
}

.toggle-icon:hover {
  fill: #4facfe;
}

button {
  padding: 0.9rem;
  font-size: 1rem;
  font-weight: 600;
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

.error {
  color: #e74c3c;
  text-align: center;
  font-size: 0.9rem;
}

.input-group {
  position: relative;
  overflow: visible; 
}

.input-group input {
  padding: 0.9rem 3.2rem; 
}

.toggle-icon {
  position: absolute;
  right: 0.8rem; 
  width: 24px; 
  height: 24px;
  overflow: visible; 
}
</style>
