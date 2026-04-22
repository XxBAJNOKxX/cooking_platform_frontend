<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import AuthLayout from '@/components/AuthLayout.vue'
import BaseButton from '@/components/BaseButton.vue'
import OtpCodeInput from '@/components/OtpCodeInput.vue'

const router = useRouter()
const authStore = useAuthStore()

const code = ref('')
const loading = ref(false)
const errors = ref({})
const generalError = ref('')
const successMsg = ref('')

const resendLoading = ref(false)
const resendCooldown = ref(0)
let cooldownTimer = null

function startCooldown(sec = 30) {
  resendCooldown.value = sec
  clearInterval(cooldownTimer)
  cooldownTimer = setInterval(() => {
    resendCooldown.value--
    if (resendCooldown.value <= 0) clearInterval(cooldownTimer)
  }, 1000)
}

async function submit() {
  if (loading.value) return
  loading.value = true
  errors.value = {}
  generalError.value = ''

  try {
    const res = await api.post('/auth/verify-otp', { code: code.value })
    successMsg.value = res.data?.message || 'Sikeres hitelesítés!'
    if (res.data?.user) authStore.user = res.data.user
    setTimeout(() => router.push('/'), 900)
  } catch (error) {
    const status = error.response?.status
    const data = error.response?.data
    if (status === 422) {
      errors.value = data?.errors || {}
      if (!data?.errors && data?.message) generalError.value = data.message
    } else if (status === 429) {
      generalError.value = 'Túl sok próbálkozás. Várj pár másodpercet.'
    } else {
      generalError.value = data?.message || 'Hiba a hitelesítés során.'
    }
  } finally {
    loading.value = false
  }
}

async function resend() {
  if (resendLoading.value || resendCooldown.value > 0) return
  resendLoading.value = true
  generalError.value = ''
  try {
    await api.post('/auth/resend-otp')
    successMsg.value = 'Új kódot küldtünk az e-mail címedre.'
    startCooldown(30)
  } catch (error) {
    const data = error.response?.data
    generalError.value = data?.message || 'Nem sikerült új kódot küldeni.'
  } finally {
    resendLoading.value = false
  }
}

function skip() {
  router.push('/')
}

onMounted(() => {
  if (authStore.user?.is_verified) router.replace('/')
})

onBeforeUnmount(() => clearInterval(cooldownTimer))
</script>

<template>
  <AuthLayout>
    <template #subtitle>
      <div class="mt-2 space-y-1.5">
        <h2 class="text-2xl font-bold text-text">E-mail hitelesítése</h2>
        <p class="text-sm font-medium text-muted">
          Küldtünk egy 6-jegyű kódot az e-mail címedre. Írd be alább.
        </p>
      </div>
    </template>

    <form @submit.prevent="submit" class="flex flex-col gap-5">
      <div v-if="generalError"
        class="bg-danger/10 border border-danger/20 text-danger text-sm px-4 py-3 rounded-lg font-medium"
        role="alert">
        {{ generalError }}
      </div>

      <div v-if="successMsg"
        class="bg-chip/10 border border-chip/30 text-chip text-sm px-4 py-3 rounded-lg font-medium"
        role="status">
        {{ successMsg }}
      </div>

      <div class="otp-field">
        <label class="otp-label">Hitelesítési kód</label>
        <OtpCodeInput
          v-model="code"
          :length="6"
          :disabled="loading"
          :has-error="!!errors.code?.[0]"
          @complete="submit"
        />
        <p v-if="errors.code?.[0]" class="otp-error">{{ errors.code[0] }}</p>
      </div>

      <div class="pt-2">
        <BaseButton type="submit" variant="primary" block :loading="loading">
          Hitelesítés
        </BaseButton>
      </div>

      <div class="flex items-center justify-between text-sm">
        <button type="button" class="otp-link" :disabled="resendLoading || resendCooldown > 0" @click="resend">
          <span v-if="resendCooldown > 0">Új kód ({{ resendCooldown }}s)</span>
          <span v-else>Új kód küldése</span>
        </button>
        <button type="button" class="otp-link otp-link--muted" @click="skip">
          Most kihagyom
        </button>
      </div>
    </form>
  </AuthLayout>
</template>

<style scoped>
.otp-link {
  background: transparent;
  border: none;
  color: var(--color-accent);
  font-weight: 700;
  font-size: 0.8rem;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  border-radius: 0.4rem;
  transition: background 150ms ease, color 150ms ease, opacity 150ms ease;
}
.otp-link:hover:not(:disabled) {
  background: color-mix(in srgb, var(--color-accent) 10%, transparent);
}
.otp-link:disabled { opacity: 0.5; cursor: not-allowed; }
.otp-link--muted { color: var(--color-muted); font-weight: 600; }
.otp-link--muted:hover:not(:disabled) {
  color: var(--color-text);
  background: var(--color-surface);
}

.otp-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.otp-label {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--color-text);
  text-align: center;
  letter-spacing: 0.02em;
}
.otp-error {
  margin: 0;
  font-size: 0.78rem;
  color: var(--color-danger);
  text-align: center;
}
</style>
