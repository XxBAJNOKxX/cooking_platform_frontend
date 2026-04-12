import './style.css'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'

import App from './App.vue'
import router from './router'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)

const initApp = async () => {
  const authStore = useAuthStore()

  if (authStore.token) {
    try {
      await authStore.fetchUser()
    } catch (error) {
      console.error('Failed to initialize authenticated user', error)
      authStore.token = null
    }
  }

  app.use(router)
  app.mount('#app')
}

initApp()
