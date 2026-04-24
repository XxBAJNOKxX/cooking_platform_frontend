<!-- Felhasználói beállítások modal (avatar, bio, jelszó). -->

<script setup>
import { ref, watch } from 'vue'
import api from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import BaseModal from '@/components/BaseModal.vue'
import BaseButton from '@/components/BaseButton.vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue'])

const authStore = useAuthStore()

const form = ref({ username: '', phone: '', bio: '', avatar_url: '' })
const loading = ref(false)
const errors = ref({})
const success = ref(false)
const avatarUploading = ref(false)
const avatarFileRef = ref(null)

async function uploadAvatar(file) {
  if (!file) return
  avatarUploading.value = true
  try {
    const fd = new FormData()
    fd.append('file', file)
    fd.append('folder', 'avatars')
    const { data } = await api.post('/upload', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    form.value.avatar_url = data.url
  } catch {
    errors.value = { ...errors.value, avatar_url: ['Feltöltés sikertelen.'] }
  } finally {
    avatarUploading.value = false
    if (avatarFileRef.value) avatarFileRef.value.value = ''
  }
}

const avatarDragOver = ref(false)

function onAvatarDrop(e) {
  avatarDragOver.value = false
  const dt = e.dataTransfer
  if (dt.files?.length) {
    uploadAvatar(dt.files[0])
    return
  }
  const url = dt.getData('text/uri-list') || dt.getData('text/plain') || dt.getData('text/html')
  const match = url?.match(/https?:\/\/[^\s"'<>]+/)
  if (match) {
    form.value.avatar_url = match[0]
  }
}

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      const u = authStore.user ?? {}
      form.value = {
        username: u.username ?? '',
        phone: u.phone ?? '',
        bio: u.bio ?? '',
        avatar_url: u.avatar_url ?? '',
      }
      errors.value = {}
      success.value = false
    }
  },
)

async function save() {
  loading.value = true
  errors.value = {}
  success.value = false
  try {
    const res = await api.put('/profile', form.value)
    authStore.user = res.data.data
    success.value = true
    setTimeout(() => emit('update:modelValue', false), 900)
  } catch (err) {
    const bag = err.response?.data?.errors ?? {}
    errors.value = bag
    if (!Object.keys(bag).length && err.response?.data?.message) {
      errors.value._general = err.response.data.message
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <BaseModal
    :model-value="modelValue"
    title="Profil szerkesztése"
    max-width="max-w-md"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="form-body">
      <Transition name="success-bar">
        <div v-if="success" class="success-bar" role="status">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            aria-hidden="true"
          >
            <path d="M20 6L9 17l-5-5" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          Mentve!
        </div>
      </Transition>

      <p v-if="errors._general" class="err-general" role="alert">{{ errors._general }}</p>

      <div class="field">
        <label class="lbl" for="s-username">Felhasználónév</label>
        <input
          id="s-username"
          v-model="form.username"
          class="inp"
          :class="{ 'inp-err': errors.username }"
          type="text"
          autocomplete="username"
        />
        <p v-if="errors.username" class="field-err">{{ errors.username[0] }}</p>
      </div>

      <div class="field">
        <label class="lbl" for="s-phone">Telefonszám</label>
        <input
          id="s-phone"
          v-model="form.phone"
          class="inp"
          :class="{ 'inp-err': errors.phone }"
          type="tel"
          autocomplete="tel"
          placeholder="+36 30 123 4567"
        />
        <p v-if="errors.phone" class="field-err">{{ errors.phone[0] }}</p>
      </div>

      <div class="field">
        <label class="lbl" for="s-bio">Bio</label>
        <textarea
          id="s-bio"
          v-model="form.bio"
          class="inp inp-ta"
          :class="{ 'inp-err': errors.bio }"
          rows="3"
          placeholder="Mondd el ki vagy és mit főzöl szívesen…"
        />
        <p v-if="errors.bio" class="field-err">{{ errors.bio[0] }}</p>
      </div>

      <div class="field">
        <label class="lbl" for="s-avatar">Profilkép</label>
        <div
          class="avatar-drop"
          :class="{ 'avatar-drop--over': avatarDragOver }"
          @dragover.prevent="avatarDragOver = true"
          @dragleave="avatarDragOver = false"
          @drop.prevent="onAvatarDrop"
        >
          <div class="avatar-row">
            <div v-if="form.avatar_url" class="avatar-preview">
              <img
                :src="form.avatar_url"
                alt="Avatar előnézet"
                class="avatar-preview-img"
                @error="form.avatar_url = ''"
              />
            </div>
            <div class="avatar-inputs">
              <input
                id="s-avatar"
                v-model="form.avatar_url"
                class="inp"
                :class="{ 'inp-err': errors.avatar_url }"
                type="url"
                placeholder="https://… vagy dobd ide"
              />
              <button
                type="button"
                class="avatar-upload-btn"
                :disabled="avatarUploading"
                @click="avatarFileRef.click()"
              >
                <svg
                  v-if="avatarUploading"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.2"
                  class="avatar-spin"
                  aria-hidden="true"
                >
                  <path
                    d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"
                    stroke-linecap="round"
                  />
                </svg>
                <svg
                  v-else
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.2"
                  aria-hidden="true"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke-linecap="round" />
                  <polyline points="17,8 12,3 7,8" stroke-linecap="round" />
                  <line x1="12" y1="3" x2="12" y2="15" stroke-linecap="round" />
                </svg>
                {{ avatarUploading ? 'Feltöltés…' : 'Kép feltöltése' }}
              </button>
              <input
                ref="avatarFileRef"
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                class="hidden-file"
                @change="uploadAvatar($event.target.files?.[0])"
              />
            </div>
          </div>
          <p v-if="avatarDragOver" class="avatar-drop-hint">Engedd el — feltöltjük.</p>
        </div>
        <p v-if="errors.avatar_url" class="field-err">{{ errors.avatar_url[0] }}</p>
      </div>
    </div>

    <template #footer>
      <BaseButton variant="primary" block :loading="loading" @click="save">Mentés</BaseButton>
    </template>
  </BaseModal>
</template>

<style scoped>
.form-body {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.success-bar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-radius: 0.625rem;
  background: color-mix(in srgb, var(--color-chip) 12%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-chip) 30%, transparent);
  color: var(--color-chip);
  font-size: 0.875rem;
  font-weight: 700;
}
.success-bar svg {
  width: 1rem;
  height: 1rem;
}

.success-bar-enter-active {
  transition:
    opacity 200ms var(--ease-ui-out),
    transform 200ms var(--ease-ui-out);
}
.success-bar-enter-from {
  opacity: 0;
  transform: translateY(-4px) scale(0.97);
}

.err-general {
  font-size: 0.8125rem;
  color: var(--color-danger);
  background: color-mix(in srgb, var(--color-danger) 8%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-danger) 22%, transparent);
  border-radius: 0.5rem;
  padding: 0.5rem 0.75rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.lbl {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--color-muted);
}

.inp {
  width: 100%;
  padding: 0.6rem 0.875rem;
  border-radius: 0.75rem;
  border: 1.5px solid var(--color-stroke);
  background: var(--color-bg);
  font-size: 0.9rem;
  color: var(--color-text);
  outline: 3px solid transparent;
  outline-offset: 0;
  transition:
    border-color 150ms ease,
    outline-color 150ms ease;
}
.inp::placeholder {
  color: var(--color-muted);
}
.inp:focus {
  border-color: var(--color-accent);
  outline-color: color-mix(in srgb, var(--color-accent) 22%, transparent);
}
.inp-err {
  border-color: var(--color-danger);
}
.inp-ta {
  resize: vertical;
  min-height: 80px;
  font-family: inherit;
}

.field-err {
  font-size: 0.78rem;
  color: var(--color-danger);
  margin: 0;
}

/* ── Avatar upload ── */
.avatar-drop {
  border-radius: 0.875rem;
  border: 1.5px dashed transparent;
  padding: 4px;
  transition:
    border-color 160ms ease,
    background 160ms ease;
}
.avatar-drop--over {
  border-color: var(--color-accent);
  background: color-mix(in srgb, var(--color-accent) 6%, transparent);
}

.avatar-drop-hint {
  margin: 4px 0 0;
  text-align: center;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-accent);
}

.avatar-row {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.avatar-preview {
  flex-shrink: 0;
  width: 3rem;
  height: 3rem;
  border-radius: 999px;
  overflow: hidden;
  border: 2px solid var(--color-stroke);
}
.avatar-preview-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-inputs {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.avatar-upload-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.45rem 0.875rem;
  border-radius: 0.625rem;
  border: 1.5px solid var(--color-stroke);
  background: var(--color-surface);
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--color-muted);
  cursor: pointer;
  transition:
    background 150ms ease,
    border-color 150ms ease,
    color 150ms ease,
    transform 150ms var(--ease-ui-out);
  align-self: flex-start;
}
.avatar-upload-btn svg {
  width: 0.875rem;
  height: 0.875rem;
  flex-shrink: 0;
}
.avatar-upload-btn:hover:not(:disabled) {
  border-color: var(--color-accent);
  color: var(--color-accent);
  background: color-mix(in srgb, var(--color-accent) 6%, transparent);
}
.avatar-upload-btn:active:not(:disabled) {
  transform: scale(0.96);
}
.avatar-upload-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.hidden-file {
  display: none;
}

.avatar-spin {
  animation: spin 0.8s linear infinite;
}
</style>
