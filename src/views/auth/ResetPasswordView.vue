<!-- Új jelszó beállítása email-link token alapján. -->

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/services/api'
import AuthLayout from '@/components/AuthLayout.vue'
import BaseInput from '@/components/BaseInput.vue'
import BaseButton from '@/components/BaseButton.vue'

const route = useRoute()
const router = useRouter()

const token = ref('')
const email = ref('')
const password = ref('')
const passwordConfirmation = ref('')

const loading = ref(false)
const errors = ref({})
const generalError = ref('')
const successMsg = ref('')

const missingToken = computed(() => !token.value || !email.value)

onMounted(() => {
  token.value = typeof route.query.token === 'string' ? route.query.token : ''
  email.value = typeof route.query.email === 'string' ? route.query.email : ''
})

async function handleSubmit() {
  if (loading.value || missingToken.value) return
  loading.value = true
  errors.value = {}
  generalError.value = ''

  try {
    const res = await api.post('/reset-password', {
      token: token.value,
      email: email.value,
      password: password.value,
      password_confirmation: passwordConfirmation.value,
    })
    successMsg.value = res.data?.message || 'A jelszavad megváltozott. Bejelentkezhetsz.'
    setTimeout(() => router.push({ name: 'login' }), 1500)
  } catch (error) {
    const status = error.response?.status
    const data = error.response?.data

    if (status === 422) {
      errors.value = data?.errors || {}
      if (!data?.errors && data?.message) generalError.value = data.message
    } else if (!error.response) {
      generalError.value = 'Nem sikerült elérni a szervert.'
    } else {
      generalError.value = data?.message || 'Váratlan hiba történt.'
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
        <h2 class="text-2xl font-bold text-text">Új jelszó beállítása</h2>
        <p class="text-sm font-medium text-muted">Válassz egy erős jelszót (min. 8 karakter).</p>
      </div>
    </template>

    <div
      v-if="missingToken"
      class="bg-danger/10 border border-danger/20 text-danger text-sm px-4 py-3 rounded-lg font-medium"
      role="alert"
    >
      Hiányzik a token vagy az e-mail cím az URL-ből. Kérj új visszaállítási linket.
    </div>

    <form v-else @submit.prevent="handleSubmit" class="flex flex-col gap-5">
      <div
        v-if="generalError"
        class="bg-danger/10 border border-danger/20 text-danger text-sm px-4 py-3 rounded-lg font-medium"
        role="alert"
      >
        {{ generalError }}
      </div>

      <div
        v-if="successMsg"
        class="bg-chip/10 border border-chip/30 text-chip text-sm px-4 py-3 rounded-lg font-medium"
        role="status"
      >
        {{ successMsg }}
      </div>

      <BaseInput
        v-model="email"
        type="email"
        label="E-mail cím"
        id="rp-email"
        :error="errors.email?.[0]"
        :disabled="true"
      />

      <BaseInput
        v-model="password"
        type="password"
        label="Új jelszó"
        placeholder="Legalább 8 karakter"
        id="rp-password"
        :error="errors.password?.[0]"
        required
        :disabled="loading"
      />

      <BaseInput
        v-model="passwordConfirmation"
        type="password"
        label="Jelszó megerősítése"
        placeholder="••••••••"
        id="rp-password-confirmation"
        :error="errors.password_confirmation?.[0]"
        required
        :disabled="loading"
      />

      <div class="pt-2">
        <BaseButton type="submit" variant="primary" block :loading="loading">
          Jelszó beállítása
        </BaseButton>
      </div>
    </form>

    <div class="mt-8 text-center text-sm font-medium text-muted">
      <RouterLink
        to="/login"
        class="text-accent hover:text-accent-hover transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-sm underline decoration-accent/30 hover:decoration-accent underline-offset-4"
      >
        Vissza a bejelentkezéshez
      </RouterLink>
    </div>
  </AuthLayout>
</template>
