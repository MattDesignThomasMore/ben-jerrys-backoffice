<template>
  <div>
    <p v-if="error" class="error">{{ error }}</p>

    <OrderCard v-for="order in orders" :key="order._id" :order="order" @refresh="fetchOrders" />

    <p v-if="orders.length === 0 && !error">Geen bestellingen gevonden.</p>
  </div>
</template>

<script>
import OrderCard from './OrderCard.vue'
import { apiFetch } from '@/lib/api'

export default {
  name: 'OrderList',
  components: { OrderCard },
  data() {
    return {
      orders: [],
      error: '',
      loading: false,
    }
  },
  methods: {
    async fetchOrders() {
      this.error = ''
      this.loading = true
      try {
        // als er geen token is → naar login
        const token = localStorage.getItem('token')
        if (!token) {
          this.$router.replace('/login')
          return
        }

        // apiFetch geeft direct JSON terug
        const data = await apiFetch('/api/orders')

        this.orders = Array.isArray(data) ? data : []
      } catch (err) {
        console.error('Fout bij ophalen bestellingen:', err)

        // Bij 401 werd geen token gestuurd of verlopen → naar login
        if (
          String(err?.message || '')
            .toLowerCase()
            .includes('401')
        ) {
          localStorage.removeItem('token')
          this.$router.replace('/login')
          return
        }

        this.orders = []
        this.error = err.message || 'Kan bestellingen niet laden.'
      } finally {
        this.loading = false
      }
    },
  },
  mounted() {
    this.fetchOrders()
  },
}
</script>

<style scoped>
.error {
  color: red;
  font-weight: bold;
  margin-bottom: 10px;
}
</style>
