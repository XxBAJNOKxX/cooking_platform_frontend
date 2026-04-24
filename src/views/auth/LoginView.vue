<!-- Bejelentkezés redirect-back támogatással. -->

<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import AuthLayout from '@/components/AuthLayout.vue'
import BaseInput from '@/components/BaseInput.vue'
import BaseButton from '@/components/BaseButton.vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

function sanitizeRedirect(raw) {
  if (typeof raw !== 'string' || !raw.startsWith('/') || raw.startsWith('//')) return null
  return raw
}

const email = ref('')
const password = ref('')
const loading = ref(false)
const errors = ref({})
const generalError = ref('')

const handleLogin = async () => {
  if (loading.value) return

  loading.value = true
  errors.value = {}
  generalError.value = ''

  try {
    await authStore.login({
      email: email.value,
      password: password.value,
    })

    const redirect = sanitizeRedirect(route.query.redirect)
    router.push(redirect || '/')
  } catch (error) {
    const status = error.response?.status
    const data = error.response?.data

    if (status === 422) {
      errors.value = data?.errors || {}
      if (!data?.errors && data?.message) {
        generalError.value = data.message
      }
    } else if (status === 429) {
      generalError.value =
        data?.errors?.email?.[0] || data?.message || 'Túl sok próbálkozás. Próbáld újra később.'
    } else if (!error.response) {
      generalError.value = 'Nem sikerült elérni a szervert. Ellenőrizd az internetkapcsolatot.'
    } else if (status >= 500) {
      generalError.value = 'Szerverhiba történt. Kérjük, próbáld újra később.'
    } else {
      generalError.value = data?.message || 'Váratlan hiba történt. Kérjük, próbáld újra később.'
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
        <h2 class="text-2xl font-bold text-text">Üdvözlünk!</h2>
        <p class="text-sm font-medium text-muted">
          Jelentkezz be, és merülj el a receptek és közös főzések világában.
        </p>
      </div>
    </template>

    <form @submit.prevent="handleLogin" class="flex flex-col gap-5">
      <div
        v-if="generalError"
        class="bg-danger/10 border border-danger/20 text-danger text-sm px-4 py-3 rounded-lg font-medium transition-all"
        role="alert"
      >
        {{ generalError }}
      </div>

      <BaseInput
        v-model="email"
        type="email"
        label="E-mail cím"
        placeholder="pelda@email.hu"
        id="email"
        :error="errors.email?.[0]"
        required
        :disabled="loading"
      />

      <BaseInput
        v-model="password"
        type="password"
        label="Jelszó"
        placeholder="••••••••"
        id="password"
        :error="errors.password?.[0]"
        required
        :disabled="loading"
      />

      <div class="flex justify-end -mt-2">
        <RouterLink
          to="/forgot-password"
          class="text-xs font-semibold text-muted hover:text-accent transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-sm"
        >
          Elfelejtett jelszó?
        </RouterLink>
      </div>

      <div class="pt-2">
        <BaseButton type="submit" variant="primary" block :loading="loading">
          Bejelentkezés
        </BaseButton>
      </div>
    </form>

    <div class="mt-8 text-center text-sm font-medium text-muted">
      Nincs még fiókod?
      <RouterLink
        to="/register"
        class="text-accent hover:text-accent-hover transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-sm underline decoration-accent/30 hover:decoration-accent underline-offset-4"
      >
        Regisztrálj itt
      </RouterLink>
    </div>
  </AuthLayout>
</template>
