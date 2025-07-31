<template>
  <div class="admin-view">
    <header class="header">
      <h1>🔧 Adminpaneel</h1>
      <button @click="logout" class="logout-button">🚪 Logout</button>
    </header>

    <OrderList />
  </div>
</template>

<script>
import OrderList from '../components/OrderList.vue'

export default {
  name: 'AdminView',
  components: { OrderList },
  methods: {
    logout() {
      localStorage.removeItem('token')
      this.$router.push('/login')
    },
  },
}
</script>

<style scoped>
.admin-view {
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.logout-button {
  background-color: #e74c3c;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  font-weight: bold;
  border-radius: 5px;
  cursor: pointer;
}

.logout-button:hover {
  background-color: #c0392b;
}
</style>
