<!-- Modal recipe-detail-ből: válassz egy saját könyvet, és add hozzá ezt a receptet. -->

<script setup>
import { ref, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/services/api'
import BaseModal from '@/components/BaseModal.vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import { useRecipeBooks } from '@/composables/useRecipeBooks'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  recipeId: { type: [Number, String], default: null },
})

const emit = defineEmits(['update:modelValue'])

const router = useRouter()

const { books, listLoading, listError, fetchAll } = useRecipeBooks()

const addingId = ref(null)
const addError = ref('')
const successId = ref(null)

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      addError.value = ''
      successId.value = null
      fetchAll()
    }
  },
)

async function addToBook(book) {
  if (!props.recipeId || addingId.value) return
  addingId.value = book.id
  addError.value = ''
  try {
    await api.post(`/recipe-books/${book.id}/items`, { recipe_id: props.recipeId })
    successId.value = book.id
  } catch (err) {
    addError.value =
      err.response?.data?.errors?.recipe_id?.[0] ||
      err.response?.data?.message ||
      'Nem sikerült hozzáadni a könyvhöz.'
  } finally {
    addingId.value = null
  }
}

function close() {
  emit('update:modelValue', false)
}

function goCreate() {
  close()
  router.push({ name: 'recipe-book-create' })
}

const hasBooks = computed(() => books.value.length > 0)
</script>

<template>
  <BaseModal
    :model-value="modelValue"
    title="Hozzáadás receptkönyvhöz"
    max-width="max-w-md"
    @update:model-value="(v) => emit('update:modelValue', v)"
  >
    <div v-if="listLoading" class="state">
      <LoadingSpinner />
    </div>

    <div v-else-if="listError" class="state error-text">{{ listError }}</div>

    <div v-else-if="!hasBooks" class="empty">
      <p>Még nincs receptkönyved.</p>
      <button type="button" class="btn-primary" @click="goCreate">Új könyv létrehozása</button>
    </div>

    <ul v-else class="book-list">
      <li v-for="book in books" :key="book.id">
        <button
          type="button"
          class="book-item"
          :disabled="addingId === book.id || successId === book.id"
          @click="addToBook(book)"
        >
          <span class="book-info">
            <span class="book-title">{{ book.title }}</span>
            <span class="book-meta">{{ book.items_count ?? 0 }} recept</span>
          </span>
          <span v-if="successId === book.id" class="status status-ok">Hozzáadva ✓</span>
          <span v-else-if="addingId === book.id" class="status">Hozzáadás...</span>
          <svg v-else class="chev" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </li>
    </ul>

    <p v-if="addError" class="error-text">{{ addError }}</p>

    <template #footer>
      <div class="footer">
        <button type="button" class="btn-cancel" @click="close">Bezárás</button>
        <button v-if="hasBooks" type="button" class="btn-secondary" @click="goCreate">
          + Új könyv
        </button>
      </div>
    </template>
  </BaseModal>
</template>

<style scoped>
.state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 0;
  color: var(--color-muted);
}

.empty {
  text-align: center;
  padding: 1rem 0;
}

.empty p {
  color: var(--color-muted);
  margin-bottom: 0.85rem;
}

.book-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  max-height: 50vh;
  overflow-y: auto;
}

.book-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 0.7rem 0.85rem;
  border: 1.5px solid var(--color-stroke);
  border-radius: 0.7rem;
  background: var(--color-bg);
  color: var(--color-text);
  cursor: pointer;
  transition: background 160ms ease, border-color 160ms ease;
}

.book-item:hover:not(:disabled) {
  background: var(--color-surface);
  border-color: var(--color-accent);
}

.book-item:disabled {
  cursor: default;
  opacity: 0.85;
}

.book-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.1rem;
  min-width: 0;
}

.book-title {
  font-weight: 700;
  font-size: 0.95rem;
}

.book-meta {
  font-size: 0.75rem;
  color: var(--color-muted);
}

.chev {
  width: 1rem;
  height: 1rem;
  color: var(--color-muted);
}

.status {
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--color-muted);
}

.status-ok {
  color: var(--color-chip);
}

.error-text {
  color: var(--color-danger);
  margin-top: 0.5rem;
  font-size: 0.85rem;
}

.footer {
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
}

.btn-cancel,
.btn-secondary,
.btn-primary {
  padding: 0.5rem 1.05rem;
  border-radius: 0.6rem;
  font-weight: 600;
  cursor: pointer;
  font-size: 0.85rem;
  border: 1.5px solid var(--color-stroke);
  background: transparent;
  color: var(--color-muted);
  transition: background 160ms ease, color 160ms ease;
}

.btn-cancel:hover {
  background: var(--color-surface);
  color: var(--color-text);
}

.btn-secondary {
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.btn-secondary:hover {
  background: color-mix(in srgb, var(--color-accent) 12%, transparent);
}

.btn-primary {
  border-color: var(--color-accent);
  background: var(--color-accent);
  color: white;
}

.btn-primary:hover {
  background: var(--color-accent-hover);
}
</style>
