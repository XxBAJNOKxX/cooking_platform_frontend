<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import AuthLayout from '@/components/AuthLayout.vue'
import BaseInput from '@/components/BaseInput.vue'
import BaseButton from '@/components/BaseButton.vue'

const router = useRouter()
const authStore = useAuthStore()

const form = ref({
  username: '',
  email: '',
  password: '',
  password_confirmation: ''
})

const loading = ref(false)
const errors = ref({})
const generalError = ref('')

const handleRegister = async () => {
  if (loading.value) return

  loading.value = true
  errors.value = {}
  generalError.value = ''

  try {
    await authStore.register(form.value)

    router.push('/')
  } catch (error) {
    const status = error.response?.status
    const data = error.response?.data

    if (status === 422) {
      errors.value = data?.errors || {}
      if (!data?.errors && data?.message) {
        generalError.value = data.message
      }
    } else if (status === 429) {
      generalError.value = data?.message
        || 'Túl sok regisztrációs próbálkozás. Próbáld újra később.'
    } else if (!error.response) {
      generalError.value = 'Nem sikerült elérni a szervert. Ellenőrizd az internetkapcsolatot.'
    } else if (status >= 500) {
      generalError.value = 'Szerverhiba történt. Kérjük, próbáld újra később.'
    } else {
      generalError.value = data?.message || 'Hiba a regisztráció során. Kérjük, próbáld újra!'
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <AuthLayout>
    <template #subtitle>
      <div class="mt-2 space-y-1.5">
        <h2 class="text-2xl font-bold text-text">Csatlakozz közösségünkhöz!</h2>
        <p class="text-sm font-medium text-muted">Hozzádférhetsz heti naptárakhoz, saját bevásárlólistákhoz és több ezer exkluzív recepthez.</p>
      </div>
    </template>

    <form @submit.prevent="handleRegister" class="flex flex-col gap-4">

      <div v-if="generalError"
        class="bg-danger/10 border border-danger/20 text-danger text-sm px-4 py-3 rounded-lg font-medium transition-all"
        role="alert">
        {{ generalError }}
      </div>

      <BaseInput v-model="form.username" type="text" label="Felhasználónév" placeholder="CookrGourmet" id="username"
        :error="errors.username?.[0]" required :disabled="loading" />

      <BaseInput v-model="form.email" type="email" label="E-mail cím" placeholder="sutemeny@email.hu" id="email"
        :error="errors.email?.[0]" required :disabled="loading" />

      <BaseInput v-model="form.password" type="password" label="Jelszó" placeholder="Legalább 8 karakter" id="password"
        :error="errors.password?.[0]" required :disabled="loading" />

      <BaseInput v-model="form.password_confirmation" type="password" label="Jelszó megerősítése" placeholder="••••••••"
        id="password_confirmation" :error="errors.password_confirmation?.[0]" required :disabled="loading" />

      <div class="pt-3">
        <BaseButton type="submit" variant="primary" block :loading="loading">
          Fiók létrehozása
        </BaseButton>
      </div>
    </form>

    <div class="mt-8 text-center text-sm font-medium text-muted">
      Már van fiókod?
      <RouterLink to="/login"
        class="text-accent hover:text-accent-hover transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-sm underline decoration-accent/30 hover:decoration-accent underline-offset-4">
        Jelentkezz be
      </RouterLink>
    </div>
  </AuthLayout>
</template>
