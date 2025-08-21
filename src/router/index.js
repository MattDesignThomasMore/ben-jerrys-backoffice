// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'

import AdminView from '../views/AdminView.vue'
import OrderDetail from '../views/OrderDetail.vue'
import LoginView from '../views/LoginView.vue'

const routes = [
  // Altijd eerst naar login
  { path: '/', redirect: { name: 'login' } },

  // Publieke route
  { path: '/login', name: 'login', component: LoginView },

  // Beschermde routes
  { path: '/admin', name: 'admin', component: AdminView, meta: { requiresAuth: true } },
  {
    path: '/admin/order/:id',
    name: 'orderDetail',
    component: OrderDetail,
    meta: { requiresAuth: true },
  },

  // 404 → terug naar login (voorkomt rare SPA errors op Render)
  { path: '/:pathMatch(.*)*', redirect: { name: 'login' } },
]

const router = createRouter({
  // history-mode voor SPA op Render
  // Bij Vite mag je ook createWebHistory(import.meta.env.BASE_URL) gebruiken;
  // dit werkt prima:
  history: createWebHistory(),
  routes,
})

// Auth guard
router.beforeEach((to, _from, next) => {
  const token = localStorage.getItem('token')

  // 1) naar protected zonder token? → login
  if (to.meta.requiresAuth && !token) return next({ name: 'login' })

  // 2) al ingelogd en naar login? → admin
  if (to.name === 'login' && token) return next({ name: 'admin' })

  // 3) verder
  return next()
})

export default router
