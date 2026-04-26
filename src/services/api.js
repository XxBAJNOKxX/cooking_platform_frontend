import axios from 'axios'
import router from '@/router'

// Központi axios kliens — Bearer token automatikus csatolás + 401/403 kezelés (kijelentkeztet vagy OTP-re visz)
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    const code = error.response?.data?.code

    // Hitelesítetlen user védett végpontot ér el → OTP képernyő (nem jelentkeztetjük ki)
    if (status === 403 && code === 'VERIFICATION_REQUIRED') {
      if (router.currentRoute.value.name !== 'verify-otp') {
        router.push({ name: 'verify-otp' })
      }
      return Promise.reject(error)
    }

    if (status === 401 || status === 403) {
      import('@/stores/auth').then(({ useAuthStore }) => {
        useAuthStore().clearAuth()
      })

      if (router.currentRoute.value.name !== 'login') {
        router.push({ name: 'login' })
      }
    }
    return Promise.reject(error)
  },
)

export default api
