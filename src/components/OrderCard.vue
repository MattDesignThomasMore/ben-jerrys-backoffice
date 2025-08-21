<template>
  <div class="order-card">
    <h3>{{ order.name }}</h3>
    <p>{{ order.flavor }} met {{ order.topping }}</p>
    <p>
      Status:
      <select v-model="selectedStatus" @change="updateStatus" :disabled="loading">
        <option value="te verwerken">Te verwerken</option>
        <option value="verzonden">Verzonden</option>
        <option value="geannuleerd">Geannuleerd</option>
      </select>
    </p>
    <button @click="deleteOrder" :disabled="loading">🗑 Verwijderen</button>
    <router-link :to="`/admin/order/${order._id}`">🔎 Bekijk details</router-link>

    <p v-if="error" class="error">{{ error }}</p>
  </div>
</template>

<script>
import { apiFetch } from '@/lib/api'

export default {
  name: 'OrderCard',
  props: {
    order: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      selectedStatus: this.order.status,
      loading: false,
      error: '',
    }
  },
  methods: {
    async updateStatus() {
      if (!this.order._id) return
      this.loading = true
      this.error = ''
      try {
        await apiFetch(`/api/orders/${this.order._id}`, {
          method: 'PUT',
          body: JSON.stringify({ status: this.selectedStatus }),
        })
        this.$emit('refresh')
      } catch (err) {
        console.error('Update-fout:', err)
        this.error = 'Kan status niet bijwerken.'
      } finally {
        this.loading = false
      }
    },
    async deleteOrder() {
      if (!this.order._id) return
      this.loading = true
      this.error = ''
      try {
        await apiFetch(`/api/orders/${this.order._id}`, {
          method: 'DELETE',
        })
        this.$emit('refresh')
      } catch (err) {
        console.error('Verwijder-fout:', err)
        this.error = 'Kan bestelling niet verwijderen.'
      } finally {
        this.loading = false
      }
    },
  },
}
</script>

<style scoped>
.order-card {
  border: 1px solid #ddd;
  padding: 12px;
  margin: 10px 0;
  border-radius: 8px;
  background: #fff;
}
.error {
  color: red;
  margin-top: 6px;
  font-weight: bold;
}
</style>
