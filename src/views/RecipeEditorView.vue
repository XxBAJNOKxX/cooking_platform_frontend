<!-- Recept létrehozása / szerkesztése, piszkozat-automata mentéssel. -->

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRoute, useRouter, onBeforeRouteLeave, RouterLink } from 'vue-router'
import api from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import { useApiCall } from '@/composables/useApiCall'
import { useRecipeEditor, formIsEmpty } from '@/composables/useRecipeEditor'
import { useRecipeDraft } from '@/composables/useRecipeDraft'
import { useImageUpload, extractImageUrlFromDrop } from '@/composables/useImageUpload'
import BaseInput from '@/components/BaseInput.vue'
import RecipeIngredientEditor from '@/components/recipe/RecipeIngredientEditor.vue'
import RecipeCategoryEditor from '@/components/recipe/RecipeCategoryEditor.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const recipeId = computed(() => route.params.id)

const DIFFICULTIES = [
  { key: 'Könnyű', cls: 'easy' },
  { key: 'Közepes', cls: 'medium' },
  { key: 'Nehéz', cls: 'hard' },
]

const { form, errors, serverError, notAuthorized, saving, pageLoading, isEdit, fetchRecipe, save } =
  useRecipeEditor(recipeId, authStore)

const draftKey = computed(() =>
  isEdit.value ? `recipe_draft_${route.params.id}` : 'recipe_draft_new',
)
const draft = useRecipeDraft(form, draftKey, formIsEmpty)

const categories = ref([])
const units = ref([])
const categoriesCall = useApiCall({ logTag: 'RecipeEditor:categories' })
const unitsCall = useApiCall({ logTag: 'RecipeEditor:units' })
const categoriesLoading = categoriesCall.loading

async function fetchCategories() {
  await categoriesCall.execute(async () => {
    const { data } = await api.get('/categories')
    categories.value = data.data
  })
}

async function fetchUnits() {
  const result = await unitsCall.execute(async () => {
    const { data } = await api.get('/units')
    units.value = data.data
    return data.data
  })
  if (result === null) {
    units.value = [
      'db',
      'g',
      'dkg',
      'kg',
      'ml',
      'dl',
      'l',
      'ek',
      'tk',
      'csésze',
      'csipet',
      'gerezd',
      'szelet',
      'csokor',
      'marék',
    ]
  }
}

const imgBroken = ref(false)
const imgDragOver = ref(false)
const fileInputRef = ref(null)
const { uploading: imageUploading, upload } = useImageUpload('recipes')

async function uploadFile(file) {
  if (!file) return
  imgBroken.value = false
  errors.value = { ...errors.value, image_url: undefined }
  const url = await upload(file)
  if (url) form.value.image_url = url
  if (fileInputRef.value) fileInputRef.value.value = ''
}

async function onFileChange(e) {
  await uploadFile(e.target.files?.[0])
}

function onImgDrop(e) {
  imgDragOver.value = false
  const { file, url } = extractImageUrlFromDrop(e)
  if (file) {
    uploadFile(file)
    return
  }
  if (url) {
    form.value.image_url = url
    imgBroken.value = false
  }
}

async function scrollToFirstError() {
  await nextTick()
  const firstErr = document.querySelector(
    '[aria-invalid="true"], .field-ta--err, .ing-input--err, .field-err',
  )
  firstErr?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  firstErr?.focus({ preventScroll: true })
}

async function submit() {
  const result = await save()
  if (result.ok) {
    draft.clear()
    router.push({ name: 'recipe-detail', params: { id: result.recipe.id } })
  } else if (result.reason === 'validation') {
    scrollToFirstError()
  }
}

function beforeUnloadHandler(e) {
  if (draft.hasUnsavedChanges() && !saving.value) {
    e.preventDefault()
    e.returnValue = ''
  }
}

onBeforeRouteLeave(() => {
  if (saving.value) return true
  if (!draft.hasUnsavedChanges()) return true
  return window.confirm(
    'Vannak nem mentett változtatásaid. Biztosan el szeretnéd hagyni az oldalt? A piszkozat megmarad és később visszaállítható.',
  )
})

onMounted(async () => {
  Promise.all([fetchCategories(), fetchUnits()])
  window.addEventListener('beforeunload', beforeUnloadHandler)

  if (isEdit.value) {
    await fetchRecipe()
    if (notAuthorized.value) return
  }

  draft.offerRestoreIfExists()
  draft.activate()
})

onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', beforeUnloadHandler)
})

const draftAvailable = draft.draftAvailable
const restoreDraft = draft.restore
const discardDraft = draft.discard
</script>

<template>
  <div class="re-root">
    <!-- ── Header ── -->
    <header class="re-header">
      <div class="re-header-left">
        <RouterLink
          :to="
            isEdit
              ? { name: 'recipe-detail', params: { id: route.params.id } }
              : { name: 'recipes' }
          "
          class="re-back"
          aria-label="Vissza"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            aria-hidden="true"
          >
            <polyline points="15,18 9,12 15,6" />
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
        <svg
          v-if="saving"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.2"
          class="re-spin"
          aria-hidden="true"
        >
          <path
            d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"
            stroke-linecap="round"
          />
        </svg>
        {{ saving ? 'Mentés…' : 'Mentés' }}
      </button>
    </header>

    <!-- ── Draft restore banner ── -->
    <div v-if="draftAvailable" class="re-draft" role="status">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        aria-hidden="true"
        class="re-draft-ico"
      >
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
      <span class="re-draft-msg">Nem mentett piszkozat található erről a receptről.</span>
      <button type="button" class="re-draft-restore" @click="restoreDraft">Visszaállítás</button>
      <button type="button" class="re-draft-discard" @click="discardDraft">Elvetés</button>
    </div>

    <!-- ── Not authorized ── -->
    <div v-if="notAuthorized" class="re-unauth">
      <div class="re-unauth-ico">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          aria-hidden="true"
        >
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke-linecap="round" />
        </svg>
      </div>
      <h2 class="re-unauth-title">Hozzáférés megtagadva</h2>
      <p class="re-unauth-desc">Ez a recept nem a tiéd, nem szerkesztheted.</p>
      <RouterLink :to="{ name: 'recipes' }" class="re-unauth-link"
        >← Receptek böngészése</RouterLink
      >
    </div>

    <!-- ── Page loading skeleton ── -->
    <div v-else-if="pageLoading" class="re-skel" aria-label="Betöltés">
      <div v-for="i in 4" :key="i" class="re-skel-card" :style="{ '--sd': `${i * 70}ms` }">
        <div class="skel skel-hd" />
        <div class="skel skel-ln" />
        <div class="skel skel-ln skel-short" />
      </div>
    </div>

    <template v-else>
      <!-- ── Server error ── -->
      <div v-if="serverError" class="re-err-banner" role="alert">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          class="re-err-ico"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" stroke-linecap="round" />
          <line x1="12" y1="16" x2="12.01" y2="16" stroke-linecap="round" />
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
              <label class="field-label"> Leírás <span class="field-req">*</span> </label>
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
              <div
                class="img-drop-zone"
                :class="{ 'img-drop-zone--over': imgDragOver }"
                @dragover.prevent="imgDragOver = true"
                @dragleave="imgDragOver = false"
                @drop.prevent="onImgDrop"
              >
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
                    <svg
                      v-if="imageUploading"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2.2"
                      class="re-spin"
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
                <p v-if="imgDragOver" class="img-drop-hint">Húzd ide a képfájlt vagy URL-t</p>
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
                >
                  {{ d.key }}
                </button>
              </div>
              <p v-if="errors.difficulty" class="field-err">{{ errors.difficulty[0] }}</p>
            </div>

            <div class="field">
              <label class="field-label">Kategóriák</label>
              <RecipeCategoryEditor
                v-model="form.category_ids"
                :categories="categories"
                :loading="categoriesLoading"
                @update:categories="categories = $event"
              />
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
            <RecipeIngredientEditor
              v-model="form.ingredients"
              :units="units"
              :errors="errors"
              @unit-created="
                (name) => {
                  if (!units.includes(name)) units.push(name)
                }
              "
            />
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

/* ── Draft banner ── */
.re-draft {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.6rem 0.875rem;
  margin: 0 0 1rem;
  border-radius: 0.75rem;
  border: 1.5px solid color-mix(in srgb, var(--color-accent) 40%, transparent);
  background: color-mix(in srgb, var(--color-accent) 10%, var(--color-bg));
  font-size: 0.85rem;
  color: var(--color-text);
  animation: reIn 240ms var(--ease-ui-out) both;
}
.re-draft-ico {
  width: 1.05rem;
  height: 1.05rem;
  color: var(--color-accent);
  flex-shrink: 0;
}
.re-draft-msg {
  flex: 1;
  font-weight: 600;
}
.re-draft-restore,
.re-draft-discard {
  padding: 0.35rem 0.75rem;
  border-radius: 0.5rem;
  border: 1.5px solid var(--color-stroke);
  background: var(--color-bg);
  color: var(--color-text);
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  transition:
    background 150ms ease,
    border-color 150ms ease,
    transform 150ms var(--ease-ui-out);
}
.re-draft-restore {
  border-color: var(--color-accent);
  background: var(--color-accent);
  color: var(--color-bg);
}
.re-draft-restore:hover {
  background: var(--color-accent-hover);
}
.re-draft-discard:hover {
  background: var(--color-surface);
}
.re-draft-restore:active,
.re-draft-discard:active {
  transform: scale(0.96);
}

@keyframes reIn {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

/* ── Header ── */
.re-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 0 14px;
  margin-bottom: 28px;
  border-bottom: 1.5px solid var(--color-stroke);
  gap: 12px;

  /* Keep the save button reachable at every scroll position. The top offset
     matches the sticky Navbar height (4rem). */
  position: sticky;
  top: 4rem;
  z-index: 20;
  background: var(--color-bg);
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
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  border-radius: 10px;
  border: 1.5px solid var(--color-stroke);
  background: var(--color-bg);
  color: var(--color-text);
  text-decoration: none;
  transition:
    background 150ms var(--ease-ui-out),
    transform 150ms var(--ease-ui-out);
}
.re-back:hover {
  background: var(--color-surface);
}
.re-back:active {
  transform: scale(0.93);
}
.re-back svg {
  width: 16px;
  height: 16px;
}

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
    transform 150ms var(--ease-ui-out),
    opacity 150ms;
}
.re-save-btn:hover:not(:disabled) {
  background: var(--color-accent-hover);
}
.re-save-btn:active:not(:disabled) {
  transform: scale(0.96);
}
.re-save-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.re-spin {
  width: 15px;
  height: 15px;
  animation: spin 0.8s linear infinite;
}

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
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: var(--color-surface);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-muted);
}
.re-unauth-ico svg {
  width: 28px;
  height: 28px;
}

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
.re-unauth-link:hover {
  color: var(--color-accent-hover);
}

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

.skel {
  border-radius: 8px;
  background: linear-gradient(
    90deg,
    var(--color-surface) 0%,
    var(--color-surface-hover) 40%,
    var(--color-surface) 80%
  );
  background-size: 400% 100%;
  animation: shimmer 1.6s ease-in-out infinite;
}

.skel-hd {
  height: 16px;
  width: 140px;
}
.skel-ln {
  height: 13px;
  width: 100%;
}
.skel-short {
  width: 60%;
}

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
.re-err-ico {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

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
  .re-row2 {
    grid-template-columns: 1fr;
  }
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

.field-req {
  color: var(--color-danger);
}

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
  transition:
    border-color 150ms var(--ease-ui-out),
    box-shadow 150ms var(--ease-ui-out);
}
.field-ta:focus {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 1px var(--color-accent);
}
.field-ta--err {
  border-color: var(--color-danger);
}
.field-ta--err:focus {
  border-color: var(--color-danger);
  box-shadow: 0 0 0 1px var(--color-danger);
}
.field-ta--steps {
  min-height: 200px;
  line-height: 1.8;
}

.field-err {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-danger);
  margin: 0;
}

/* ── Drag & drop zone ── */
.img-drop-zone {
  border-radius: 0.75rem;
  border: 1.5px dashed transparent;
  padding: 4px;
  transition:
    border-color 160ms ease,
    background 160ms ease;
}
.img-drop-zone--over {
  border-color: var(--color-accent);
  background: color-mix(in srgb, var(--color-accent) 6%, transparent);
}
.img-drop-hint {
  font-size: 0.75rem;
  color: var(--color-accent);
  font-weight: 600;
  text-align: center;
  margin-top: 4px;
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
  transition:
    border-color 150ms var(--ease-ui-out),
    box-shadow 150ms var(--ease-ui-out);
}
.img-url-input:focus {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 1px var(--color-accent);
}
.img-url-input--err {
  border-color: var(--color-danger);
}

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
  transition:
    background 150ms var(--ease-ui-out),
    transform 150ms var(--ease-ui-out);
}
.img-upload-btn svg {
  width: 14px;
  height: 14px;
}
.img-upload-btn:hover:not(:disabled) {
  background: var(--color-surface-hover, var(--color-stroke));
}
.img-upload-btn:active:not(:disabled) {
  transform: scale(0.96);
}
.img-upload-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.img-file-hidden {
  display: none;
}

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
.chip-row--wrap {
  flex-wrap: wrap;
}

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
    background 150ms var(--ease-ui-out),
    color 150ms var(--ease-ui-out),
    transform 150ms var(--ease-ui-out);
}
.chip:hover {
  background: var(--color-surface);
  color: var(--color-text);
}
.chip:active {
  transform: scale(0.93);
}

.diff-easy.on {
  border-color: #5b7f43;
  background: color-mix(in srgb, #5b7f43 11%, transparent);
  color: #3b5c28;
}
.diff-medium.on {
  border-color: #d97706;
  background: color-mix(in srgb, #d97706 11%, transparent);
  color: #7c4f08;
}
.diff-hard.on {
  border-color: #d94b4b;
  background: color-mix(in srgb, #d94b4b 11%, transparent);
  color: #8b1f1f;
}

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

/* ── Mobile ── */
@media (max-width: 540px) {
  .re-card {
    padding: 16px;
  }
  .img-upload-btn span {
    display: none;
  }
}
</style>
