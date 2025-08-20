<template>
  <div>

    <p v-if="error" class="error">{{ error }}</p>

    <OrderCard v-for="order in orders" :key="order._id" :order="order" @refresh="fetchOrders" />

    <p v-if="orders.length === 0 && !error">Geen bestellingen gevonden.</p>
  </div>
</template>

<script>
import OrderCard from './OrderCard.vue'

export default {
  name: 'OrderList',
  components: { OrderCard },
  data() {
    return {
      orders: [],
      error: '',
    }
  },
  methods: {
    async fetchOrders() {
      try {
        const token = localStorage.getItem('token')

        if (!token) {
          this.$router.push('/login')
          return
        }

        const res = await fetch('http://localhost:5000/api/orders', {
          headers: {
            Authorization: 'Bearer ' + token,
          },
        })

        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem('token')
          this.$router.push('/login')
          return
        }

        if (!res.ok) {
          throw new Error('Ophalen mislukt: ' + res.status)
        }

        this.orders = await res.json()
        this.error = ''
      } catch (err) {
        console.error('Fout bij ophalen bestellingen:', err)
        this.orders = []
        this.error = 'Kan bestellingen niet laden.'
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
