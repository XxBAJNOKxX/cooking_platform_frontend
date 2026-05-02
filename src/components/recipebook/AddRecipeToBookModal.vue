<!-- Recept kereső modal a receptkönyv editorban — keresés alapján listáz, kiválasztásra emit. -->

<script setup>
import { ref, watch } from 'vue'
import BaseModal from '@/components/BaseModal.vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import { useRecipeSearch } from '@/composables/useMealPlans'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  excludeRecipeIds: { type: Array, default: () => [] },
})

const emit = defineEmits(['update:modelValue', 'select'])

const { recipes, recipesLoading, loadRecipes, scheduleLoad } = useRecipeSearch()
const searchTerm = ref('')

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      searchTerm.value = ''
      loadRecipes('')
    }
  },
)

function onInput() {
  scheduleLoad(searchTerm.value, 250)
}

function onPick(recipe) {
  emit('select', recipe)
}

function close() {
  emit('update:modelValue', false)
}
</script>

<template>
  <BaseModal
    :model-value="modelValue"
    title="Recept hozzáadása a könyvhöz"
    max-width="max-w-2xl"
    @update:model-value="(v) => emit('update:modelValue', v)"
  >
    <div class="search-bar">
      <svg class="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        v-model="searchTerm"
        type="search"
        class="search-input"
        placeholder="Keress recept címe alapján..."
        @input="onInput"
      />
    </div>

    <div class="results">
      <div v-if="recipesLoading" class="results-loading">
        <LoadingSpinner />
      </div>
      <div v-else-if="recipes.length === 0" class="results-empty">
        Nincs találat — próbálj más kulcsszót.
      </div>
      <ul v-else class="results-list">
        <li v-for="recipe in recipes" :key="recipe.id">
          <button
            type="button"
            class="result-item"
            :disabled="excludeRecipeIds.includes(recipe.id)"
            @click="onPick(recipe)"
          >
            <span class="result-thumb">
              <img v-if="recipe.image_url" :src="recipe.image_url" :alt="recipe.title" />
              <span v-else class="result-thumb-placeholder">🍽</span>
            </span>
            <span class="result-text">
              <span class="result-title">{{ recipe.title }}</span>
              <span class="result-meta">
                {{ recipe.author?.username ? recipe.author.username + ' · ' : '' }}{{ recipe.prep_time }} perc
              </span>
            </span>
            <span v-if="excludeRecipeIds.includes(recipe.id)" class="result-already">
              Már bent van
            </span>
            <svg v-else class="result-chevron" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </li>
      </ul>
    </div>

    <template #footer>
      <div class="footer">
        <button type="button" class="btn-cancel" @click="close">Bezárás</button>
      </div>
    </template>
  </BaseModal>
</template>

<style scoped>
.search-bar {
  position: relative;
  margin-bottom: 0.75rem;
}

.search-icon {
  position: absolute;
  top: 50%;
  left: 0.85rem;
  transform: translateY(-50%);
  width: 1.05rem;
  height: 1.05rem;
  color: var(--color-muted);
}

.search-input {
  width: 100%;
  padding: 0.7rem 0.95rem 0.7rem 2.5rem;
  border-radius: 0.7rem;
  border: 1.5px solid var(--color-stroke);
  background: var(--color-bg);
  color: var(--color-text);
  font-size: 0.95rem;
  outline: none;
  transition: border-color 160ms ease;
}

.search-input:focus {
  border-color: var(--color-accent);
}

.results {
  min-height: 14rem;
  max-height: 60vh;
  overflow-y: auto;
}

.results-loading,
.results-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 0;
  color: var(--color-muted);
}

.results-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.result-item {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 0.7rem;
  width: 100%;
  padding: 0.55rem 0.7rem;
  border: 1.5px solid var(--color-stroke);
  border-radius: 0.8rem;
  background: var(--color-bg);
  color: var(--color-text);
  text-align: left;
  cursor: pointer;
  transition:
    background 160ms ease,
    border-color 160ms ease;
}

.result-item:hover:not(:disabled) {
  background: var(--color-surface);
  border-color: var(--color-accent);
}

.result-item:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.result-thumb {
  width: 2.6rem;
  height: 2.6rem;
  border-radius: 0.55rem;
  overflow: hidden;
  background: var(--color-surface);
  display: flex;
  align-items: center;
  justify-content: center;
}

.result-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.result-thumb-placeholder {
  font-size: 1.3rem;
}

.result-text {
  display: flex;
  flex-direction: column;
  gap: 0.05rem;
  min-width: 0;
}

.result-title {
  font-size: 0.92rem;
  font-weight: 700;
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.result-meta {
  font-size: 0.72rem;
  color: var(--color-muted);
}

.result-chevron {
  width: 0.95rem;
  height: 0.95rem;
  color: var(--color-muted);
}

.result-already {
  font-size: 0.7rem;
  color: var(--color-muted);
  font-style: italic;
}

.footer {
  display: flex;
  justify-content: flex-end;
}

.btn-cancel {
  padding: 0.5rem 1.1rem;
  border-radius: 0.6rem;
  background: transparent;
  border: 1.5px solid var(--color-stroke);
  color: var(--color-muted);
  font-weight: 600;
  cursor: pointer;
  transition:
    background 160ms ease,
    color 160ms ease;
}

.btn-cancel:hover {
  background: var(--color-surface);
  color: var(--color-text);
}
</style>
