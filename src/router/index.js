import { createRouter, createWebHistory } from 'vue-router';
import AdminView from '../views/AdminView.vue';
import OrderDetail from '../views/OrderDetail.vue';
import LoginView from '../views/LoginView.vue';

const routes = [
  // Root pad: ga altijd naar /login bij eerste bezoek (logica verplaatst naar guard)
  { path: '/', redirect: '/login' },

  // Loginpagina
  { path: '/login', name: 'Login', component: LoginView },

  { path: '/admin', name: 'Admin', component: AdminView },

  // Order detailpagina (beveiligd)
  { path: '/admin/order/:id', name: 'OrderDetail', component: OrderDetail }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});


router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token');

  // Als gebruiker niet ingelogd is en probeert naar iets anders dan /login te gaan
  if (to.path !== '/login' && !token) {
    return next('/login');
  }

  // Als gebruiker al ingelogd is en naar /login wil → redirect naar /admin
  if (to.path === '/login' && token) {
    return next('/admin');
  }

  next();
});

export default router;
