import { createRouter, createWebHistory } from 'vue-router'
import AdminView from '../views/AdminView.vue'
import OrderDetail from '../views/OrderDetail.vue'

const routes = [
  // 👉 Redirect root ("/") naar /admin
  { path: '/', redirect: '/admin' },

  // 🧾 Admin overzicht (lijst van bestellingen)
  { path: '/admin', name: 'Admin', component: AdminView },

  // 📄 Order detailpagina
  { path: '/admin/order/:id', name: 'OrderDetail', component: OrderDetail },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
