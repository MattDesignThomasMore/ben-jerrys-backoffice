<template>
  <div class="login">
    <h2>Admin Login</h2>
    <form @submit.prevent="handleLogin">
      <input v-model="email" type="email" placeholder="Email" required />
      <input v-model="password" type="password" placeholder="Wachtwoord" required />
      <button type="submit">Login</button>
      <p v-if="error">{{ error }}</p>
    </form>
  </div>
</template>

<script>
export default {
  data() {
    return {
      email: '',
      password: '',
      error: ''
    };
  },
  methods: {
    async handleLogin() {
      try {
        const res = await fetch('http://localhost:5000/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: this.email,
            password: this.password
          })
        });

        if (!res.ok) throw new Error('Login mislukt');
        
        const data = await res.json();
        localStorage.setItem('token', data.token);
        this.$router.push('/admin');
      } catch (err) {
        this.error = err.message;
      }
    }
  }
};
</script>
