<!-- Receptkönyv szerkesztő/létrehozó — metaadat form + drag-droppal rendezhető tétellista. -->

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import draggable from 'vuedraggable'

import BaseButton from '@/components/BaseButton.vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import RecipeBookItemEditor from '@/components/recipebook/RecipeBookItemEditor.vue'
import AddRecipeToBookModal from '@/components/recipebook/AddRecipeToBookModal.vue'
import { useRecipeBooks } from '@/composables/useRecipeBooks'
import { useRecipeBookEditor } from '@/composables/useRecipeBookEditor'
import { useImageUpload } from '@/composables/useImageUpload'

const route = useRoute()
const router = useRouter()

const isEdit = computed(() => Boolean(route.params.id))
const bookId = computed(() => (route.params.id ? Number(route.params.id) : null))

const {
  book,
  detailLoading,
  detailError,
  createLoading,
  createError,
  updateLoading,
  updateError,
  fetch,
  create,
  update,
} = useRecipeBooks()

const { items, setItems, addRecipe, removeItem, saveOrder, addError, removeLoading } =
  useRecipeBookEditor(bookId)

const { uploading, uploadError, upload } = useImageUpload('recipes')

const form = ref({
  title: '',
  subtitle: '',
  description: '',
  cover_image_url: '',
})

const showAddModal = ref(false)

const formError = ref('')
const successFlash = ref('')

watch(
  () => book.value,
  (b) => {
    if (!b) return
    form.value = {
      title: b.title ?? '',
      subtitle: b.subtitle ?? '',
      description: b.description ?? '',
      cover_image_url: b.cover_image_url ?? '',
    }
    setItems(b.items ?? [])
  },
)

onMounted(async () => {
  if (isEdit.value && bookId.value) {
    await fetch(bookId.value)
  }
})

async function handleSaveMeta() {
  formError.value = ''
  if (!form.value.title.trim()) {
    formError.value = 'A cím megadása kötelező.'
    return
  }
  const payload = {
    title: form.value.title.trim(),
    subtitle: form.value.subtitle.trim() || null,
    description: form.value.description.trim() || null,
    cover_image_url: form.value.cover_image_url || null,
  }
  if (isEdit.value && bookId.value) {
    const res = await update(bookId.value, payload)
    if (res) {
      successFlash.value = 'Mentve'
      setTimeout(() => (successFlash.value = ''), 1500)
    }
  } else {
    const res = await create(payload)
    if (res) {
      router.replace({ name: 'recipe-book-edit', params: { id: res.id } })
    }
  }
}

async function handleCoverChange(event) {
  const file = event.target.files?.[0]
  if (!file) return
  const url = await upload(file)
  if (url) {
    form.value.cover_image_url = url
  }
  event.target.value = ''
}

async function onAddRecipe(recipe) {
  if (!isEdit.value) return
  try {
    await addRecipe(recipe.id)
    showAddModal.value = false
  } catch {
    /* error already shown via addError */
  }
}

async function onRemoveItem(item) {
  await removeItem(item.id)
}

async function onDragEnd() {
  await saveOrder(items.value)
}

const excludeRecipeIds = computed(() =>
  items.value.map((i) => i.recipe?.id).filter(Boolean),
)

const isLoadingMeta = computed(
  () => createLoading.value || updateLoading.value || uploading.value,
)
const metaErrorMessage = computed(
  () => formError.value || createError.value || updateError.value || uploadError.value,
)
</script>

<template>
  <div class="rb-editor">
    <div class="rb-editor-header">
      <button class="back-link" type="button" @click="router.back()">
        <svg fill="none" stroke="currentColor" stroke-width="2.4" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Vissza
      </button>
      <h1 class="rb-editor-title">
        {{ isEdit ? 'Receptkönyv szerkesztése' : 'Új receptkönyv' }}
      </h1>
      <div v-if="successFlash" class="flash">{{ successFlash }}</div>
    </div>

    <div v-if="detailLoading" class="state-center">
      <LoadingSpinner />
    </div>

    <div v-else-if="detailError" class="state-center">
      <p class="error-text">{{ detailError }}</p>
    </div>

    <div v-else class="rb-editor-grid">
      <section class="rb-editor-meta">
        <h2 class="section-title">Adatok</h2>

        <label class="field">
          <span class="field-label">Cím <span class="req">*</span></span>
          <input
            v-model="form.title"
            type="text"
            class="field-input"
            placeholder="pl. Anyukám 50 legjobb receptje"
            maxlength="120"
          />
        </label>

        <label class="field">
          <span class="field-label">Alcím</span>
          <input
            v-model="form.subtitle"
            type="text"
            class="field-input"
            placeholder="pl. Hagyományos magyar konyha"
            maxlength="200"
          />
        </label>

        <label class="field">
          <span class="field-label">Leírás</span>
          <textarea
            v-model="form.description"
            class="field-textarea"
            rows="4"
            placeholder="Pár sor a könyvedről, ami a borítóoldalon meg fog jelenni..."
            maxlength="5000"
          ></textarea>
        </label>

        <div class="field">
          <span class="field-label">Borítókép</span>
          <div class="cover-upload">
            <div v-if="form.cover_image_url" class="cover-preview">
              <img :src="form.cover_image_url" alt="Borítókép" />
              <button
                type="button"
                class="cover-remove"
                aria-label="Borítókép eltávolítása"
                @click="form.cover_image_url = ''"
              >
                <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <label class="cover-upload-btn">
              <input type="file" accept="image/*" class="hidden-input" @change="handleCoverChange" />
              <span v-if="uploading">Feltöltés...</span>
              <span v-else-if="form.cover_image_url">Kép cseréje</span>
              <span v-else>Kép feltöltése</span>
            </label>
          </div>
        </div>

        <p v-if="metaErrorMessage" class="error-text">{{ metaErrorMessage }}</p>

        <BaseButton
          variant="primary"
          :loading="isLoadingMeta"
          @click="handleSaveMeta"
        >
          {{ isEdit ? 'Mentés' : 'Könyv létrehozása' }}
        </BaseButton>

        <p v-if="!isEdit" class="hint">
          A könyv létrehozása után tudsz recepteket hozzáadni.
        </p>
      </section>

      <section v-if="isEdit" class="rb-editor-items">
        <div class="items-header">
          <h2 class="section-title">Receptek a könyvben ({{ items.length }})</h2>
          <BaseButton
            variant="primary"
            size="sm"
            rounded="full"
            @click="showAddModal = true"
          >
            + Recept hozzáadása
          </BaseButton>
        </div>

        <p v-if="addError" class="error-text">{{ addError }}</p>

        <div v-if="!items.length" class="items-empty">
          <p class="items-empty-text">
            Még nincs recept a könyvben. Adj hozzá egyet a fenti gombbal — bármely recept
            hozzáadható, amit a platform tartalmaz.
          </p>
        </div>

        <draggable
          v-else
          v-model="items"
          item-key="id"
          handle=".rbi-handle"
          ghost-class="rbi-ghost"
          drag-class="rbi-dragging"
          animation="200"
          @end="onDragEnd"
        >
          <template #item="{ element }">
            <div class="item-wrap">
              <RecipeBookItemEditor :item="element" @remove="onRemoveItem" />
            </div>
          </template>
        </draggable>

        <p v-if="removeLoading" class="hint">Eltávolítás...</p>
      </section>
    </div>

    <AddRecipeToBookModal
      v-model="showAddModal"
      :exclude-recipe-ids="excludeRecipeIds"
      @select="onAddRecipe"
    />
  </div>
</template>

<style scoped>
.rb-editor {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.rb-editor-header {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  flex-wrap: wrap;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.4rem 0.7rem;
  border-radius: 0.55rem;
  border: 1.5px solid var(--color-stroke);
  background: transparent;
  color: var(--color-muted);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 160ms ease, color 160ms ease;
}

.back-link:hover {
  background: var(--color-surface);
  color: var(--color-text);
}

.back-link svg {
  width: 0.95rem;
  height: 0.95rem;
}

.rb-editor-title {
  flex: 1;
  font-size: 1.4rem;
  font-weight: 800;
  margin: 0;
  letter-spacing: -0.02em;
}

.flash {
  background: color-mix(in srgb, var(--color-chip) 16%, transparent);
  color: var(--color-chip);
  padding: 0.3rem 0.85rem;
  border-radius: 999px;
  font-weight: 700;
  font-size: 0.78rem;
}

.rb-editor-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}

@media (min-width: 880px) {
  .rb-editor-grid {
    grid-template-columns: 22rem 1fr;
    gap: 1.75rem;
  }

  .rb-editor-meta {
    position: sticky;
    top: 5rem;
    align-self: start;
  }
}

.rb-editor-meta,
.rb-editor-items {
  background: var(--color-bg);
  border: 1.5px solid var(--color-stroke);
  border-radius: 1.1rem;
  padding: 1.1rem 1.15rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.section-title {
  font-size: 0.95rem;
  font-weight: 800;
  margin: 0 0 0.2rem;
  color: var(--color-text);
  letter-spacing: -0.01em;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.field-label {
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--color-muted);
}

.req {
  color: var(--color-danger);
}

.field-input,
.field-textarea {
  width: 100%;
  padding: 0.6rem 0.75rem;
  border: 1.5px solid var(--color-stroke);
  border-radius: 0.6rem;
  background: var(--color-bg);
  color: var(--color-text);
  font-size: 0.92rem;
  outline: none;
  font-family: inherit;
  transition: border-color 160ms ease;
}

.field-input:focus,
.field-textarea:focus {
  border-color: var(--color-accent);
}

.field-textarea {
  resize: vertical;
  min-height: 5.5rem;
}

.cover-upload {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.cover-preview {
  position: relative;
  border-radius: 0.7rem;
  overflow: hidden;
  border: 1.5px solid var(--color-stroke);
  aspect-ratio: 4 / 3;
  background: var(--color-surface);
}

.cover-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.cover-remove {
  position: absolute;
  top: 0.4rem;
  right: 0.4rem;
  width: 1.7rem;
  height: 1.7rem;
  border-radius: 999px;
  border: none;
  background: rgba(0, 0, 0, 0.45);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 160ms ease;
}

.cover-remove:hover {
  background: rgba(0, 0, 0, 0.65);
}

.cover-remove svg {
  width: 0.85rem;
  height: 0.85rem;
}

.cover-upload-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.55rem 0.9rem;
  border-radius: 0.6rem;
  border: 1.5px dashed var(--color-stroke);
  background: transparent;
  color: var(--color-muted);
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  transition: border-color 160ms ease, color 160ms ease;
}

.cover-upload-btn:hover {
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.hidden-input {
  display: none;
}

.hint {
  font-size: 0.78rem;
  color: var(--color-muted);
  margin: 0;
}

.error-text {
  color: var(--color-danger);
  font-size: 0.85rem;
  margin: 0;
}

.items-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.7rem;
  flex-wrap: wrap;
}

.items-empty {
  border: 1.5px dashed var(--color-stroke);
  border-radius: 0.85rem;
  padding: 1.5rem 1rem;
  text-align: center;
}

.items-empty-text {
  margin: 0;
  color: var(--color-muted);
  font-size: 0.9rem;
}

.item-wrap {
  margin-bottom: 0.5rem;
}

.rbi-ghost {
  opacity: 0.4;
}

.rbi-dragging {
  box-shadow: 0 12px 32px -8px rgba(47, 30, 23, 0.35);
}

.state-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 3rem 0;
  color: var(--color-muted);
}
</style>
