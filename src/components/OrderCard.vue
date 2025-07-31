<template>
  <div class="order-card">
    <h3>{{ order.name }}</h3>
    <p>{{ order.flavor }} met {{ order.topping }}</p>
    <p>Status:
      <select v-model="selectedStatus" @change="updateStatus">
        <option value="te verwerken">Te verwerken</option>
        <option value="verzonden">Verzonden</option>
        <option value="geannuleerd">Geannuleerd</option>
      </select>
    </p>
    <button @click="deleteOrder">🗑 Verwijderen</button>
    <router-link :to="`/admin/order/${order._id}`">🔎 Bekijk details</router-link>
  </div>
</template>

<script>
export default {
  name: 'OrderCard',
  props: {
    order: Object
  },
  data() {
    return {
      selectedStatus: this.order.status
    };
  },
  methods: {
    async updateStatus() {
      try {
        const res = await fetch(`http://localhost:5000/api/orders/${this.order._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + localStorage.getItem('token')
          },
          body: JSON.stringify({ status: this.selectedStatus })
        });

        if (!res.ok) throw new Error('Update mislukt');

        this.$emit('refresh');
      } catch (err) {
        console.error('Update-fout:', err);
      }
    },
    async deleteOrder() {
      try {
        const res = await fetch(`http://localhost:5000/api/orders/${this.order._id}`, {
          method: 'DELETE',
          headers: {
            Authorization: 'Bearer ' + localStorage.getItem('token')
          }
        });

        if (!res.ok) throw new Error('Verwijderen mislukt');

        this.$emit('refresh');
      } catch (err) {
        console.error('Verwijder-fout:', err);
      }
    }
  }
};
</script>
