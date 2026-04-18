<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/services/api'
import BaseInput from '@/components/BaseInput.vue'
import BaseButton from '@/components/BaseButton.vue'
import AddressAutocomplete from '@/components/tools/AddressAutocomplete.vue'
import ToolMap from '@/components/tools/ToolMap.vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'

const route = useRoute()
const router = useRouter()

const isEdit = computed(() => !!route.params.id)
const toolId = computed(() => route.params.id)

const loading = ref(false)
const saving = ref(false)
const serverError = ref('')
const fieldErrors = reactive({})

const form = reactive({
  name: '',
  description: '',
  image_url: '',
  price_per_day: null,
  country: 'Magyarország',
  county: '',
  city: '',
  postal_code: '',
  street: '',
  house_number: '',
  latitude: null,
  longitude: null,
  is_available: true,
})

const addressQuery = ref('')

// ─── Image upload ────────────────────────────────────────────────
const imgDragOver = ref(false)
const imgBroken = ref(false)
const imageUploading = ref(false)
const fileInputRef = ref(null)

async function uploadFile(file) {
  if (!file) return
  imageUploading.value = true
  imgBroken.value = false
  delete fieldErrors.image_url
  try {
    const fd = new FormData()
    fd.append('file', file)
    fd.append('folder', 'tools')
    const { data } = await api.post('/upload', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    form.image_url = data.url
  } catch {
    serverError.value = 'Képfeltöltés sikertelen. Próbáld újra.'
  } finally {
    imageUploading.value = false
    if (fileInputRef.value) fileInputRef.value.value = ''
  }
}

function onFileChange(e) {
  uploadFile(e.target.files?.[0])
}

function onImgDrop(e) {
  imgDragOver.value = false
  const dt = e.dataTransfer
  if (dt.files?.length) {
    uploadFile(dt.files[0])
    return
  }
  const url = dt.getData('text/uri-list') || dt.getData('text/plain') || dt.getData('text/html')
  const match = url?.match(/https?:\/\/[^\s"'<>]+/)
  if (match) {
    form.image_url = match[0]
    imgBroken.value = false
  }
}

const hasCoords = computed(() =>
  typeof form.latitude === 'number' && typeof form.longitude === 'number'
)

async function loadExisting() {
  if (!isEdit.value) return
  loading.value = true
  try {
    const res = await api.get(`/kitchen-tools/${toolId.value}`)
    const t = res.data.data
    Object.assign(form, {
      name: t.name ?? '',
      description: t.description ?? '',
      image_url: t.image_url ?? '',
      price_per_day: t.price_per_day ?? null,
      country: t.country ?? 'Magyarország',
      county: t.county ?? '',
      city: t.city ?? '',
      postal_code: t.postal_code ?? '',
      street: t.street ?? '',
      house_number: t.house_number ?? '',
      latitude: t.latitude ?? null,
      longitude: t.longitude ?? null,
      is_available: !!t.is_available,
    })
    const addr = [t.postal_code, t.city, t.street, t.house_number].filter(Boolean).join(' ')
    addressQuery.value = addr || t.address || ''
  } catch (e) {
    serverError.value = 'Nem sikerült betölteni az eszközt.'
    console.error(e)
  } finally {
    loading.value = false
  }
}

onMounted(loadExisting)

function onAddressSelect(hit) {
  form.country      = hit.country      || form.country
  form.county       = hit.county       || ''
  form.city         = hit.city         || ''
  form.postal_code  = hit.postalCode   || ''
  form.street       = hit.street       || ''
  form.house_number = hit.houseNumber  || ''
  form.latitude     = hit.lat
  form.longitude    = hit.lng
}

function validate() {
  Object.keys(fieldErrors).forEach(k => delete fieldErrors[k])
  let ok = true

  if (!form.name.trim()) { fieldErrors.name = 'Kötelező'; ok = false }
  if (!(Number(form.price_per_day) >= 0)) { fieldErrors.price_per_day = 'Adj meg érvényes árat'; ok = false }
  if (!form.city.trim()) { fieldErrors.city = 'Válassz címet a keresőből'; ok = false }
  if (!hasCoords.value) { fieldErrors.address = 'Válassz egy címet a javaslatokból'; ok = false }

  return ok
}

async function submit() {
  serverError.value = ''
  if (!validate()) return

  const payload = {
    name: form.name.trim(),
    description: form.description || null,
    image_url: form.image_url || null,
    price_per_day: Number(form.price_per_day),
    country: form.country || null,
    county: form.county || null,
    city: form.city,
    postal_code: form.postal_code || null,
    street: form.street || null,
    house_number: form.house_number || null,
    address: [form.postal_code, form.city, form.street, form.house_number]
      .filter(Boolean).join(' ').trim() || null,
    latitude: form.latitude,
    longitude: form.longitude,
    is_available: form.is_available,
  }

  saving.value = true
  try {
    const res = isEdit.value
      ? await api.put(`/kitchen-tools/${toolId.value}`, payload)
      : await api.post('/kitchen-tools', payload)

    const savedId = res.data.data.id
    router.push({ name: 'tool-detail', params: { id: savedId } })
  } catch (e) {
    if (e.response?.status === 422 && e.response.data?.errors) {
      for (const [key, arr] of Object.entries(e.response.data.errors)) {
        fieldErrors[key] = arr[0]
      }
      serverError.value = 'Ellenőrizd a kiemelt mezőket.'
    } else {
      serverError.value = 'Mentés sikertelen. Próbáld újra.'
      console.error(e)
    }
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="te-root">
    <button class="te-back" @click="router.back()" type="button">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true">
        <path d="M15 18l-6-6 6-6" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      Vissza
    </button>

    <h1 class="te-title">{{ isEdit ? 'Eszköz szerkesztése' : 'Új eszköz' }}</h1>

    <div v-if="loading" class="te-loading">
      <LoadingSpinner size="h-6 w-6" />
    </div>

    <form v-else @submit.prevent="submit" class="te-form">
      <div class="te-section">
        <h2 class="te-section-title">Alapadatok</h2>

        <BaseInput v-model="form.name" label="Név" required :error="fieldErrors.name" placeholder="pl. Sous-vide készülék" />

        <label class="te-field">
          <span>Leírás</span>
          <textarea v-model="form.description" rows="4" class="te-textarea" placeholder="Mire alkalmas, mit tartalmaz…"></textarea>
        </label>

        <div class="te-field">
          <span>Kép</span>
          <div
            class="te-img-drop"
            :class="{ 'te-img-drop--over': imgDragOver }"
            @dragover.prevent="imgDragOver = true"
            @dragleave="imgDragOver = false"
            @drop.prevent="onImgDrop"
          >
            <div class="te-img-row">
              <input
                v-model="form.image_url"
                type="url"
                class="te-img-url"
                :class="{ 'te-img-url--err': fieldErrors.image_url }"
                placeholder="https://… vagy dobd ide a képet"
                @input="imgBroken = false"
              />
              <button
                type="button"
                class="te-img-upload"
                :disabled="imageUploading"
                @click="fileInputRef.click()"
              >
                <svg v-if="imageUploading" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" class="te-spin" aria-hidden="true">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" stroke-linecap="round"/>
                </svg>
                <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke-linecap="round"/>
                  <polyline points="17,8 12,3 7,8" stroke-linecap="round"/>
                  <line x1="12" y1="3" x2="12" y2="15" stroke-linecap="round"/>
                </svg>
                {{ imageUploading ? 'Feltöltés…' : 'Feltöltés' }}
              </button>
              <input
                ref="fileInputRef"
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                class="te-img-file"
                @change="onFileChange"
              />
            </div>
            <p v-if="imgDragOver" class="te-img-hint">Engedd el — feltöltjük.</p>
          </div>
          <p v-if="fieldErrors.image_url" class="te-field-err">{{ fieldErrors.image_url }}</p>
          <div v-if="form.image_url && !imgBroken" class="te-img-preview">
            <img
              :src="form.image_url"
              alt="Kép előnézet"
              loading="lazy"
              @error="imgBroken = true"
            />
          </div>
        </div>

        <BaseInput
          v-model="form.price_per_day"
          label="Bérleti díj / nap (Ft)"
          type="number"
          required
          :error="fieldErrors.price_per_day"
          placeholder="1500"
        />
      </div>

      <div class="te-section">
        <h2 class="te-section-title">Helyszín</h2>
        <p class="te-hint">A pontos címet csak te látod. A keresőből érkezőknek ebből csak város + kb. 700 m-es körzet látszik.</p>

        <AddressAutocomplete
          v-model="addressQuery"
          label="Cím keresése"
          :error="fieldErrors.address"
          placeholder="pl. 1061 Budapest, Andrássy út 35"
          @select="onAddressSelect"
        />

        <div class="te-grid-3">
          <BaseInput v-model="form.postal_code" label="Irányítószám" />
          <BaseInput v-model="form.city" label="Város" required :error="fieldErrors.city" />
          <BaseInput v-model="form.county" label="Megye" />
        </div>
        <div class="te-grid-2">
          <BaseInput v-model="form.street" label="Utca" />
          <BaseInput v-model="form.house_number" label="Házszám" />
        </div>

        <div v-if="hasCoords" class="te-map-preview">
          <ToolMap
            :lat="form.latitude"
            :lng="form.longitude"
            :radius-m="700"
            :zoom="14"
            label="Ennyit látnak mások"
          />
        </div>
        <div v-else class="te-map-missing">
          Válassz egy címet a kereső javaslataiból — akkor jelenik meg a térkép.
        </div>
      </div>

      <div class="te-section">
        <label class="te-toggle">
          <input type="checkbox" v-model="form.is_available" />
          <span>Most elérhető bérlésre</span>
        </label>
      </div>

      <p v-if="serverError" class="te-error">{{ serverError }}</p>

      <div class="te-actions">
        <BaseButton type="button" variant="outline" @click="router.back()">Mégse</BaseButton>
        <BaseButton type="submit" variant="primary" :loading="saving">
          {{ isEdit ? 'Mentés' : 'Létrehozás' }}
        </BaseButton>
      </div>
    </form>
  </div>
</template>

<style scoped>
.te-root {
  max-width: 760px;
  margin: 0 auto;
  padding-bottom: 4rem;
}

.te-back {
  display: inline-flex; align-items: center; gap: 0.3rem;
  margin-bottom: 1rem;
  padding: 0.4rem 0.75rem 0.4rem 0.55rem;
  border: 1.5px solid var(--color-stroke);
  border-radius: 999px;
  background: transparent;
  font-size: 0.82rem; font-weight: 600;
  color: var(--color-muted);
  cursor: pointer;
  transition: background 150ms var(--ease-ui-out), transform 150ms var(--ease-ui-out), color 150ms var(--ease-ui-out);
}
.te-back:hover  { background: var(--color-surface); color: var(--color-text); }
.te-back:active { transform: scale(0.96); }
.te-back svg { width: 0.95rem; height: 0.95rem; }

.te-title {
  margin: 0 0 1.5rem;
  font-size: clamp(1.4rem, 3vw, 1.9rem);
  font-weight: 800;
  letter-spacing: -0.02em;
}

.te-loading { display: flex; justify-content: center; padding: 3rem 0; }

.te-form { display: flex; flex-direction: column; gap: 1.25rem; }

.te-section {
  display: flex; flex-direction: column; gap: 0.75rem;
  padding: 1.1rem 1.2rem 1.25rem;
  border: 1.5px solid var(--color-stroke);
  border-radius: 1rem;
  background: var(--color-bg);
}

.te-section-title {
  margin: 0 0 0.25rem;
  font-size: 1rem;
  font-weight: 800;
  color: var(--color-text);
}

.te-hint {
  margin: 0 0 0.25rem;
  font-size: 0.78rem;
  color: var(--color-muted);
  line-height: 1.5;
}

.te-field { display: flex; flex-direction: column; gap: 0.375rem; font-size: 0.875rem; font-weight: 500; color: var(--color-muted); }

.te-textarea {
  width: 100%;
  padding: 0.625rem 0.875rem;
  border-radius: 0.5rem;
  border: 1px solid var(--color-stroke);
  background: var(--color-bg);
  color: var(--color-text);
  font-family: inherit;
  font-size: 0.95rem;
  line-height: 1.5;
  resize: vertical;
  outline: none;
  transition: border-color 150ms var(--ease-ui-out), box-shadow 150ms var(--ease-ui-out);
}
.te-textarea:focus {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-accent) 30%, transparent);
}

.te-grid-3 { display: grid; grid-template-columns: 1fr 1.4fr 1fr; gap: 0.75rem; }
.te-grid-2 { display: grid; grid-template-columns: 2fr 1fr; gap: 0.75rem; }
@media (max-width: 639px) {
  .te-grid-3, .te-grid-2 { grid-template-columns: 1fr; }
}

.te-map-preview {
  margin-top: 0.5rem;
  display: flex;
}
.te-map-preview :deep(.tmap) { min-height: 16rem; }

.te-map-missing {
  padding: 1.1rem;
  border: 1.5px dashed var(--color-stroke);
  border-radius: 0.875rem;
  color: var(--color-muted);
  font-size: 0.85rem;
  text-align: center;
}

.te-toggle {
  display: inline-flex; align-items: center; gap: 0.55rem;
  font-size: 0.9rem; font-weight: 600;
  color: var(--color-text);
}
.te-toggle input { accent-color: var(--color-accent); width: 1rem; height: 1rem; }

.te-error {
  margin: 0;
  padding: 0.65rem 0.85rem;
  border-radius: 0.55rem;
  background: color-mix(in srgb, var(--color-danger) 12%, transparent);
  color: var(--color-danger);
  font-size: 0.85rem;
  font-weight: 600;
}

.te-actions {
  display: flex; justify-content: flex-end; gap: 0.5rem;
}

/* ── Image drop zone ── */
.te-img-drop {
  border-radius: 0.75rem;
  border: 1.5px dashed transparent;
  padding: 4px;
  transition: border-color 160ms ease, background 160ms ease;
}
.te-img-drop--over {
  border-color: var(--color-accent);
  background: color-mix(in srgb, var(--color-accent) 6%, transparent);
}

.te-img-row {
  display: flex;
  gap: 8px;
  align-items: stretch;
}

.te-img-url {
  flex: 1;
  min-width: 0;
  padding: 0.55rem 0.8rem;
  border-radius: 0.5rem;
  border: 1.5px solid var(--color-stroke);
  background: var(--color-bg);
  color: var(--color-text);
  font-size: 0.9rem;
  outline: none;
  transition: border-color 150ms ease, box-shadow 150ms ease;
}
.te-img-url:focus {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-accent) 30%, transparent);
}
.te-img-url--err { border-color: var(--color-danger); }

.te-img-upload {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 0.55rem 0.9rem;
  border-radius: 0.5rem;
  border: 1.5px solid var(--color-stroke);
  background: var(--color-surface);
  color: var(--color-text);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
  transition: background 150ms ease, transform 150ms var(--ease-ui-out);
}
.te-img-upload svg { width: 14px; height: 14px; }
.te-img-upload:hover:not(:disabled) { background: var(--color-surface-hover, var(--color-stroke)); }
.te-img-upload:active:not(:disabled) { transform: scale(0.96); }
.te-img-upload:disabled { opacity: 0.55; cursor: not-allowed; }

.te-img-file { display: none; }

.te-img-hint {
  margin: 4px 0 0;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-accent);
  text-align: center;
}

.te-field-err {
  margin: 0;
  font-size: 0.75rem;
  color: var(--color-danger);
  font-weight: 600;
}

.te-img-preview {
  margin-top: 0.5rem;
  border-radius: 0.75rem;
  overflow: hidden;
  border: 1.5px solid var(--color-stroke);
}
.te-img-preview img {
  width: 100%;
  height: 200px;
  object-fit: cover;
  display: block;
}

@keyframes te-spin { to { transform: rotate(360deg); } }
.te-spin { width: 14px; height: 14px; animation: te-spin 0.8s linear infinite; }

@media (max-width: 540px) {
  .te-img-upload span { display: none; }
}
</style>
