<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import BaseInput from '@/components/BaseInput.vue'

const route     = useRoute()
const router    = useRouter()
const authStore = useAuthStore()

const isEdit = computed(() => !!route.params.id)

// ---- Form state ----
const form = ref({
  title:        '',
  description:  '',
  steps:        '',
  prep_time:    '',
  servings:     '',
  difficulty:   '',
  image_url:    '',
  category_ids: [],
  ingredients:  [],
})

const saving        = ref(false)
const pageLoading   = ref(false)
const notAuthorized = ref(false)
const errors        = ref({})
const serverError   = ref('')

// ---- Categories & units ----
const categories        = ref([])
const categoriesLoading = ref(false)
const units             = ref([])

// ---- Image ----
const imgBroken      = ref(false)
const imageUploading = ref(false)
const fileInputRef   = ref(null)

// ---- Ingredient search ----
const ingQuery     = ref('')
const ingResults   = ref([])
const ingSearching = ref(false)
const ingDropdown  = ref(false)
const ingWrapRef   = ref(null)
let   ingTimer     = null

const DIFFICULTIES = [
  { key: 'Könnyű',  cls: 'easy'   },
  { key: 'Közepes', cls: 'medium' },
  { key: 'Nehéz',   cls: 'hard'   },
]

// ---- Load categories ----
async function fetchCategories() {
  categoriesLoading.value = true
  try {
    const { data } = await api.get('/categories')
    categories.value = data.data
  } finally {
    categoriesLoading.value = false
  }
}

// ---- Load units ----
async function fetchUnits() {
  try {
    const { data } = await api.get('/units')
    units.value = data.data
  } catch {
    // fallback — covers the case if the endpoint isn't available yet
    units.value = ['db', 'g', 'dkg', 'kg', 'ml', 'dl', 'l', 'ek', 'tk', 'csésze', 'csipet', 'gerezd', 'szelet', 'csokor', 'marék']
  }
}

// ---- Load recipe (edit) ----
async function fetchRecipe() {
  pageLoading.value = true
  try {
    const { data } = await api.get(`/recipes/${route.params.id}`)
    const r = data.data

    // Ensure user is loaded before ownership check
    if (!authStore.user) await authStore.fetchUser()

    if (authStore.user?.id !== r.author?.id) {
      notAuthorized.value = true
      return
    }

    form.value = {
      title:        r.title        ?? '',
      description:  r.description  ?? '',
      steps:        r.steps        ?? '',
      prep_time:    r.prep_time    ?? '',
      servings:     r.servings     ?? '',
      difficulty:   r.difficulty   ?? '',
      image_url:    r.image_url    ?? '',
      category_ids: (r.categories  ?? []).map(c => c.id),
      ingredients:  (r.ingredients ?? []).map(i => ({
        id:       i.id,
        name:     i.name,
        quantity: i.quantity ?? '',
        unit:     i.unit     ?? '',
      })),
    }
  } catch {
    serverError.value = 'Nem sikerült betölteni a receptet.'
  } finally {
    pageLoading.value = false
  }
}

// ---- Image upload ----
async function onFileChange(e) {
  const file = e.target.files?.[0]
  if (!file) return
  imageUploading.value = true
  imgBroken.value      = false
  errors.value         = { ...errors.value, image_url: undefined }
  try {
    const fd = new FormData()
    fd.append('file', file)
    fd.append('folder', 'recipes')
    const { data } = await api.post('/upload', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    form.value.image_url = data.url
  } catch {
    serverError.value = 'Képfeltöltés sikertelen. Kérjük, próbáld újra.'
  } finally {
    imageUploading.value = false
    if (fileInputRef.value) fileInputRef.value.value = ''
  }
}

// ---- Ingredient search ----
function onIngInput(e) {
  ingQuery.value = e.target.value
  clearTimeout(ingTimer)
  if (!ingQuery.value.trim()) {
    ingResults.value  = []
    ingDropdown.value = false
    return
  }
  ingTimer = setTimeout(async () => {
    ingSearching.value = true
    try {
      const { data } = await api.get('/ingredients', { params: { search: ingQuery.value } })
      const used = new Set(form.value.ingredients.map(i => i.id))
      ingResults.value  = data.data.filter(i => !used.has(i.id))
      ingDropdown.value = ingResults.value.length > 0
    } finally {
      ingSearching.value = false
    }
  }, 250)
}

function selectIngredient(ing) {
  form.value.ingredients.push({ id: ing.id, name: ing.name, quantity: '', unit: '' })
  ingQuery.value    = ''
  ingResults.value  = []
  ingDropdown.value = false
}

function removeIngredient(idx) {
  form.value.ingredients.splice(idx, 1)
}

function toggleCategory(id) {
  const idx = form.value.category_ids.indexOf(id)
  if (idx === -1) form.value.category_ids.push(id)
  else            form.value.category_ids.splice(idx, 1)
}

// ---- Close dropdown on outside click ----
function onDocClick(e) {
  if (ingWrapRef.value && !ingWrapRef.value.contains(e.target)) {
    ingDropdown.value = false
  }
}

// ---- Submit ----
async function submit() {
  saving.value      = true
  errors.value      = {}
  serverError.value = ''

  const payload = {
    title:        form.value.title,
    description:  form.value.description,
    steps:        form.value.steps,
    prep_time:    Number(form.value.prep_time),
    servings:     form.value.servings ? Number(form.value.servings) : null,
    difficulty:   form.value.difficulty,
    image_url:    form.value.image_url || null,
    category_ids: form.value.category_ids,
    ingredients:  form.value.ingredients.map(i => ({
      id:       i.id,
      quantity: Number(i.quantity),
      unit:     i.unit,
    })),
  }

  try {
    let res
    if (isEdit.value) {
      res = await api.put(`/recipes/${route.params.id}`, payload)
    } else {
      res = await api.post('/recipes', payload)
    }
    router.push({ name: 'recipe-detail', params: { id: res.data.data.id } })
  } catch (err) {
    if (err.response?.status === 422) {
      errors.value = err.response.data.errors ?? {}
    } else {
      serverError.value = 'Valami hiba történt. Kérjük, próbáld újra.'
    }
    saving.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', onDocClick)
  Promise.all([fetchCategories(), fetchUnits()])
  if (isEdit.value) fetchRecipe()
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onDocClick)
  clearTimeout(ingTimer)
})
</script>

<template>
  <div class="re-root">

    <!-- ── Header ── -->
    <header class="re-header">
      <div class="re-header-left">
        <RouterLink
          :to="isEdit ? { name: 'recipe-detail', params: { id: route.params.id } } : { name: 'recipes' }"
          class="re-back"
          aria-label="Vissza"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
            <polyline points="15,18 9,12 15,6"/>
          </svg>
        </RouterLink>
        <h1 class="re-title">{{ isEdit ? 'Recept szerkesztése' : 'Új recept' }}</h1>
      </div>

      <button
        v-if="!notAuthorized"
        class="re-save-btn"
        @click="submit"
        :disabled="saving || pageLoading"
        :aria-busy="saving"
      >
        <svg v-if="saving" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" class="re-spin" aria-hidden="true">
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" stroke-linecap="round"/>
        </svg>
        {{ saving ? 'Mentés…' : 'Mentés' }}
      </button>
    </header>

    <!-- ── Not authorized ── -->
    <div v-if="notAuthorized" class="re-unauth">
      <div class="re-unauth-ico">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke-linecap="round"/>
        </svg>
      </div>
      <h2 class="re-unauth-title">Hozzáférés megtagadva</h2>
      <p class="re-unauth-desc">Ez a recept nem a tiéd, nem szerkesztheted.</p>
      <RouterLink :to="{ name: 'recipes' }" class="re-unauth-link">← Receptek böngészése</RouterLink>
    </div>

    <!-- ── Page loading skeleton ── -->
    <div v-else-if="pageLoading" class="re-skel" aria-label="Betöltés">
      <div v-for="i in 4" :key="i" class="re-skel-card" :style="`--sd: ${i * 70}ms`">
        <div class="skel skel-hd" />
        <div class="skel skel-ln" />
        <div class="skel skel-ln skel-short" />
      </div>
    </div>

    <template v-else>

      <!-- ── Server error ── -->
      <div v-if="serverError" class="re-err-banner" role="alert">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="re-err-ico" aria-hidden="true">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12" stroke-linecap="round"/>
          <line x1="12" y1="16" x2="12.01" y2="16" stroke-linecap="round"/>
        </svg>
        {{ serverError }}
      </div>

      <!-- ── Form ── -->
      <form @submit.prevent="submit" class="re-form" novalidate>

        <!-- ─── Alapadatok ─── -->
        <section class="re-card">
          <h2 class="re-card-title">Alapadatok</h2>

          <div class="re-fields">
            <BaseInput
              label="Recept neve"
              v-model="form.title"
              required
              placeholder="pl. Rántott csirke"
              :error="errors.title?.[0]"
            />

            <div class="field">
              <label class="field-label">
                Leírás <span class="field-req">*</span>
              </label>
              <textarea
                v-model="form.description"
                class="field-ta"
                :class="{ 'field-ta--err': errors.description }"
                rows="3"
                placeholder="Rövid összefoglaló a receptről…"
              />
              <p v-if="errors.description" class="field-err">{{ errors.description[0] }}</p>
            </div>

            <!-- Image URL + upload -->
            <div class="field">
              <label class="field-label">Kép</label>
              <div class="img-row">
                <input
                  v-model="form.image_url"
                  type="url"
                  class="img-url-input"
                  :class="{ 'img-url-input--err': errors.image_url }"
                  placeholder="https://…"
                  @input="imgBroken = false"
                />
                <button
                  type="button"
                  class="img-upload-btn"
                  :disabled="imageUploading"
                  @click="fileInputRef.click()"
                  :aria-busy="imageUploading"
                >
                  <svg v-if="imageUploading" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" class="re-spin" aria-hidden="true">
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
                  class="img-file-hidden"
                  @change="onFileChange"
                />
              </div>
              <p v-if="errors.image_url" class="field-err">{{ errors.image_url[0] }}</p>
            </div>

            <div v-if="form.image_url && !imgBroken" class="re-preview">
              <img
                :src="form.image_url"
                alt="Kép előnézet"
                class="re-preview-img"
                loading="lazy"
                @error="imgBroken = true"
              />
            </div>
          </div>
        </section>

        <!-- ─── Részletek ─── -->
        <section class="re-card">
          <h2 class="re-card-title">Részletek</h2>

          <div class="re-fields">
            <div class="re-row2">
              <BaseInput
                label="Elkészítési idő (perc)"
                v-model="form.prep_time"
                type="number"
                required
                placeholder="30"
                :error="errors.prep_time?.[0]"
              />
              <BaseInput
                label="Adagok (fő)"
                v-model="form.servings"
                type="number"
                placeholder="4"
                :error="errors.servings?.[0]"
              />
            </div>

            <div class="field">
              <label class="field-label">Nehézség <span class="field-req">*</span></label>
              <div class="chip-row">
                <button
                  v-for="d in DIFFICULTIES"
                  :key="d.key"
                  type="button"
                  class="chip"
                  :class="[`diff-${d.cls}`, { on: form.difficulty === d.key }]"
                  @click="form.difficulty = form.difficulty === d.key ? '' : d.key"
                >{{ d.key }}</button>
              </div>
              <p v-if="errors.difficulty" class="field-err">{{ errors.difficulty[0] }}</p>
            </div>

            <div class="field">
              <label class="field-label">Kategóriák</label>
              <div class="chip-row chip-row--wrap">
                <span v-if="categoriesLoading" class="chip-loading">Betöltés…</span>
                <button
                  v-for="cat in categories"
                  :key="cat.id"
                  type="button"
                  class="chip cat-chip"
                  :class="{ on: form.category_ids.includes(cat.id) }"
                  @click="toggleCategory(cat.id)"
                >{{ cat.name }}</button>
              </div>
            </div>
          </div>
        </section>

        <!-- ─── Elkészítés ─── -->
        <section class="re-card">
          <h2 class="re-card-title">Elkészítés</h2>

          <div class="re-fields">
            <div class="field">
              <label class="field-label">
                Lépések <span class="field-req">*</span>
                <span class="field-hint">— minden sor egy lépés</span>
              </label>
              <textarea
                v-model="form.steps"
                class="field-ta field-ta--steps"
                :class="{ 'field-ta--err': errors.steps }"
                rows="10"
                placeholder="Előmelegítsd a sütőt 200 fokra.&#10;Keverd össze a száraz hozzávalókat.&#10;Öntsd bele a tojásokat és keverd simára."
              />
              <p v-if="errors.steps" class="field-err">{{ errors.steps[0] }}</p>
            </div>
          </div>
        </section>

        <!-- ─── Hozzávalók ─── -->
        <section class="re-card re-card--last">
          <h2 class="re-card-title">Hozzávalók</h2>

          <div class="re-fields">

            <!-- Added ingredient list -->
            <div v-if="form.ingredients.length" class="ing-list">
              <div class="ing-list-hdr">
                <span>Hozzávaló</span>
                <span>Mennyiség</span>
                <span>Egység</span>
                <span />
              </div>
              <div
                v-for="(ing, idx) in form.ingredients"
                :key="ing.id"
                class="ing-row"
              >
                <span class="ing-name">{{ ing.name }}</span>
                <input
                  v-model="ing.quantity"
                  type="number"
                  min="0.01"
                  step="0.01"
                  class="ing-input ing-qty"
                  :class="{ 'ing-input--err': errors[`ingredients.${idx}.quantity`] }"
                  placeholder="0"
                />
                <div class="ing-unit-wrap">
                  <select
                    v-model="ing.unit"
                    class="ing-input ing-unit"
                    :class="{ 'ing-input--err': errors[`ingredients.${idx}.unit`] }"
                  >
                    <option value="" disabled>Válassz…</option>
                    <option v-for="u in units" :key="u" :value="u">{{ u }}</option>
                  </select>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="ing-unit-chev" aria-hidden="true">
                    <polyline points="6,9 12,15 18,9"/>
                  </svg>
                </div>
                <button type="button" class="ing-rm" @click="removeIngredient(idx)" aria-label="Eltávolítás">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
                    <path d="M18 6L6 18M6 6l12 12" stroke-linecap="round"/>
                  </svg>
                </button>
              </div>
            </div>

            <!-- Ingredient search -->
            <div class="ing-search" ref="ingWrapRef">
              <div class="ing-search-box">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" class="ing-search-ico" aria-hidden="true">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="m21 21-4.35-4.35" stroke-linecap="round"/>
                </svg>
                <input
                  :value="ingQuery"
                  @input="onIngInput"
                  type="text"
                  class="ing-search-input"
                  placeholder="Hozzávaló keresése…"
                  autocomplete="off"
                />
                <svg v-if="ingSearching" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" class="ing-spinner" aria-hidden="true">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" stroke-linecap="round"/>
                </svg>
              </div>

              <div v-if="ingDropdown" class="ing-dropdown" role="listbox">
                <button
                  v-for="ing in ingResults"
                  :key="ing.id"
                  type="button"
                  class="ing-option"
                  role="option"
                  @mousedown.prevent="selectIngredient(ing)"
                >{{ ing.name }}</button>
              </div>
            </div>

          </div>
        </section>

      </form>
    </template>

  </div>
</template>

<style scoped>
.re-root {
  padding-bottom: 80px;
  animation: reIn 280ms var(--ease-ui-out) both;
}

@keyframes reIn {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: none; }
}

/* ── Header ── */
.re-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 22px;
  margin-bottom: 28px;
  border-bottom: 1.5px solid var(--color-stroke);
  gap: 12px;
}

.re-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.re-back {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px; height: 36px;
  flex-shrink: 0;
  border-radius: 10px;
  border: 1.5px solid var(--color-stroke);
  background: var(--color-bg);
  color: var(--color-text);
  text-decoration: none;
  transition: background 150ms var(--ease-ui-out), transform 150ms var(--ease-ui-out);
}
.re-back:hover  { background: var(--color-surface); }
.re-back:active { transform: scale(0.93); }
.re-back svg    { width: 16px; height: 16px; }

.re-title {
  margin: 0;
  font-size: clamp(1.1rem, 3vw, 1.5rem);
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.re-save-btn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 9px 22px;
  border-radius: 12px;
  border: none;
  background: var(--color-accent);
  color: #fff;
  font-size: 0.875rem;
  font-weight: 700;
  cursor: pointer;
  flex-shrink: 0;
  transition:
    background 150ms var(--ease-ui-out),
    transform  150ms var(--ease-ui-out),
    opacity    150ms;
}
.re-save-btn:hover:not(:disabled)  { background: var(--color-accent-hover); }
.re-save-btn:active:not(:disabled) { transform: scale(0.96); }
.re-save-btn:disabled              { opacity: 0.6; cursor: not-allowed; }

@keyframes spin { to { transform: rotate(360deg); } }
.re-spin { width: 15px; height: 15px; animation: spin 0.8s linear infinite; }

/* ── Not authorized ── */
.re-unauth {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  min-height: 320px;
  text-align: center;
  animation: reIn 280ms var(--ease-ui-out) both;
}

.re-unauth-ico {
  width: 64px; height: 64px;
  border-radius: 50%;
  background: var(--color-surface);
  display: flex; align-items: center; justify-content: center;
  color: var(--color-muted);
}
.re-unauth-ico svg { width: 28px; height: 28px; }

.re-unauth-title {
  font-size: 1.1rem;
  font-weight: 800;
  color: var(--color-text);
  margin: 0;
}

.re-unauth-desc {
  font-size: 0.9rem;
  color: var(--color-muted);
  margin: 0;
}

.re-unauth-link {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-accent);
  text-decoration: none;
  transition: color 150ms;
}
.re-unauth-link:hover { color: var(--color-accent-hover); }

/* ── Page loading skeleton ── */
.re-skel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.re-skel-card {
  border: 1.5px solid var(--color-stroke);
  border-radius: 18px;
  padding: 22px 24px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  animation: skelIn 240ms var(--ease-ui-out) var(--sd, 0ms) both;
}

@keyframes skelIn { from { opacity: 0; } to { opacity: 1; } }

.skel {
  border-radius: 8px;
  background: linear-gradient(
    90deg,
    var(--color-surface)       0%,
    var(--color-surface-hover) 40%,
    var(--color-surface)       80%
  );
  background-size: 400% 100%;
  animation: shimmer 1.6s ease-in-out infinite;
}

@keyframes shimmer {
  0%   { background-position: 100% 0; }
  100% { background-position: -100% 0; }
}

.skel-hd    { height: 16px; width: 140px; }
.skel-ln    { height: 13px; width: 100%; }
.skel-short { width: 60%; }

/* ── Error banner ── */
.re-err-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 13px 16px;
  border-radius: 12px;
  border: 1.5px solid color-mix(in srgb, var(--color-danger) 30%, transparent);
  background: color-mix(in srgb, var(--color-danger) 8%, transparent);
  color: var(--color-danger);
  font-size: 0.875rem;
  font-weight: 600;
  margin-bottom: 24px;
}
.re-err-ico { width: 18px; height: 18px; flex-shrink: 0; }

/* ── Form layout ── */
.re-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* ── Section cards ── */
.re-card {
  border: 1.5px solid var(--color-stroke);
  border-radius: 18px;
  padding: 22px 24px;
  background: var(--color-bg);
}

.re-card-title {
  font-size: 0.72rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-muted);
  margin: 0 0 20px;
}

.re-fields {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.re-row2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
  align-items: start;
}

@media (max-width: 540px) {
  .re-row2 { grid-template-columns: 1fr; }
}

/* ── Generic field ── */
.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-muted);
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
}

.field-req  { color: var(--color-danger); }

.field-hint {
  font-size: 0.75rem;
  font-weight: 400;
  opacity: 0.75;
}

.field-ta {
  width: 100%;
  padding: 10px 14px;
  border-radius: 10px;
  border: 1.5px solid var(--color-stroke);
  background: var(--color-bg);
  color: var(--color-text);
  font-size: 0.875rem;
  font-family: inherit;
  line-height: 1.6;
  resize: vertical;
  outline: none;
  box-sizing: border-box;
  transition: border-color 150ms var(--ease-ui-out), box-shadow 150ms var(--ease-ui-out);
}
.field-ta:focus {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 1px var(--color-accent);
}
.field-ta--err { border-color: var(--color-danger); }
.field-ta--err:focus {
  border-color: var(--color-danger);
  box-shadow: 0 0 0 1px var(--color-danger);
}
.field-ta--steps { min-height: 200px; line-height: 1.8; }

.field-err {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-danger);
  margin: 0;
}

/* ── Image upload row ── */
.img-row {
  display: flex;
  gap: 8px;
  align-items: stretch;
  position: relative;
}

.img-url-input {
  flex: 1;
  padding: 9px 14px;
  border-radius: 10px;
  border: 1.5px solid var(--color-stroke);
  background: var(--color-bg);
  color: var(--color-text);
  font-size: 0.875rem;
  font-family: inherit;
  outline: none;
  min-width: 0;
  transition: border-color 150ms var(--ease-ui-out), box-shadow 150ms var(--ease-ui-out);
}
.img-url-input:focus {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 1px var(--color-accent);
}
.img-url-input--err { border-color: var(--color-danger); }

.img-upload-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 16px;
  border-radius: 10px;
  border: 1.5px solid var(--color-stroke);
  background: var(--color-surface);
  color: var(--color-text);
  font-size: 0.825rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
  transition: background 150ms var(--ease-ui-out), transform 150ms var(--ease-ui-out);
}
.img-upload-btn svg     { width: 14px; height: 14px; }
.img-upload-btn:hover:not(:disabled)  { background: var(--color-surface-hover, var(--color-stroke)); }
.img-upload-btn:active:not(:disabled) { transform: scale(0.96); }
.img-upload-btn:disabled              { opacity: 0.55; cursor: not-allowed; }

.img-file-hidden { display: none; }

/* ── Image preview ── */
.re-preview {
  border-radius: 12px;
  overflow: hidden;
  border: 1.5px solid var(--color-stroke);
}

.re-preview-img {
  width: 100%;
  height: 200px;
  object-fit: cover;
  display: block;
}

/* ── Chips ── */
.chip-row {
  display: flex;
  flex-wrap: nowrap;
  gap: 6px;
}
.chip-row--wrap { flex-wrap: wrap; }

.chip {
  display: inline-flex;
  align-items: center;
  padding: 5px 13px;
  border-radius: 20px;
  font-size: 0.79rem;
  font-weight: 600;
  border: 1.5px solid var(--color-stroke);
  background: transparent;
  color: var(--color-muted);
  cursor: pointer;
  white-space: nowrap;
  transition:
    border-color 150ms var(--ease-ui-out),
    background   150ms var(--ease-ui-out),
    color        150ms var(--ease-ui-out),
    transform    150ms var(--ease-ui-out);
}
.chip:hover  { background: var(--color-surface); color: var(--color-text); }
.chip:active { transform: scale(0.93); }

.diff-easy.on   { border-color: #5b7f43; background: color-mix(in srgb, #5b7f43 11%, transparent); color: #3b5c28; }
.diff-medium.on { border-color: #d97706; background: color-mix(in srgb, #d97706 11%, transparent); color: #7c4f08; }
.diff-hard.on   { border-color: #d94b4b; background: color-mix(in srgb, #d94b4b 11%, transparent); color: #8b1f1f; }

.cat-chip.on {
  border-color: var(--color-accent);
  background: color-mix(in srgb, var(--color-accent) 11%, transparent);
  color: var(--color-accent);
}

.chip-loading {
  font-size: 0.79rem;
  color: var(--color-muted);
  font-style: italic;
  padding: 5px 0;
}

/* ── Ingredient list ── */
.ing-list {
  border: 1.5px solid var(--color-stroke);
  border-radius: 12px;
  overflow: hidden;
}

.ing-list-hdr {
  display: grid;
  grid-template-columns: 1fr 100px 116px 36px;
  gap: 8px;
  padding: 7px 12px;
  background: var(--color-surface);
  font-size: 0.69rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-muted);
}

.ing-row {
  display: grid;
  grid-template-columns: 1fr 100px 116px 36px;
  gap: 8px;
  align-items: center;
  padding: 9px 12px;
  border-top: 1.5px solid var(--color-stroke);
  transition: background 150ms var(--ease-ui-out);
}
.ing-row:hover { background: var(--color-surface); }

.ing-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ing-input {
  width: 100%;
  padding: 6px 10px;
  border-radius: 8px;
  border: 1.5px solid var(--color-stroke);
  background: var(--color-bg);
  color: var(--color-text);
  font-size: 0.8rem;
  font-family: inherit;
  outline: none;
  box-sizing: border-box;
  transition: border-color 150ms var(--ease-ui-out), box-shadow 150ms var(--ease-ui-out);
}
.ing-input:focus  { border-color: var(--color-accent); box-shadow: 0 0 0 1px var(--color-accent); }
.ing-input--err   { border-color: var(--color-danger); }
.ing-qty          { text-align: right; }

/* Unit select wrapper */
.ing-unit-wrap {
  position: relative;
  width: 100%;
}

.ing-unit {
  -webkit-appearance: none;
  appearance: none;
  padding-right: 26px;
  cursor: pointer;
}

.ing-unit-chev {
  position: absolute;
  right: 7px;
  top: 50%;
  transform: translateY(-50%);
  width: 11px; height: 11px;
  color: var(--color-muted);
  pointer-events: none;
}

.ing-rm {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px; height: 30px;
  border-radius: 8px;
  border: 1.5px solid var(--color-stroke);
  background: transparent;
  color: var(--color-muted);
  cursor: pointer;
  flex-shrink: 0;
  transition:
    background    150ms var(--ease-ui-out),
    color         150ms var(--ease-ui-out),
    border-color  150ms var(--ease-ui-out),
    transform     150ms var(--ease-ui-out);
}
.ing-rm svg    { width: 13px; height: 13px; }
.ing-rm:hover  { background: color-mix(in srgb, var(--color-danger) 10%, transparent); color: var(--color-danger); border-color: color-mix(in srgb, var(--color-danger) 40%, transparent); }
.ing-rm:active { transform: scale(0.9); }

/* ── Ingredient search ── */
.ing-search { position: relative; }

.ing-search-box {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 14px;
  border-radius: 12px;
  border: 1.5px solid var(--color-stroke);
  background: var(--color-bg);
  transition: border-color 150ms var(--ease-ui-out), box-shadow 150ms var(--ease-ui-out);
}
.ing-search-box:focus-within {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 1px var(--color-accent);
}

.ing-search-ico { width: 15px; height: 15px; color: var(--color-muted); flex-shrink: 0; }

.ing-search-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  color: var(--color-text);
  font-size: 0.875rem;
  font-family: inherit;
}
.ing-search-input::placeholder { color: var(--color-muted); }

@keyframes spinIco { to { transform: rotate(360deg); } }
.ing-spinner {
  width: 15px; height: 15px;
  color: var(--color-accent);
  flex-shrink: 0;
  animation: spinIco 0.8s linear infinite;
}

.ing-dropdown {
  position: absolute;
  top: calc(100% + 6px);
  left: 0; right: 0;
  z-index: 50;
  border: 1.5px solid var(--color-stroke);
  border-radius: 12px;
  background: var(--color-bg);
  box-shadow: 0 8px 28px -6px rgba(47, 30, 23, 0.16);
  overflow: hidden;
  animation: dropIn 160ms var(--ease-ui-out) both;
}

@keyframes dropIn {
  from { opacity: 0; transform: translateY(-6px) scale(0.98); }
  to   { opacity: 1; transform: none; }
}

.ing-option {
  display: block;
  width: 100%;
  padding: 10px 14px;
  text-align: left;
  border: none;
  border-bottom: 1px solid var(--color-stroke);
  background: transparent;
  color: var(--color-text);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 120ms var(--ease-ui-out);
}
.ing-option:last-child { border-bottom: none; }
.ing-option:hover      { background: var(--color-surface); }

/* ── Mobile ── */
@media (max-width: 540px) {
  .re-card { padding: 16px; }

  .ing-list-hdr,
  .ing-row {
    grid-template-columns: 1fr 80px 96px 32px;
    gap: 6px;
    padding: 8px 10px;
  }

  .img-upload-btn span { display: none; }
}

@media (max-width: 420px) {
  .ing-list-hdr { display: none; }
  .ing-row {
    grid-template-columns: 1fr 32px;
    grid-template-rows: auto auto auto;
    row-gap: 6px;
  }
  .ing-name         { grid-column: 1; grid-row: 1; }
  .ing-rm           { grid-column: 2; grid-row: 1; }
  .ing-qty          { grid-column: 1 / -1; grid-row: 2; }
  .ing-unit-wrap    { grid-column: 1 / -1; grid-row: 3; }
}
</style>
