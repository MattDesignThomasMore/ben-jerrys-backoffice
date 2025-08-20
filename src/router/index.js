import { createRouter, createWebHistory } from 'vue-router'
import AdminView from '../views/AdminView.vue'
import OrderDetail from '../views/OrderDetail.vue'
import LoginView from '../views/LoginView.vue'

const routes = [
  { path: '/', redirect: '/login' },

  { path: '/login', name: 'Login', component: LoginView },

  { path: '/admin', name: 'Admin', component: AdminView },

  { path: '/admin/order/:id', name: 'OrderDetail', component: OrderDetail },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')

  if (to.path !== '/login' && !token) {
    return next('/login')
  }

  if (to.path === '/login' && token) {
    return next('/admin')
  }

  next()
})

export default router
