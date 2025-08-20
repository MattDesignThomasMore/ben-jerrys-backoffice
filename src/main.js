import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

const token = localStorage.getItem('token')
if (token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    const isExpired = payload.exp * 1000 < Date.now()
    if (isExpired) {
      localStorage.removeItem('token')
      console.warn('🔒 JWT-token verlopen en verwijderd.')
    }
  } catch (e) {
    localStorage.removeItem('token')
    console.warn('🔒 Ongeldige token verwijderd.')
  }
}

createApp(App).use(router).mount('#app')
