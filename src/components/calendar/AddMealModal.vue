<!-- Naptár „étkezés hozzáadása” modal — recept keresés + típus + adagok. -->

<script setup>
import { ref, computed, watch } from 'vue'
import BaseModal from '@/components/BaseModal.vue'
import BaseButton from '@/components/BaseButton.vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import { useRecipeSearch } from '@/composables/useMealPlans'

const MEAL_TYPES = ['Reggeli', 'Tízórai', 'Ebéd', 'Uzsonna', 'Vacsora']

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  date: { type: String, default: '' },
  initialMealType: { type: String, default: 'Ebéd' },
  addLoading: { type: Boolean, default: false },
  addError: { type: String, default: '' },
})

const emit = defineEmits(['update:modelValue', 'submit'])

const { recipes, recipesLoading, loadRecipes, scheduleLoad } = useRecipeSearch()

const selectedRecipe = ref(null)
const selectedMealType = ref('Ebéd')
const calServings = ref(4)
const recipeSearch = ref('')

watch(
  () => props.modelValue,
  async (open) => {
    if (open) {
      selectedRecipe.value = null
      selectedMealType.value = props.initialMealType || 'Ebéd'
      calServings.value = 4
      recipeSearch.value = ''
      await loadRecipes('')
    }
  },
)

const modalDateLabel = computed(() => {
  if (!props.date) return ''
  return new Date(`${props.date}T12:00:00`).toLocaleDateString('hu-HU', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
})

function stepServings(delta) {
  const next = (calServings.value || 1) + delta
  calServings.value = Math.min(100, Math.max(1, next))
}

function onSearchInput() {
  scheduleLoad(recipeSearch.value)
}

function onRecipePick(recipe) {
  selectedRecipe.value = recipe
  if (recipe?.servings) calServings.value = recipe.servings
}

function onSubmit() {
  if (!selectedRecipe.value) return
  emit('submit', {
    recipe_id: selectedRecipe.value.id,
    meal_type: selectedMealType.value,
    planned_date: props.date,
    servings: calServings.value,
  })
}

function close() {
  emit('update:modelValue', false)
}
</script>

<template>
  <BaseModal
    :model-value="modelValue"
    @update:model-value="close"
    title="Étkezés hozzáadása"
    max-width="max-w-md"
  >
    <div class="modal-body">
      <p class="modal-date-label">{{ modalDateLabel }}</p>

      <div class="search-wrap">
        <svg
          class="search-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" stroke-linecap="round" />
        </svg>
        <input
          v-model="recipeSearch"
          @input="onSearchInput"
          class="search-input"
          placeholder="Recept keresése…"
          type="search"
        />
      </div>

      <div class="recipe-list" role="listbox" aria-label="Receptek">
        <div v-if="recipesLoading" class="recipes-loading">
          <LoadingSpinner size="h-5 w-5" />
        </div>

        <template v-else>
          <button
            v-for="recipe in recipes"
            :key="recipe.id"
            class="recipe-opt"
            :class="{ selected: selectedRecipe?.id === recipe.id }"
            role="option"
            :aria-selected="selectedRecipe?.id === recipe.id"
            @click="onRecipePick(recipe)"
          >
            <div class="recipe-thumb">
              <img
                v-if="recipe.image_url"
                :src="recipe.image_url"
                :alt="recipe.title"
                loading="lazy"
              />
              <span v-else class="recipe-thumb-placeholder" aria-hidden="true">🍽️</span>
            </div>
            <span class="recipe-opt-name">{{ recipe.title }}</span>
            <span v-if="selectedRecipe?.id === recipe.id" class="check-mark" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M5 13l4 4L19 7" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </span>
          </button>

          <p v-if="!recipes.length" class="no-results">Nincs találat</p>
        </template>
      </div>

      <div class="meal-type-section">
        <span class="section-label">Étkezés típusa</span>
        <div class="meal-type-pills">
          <button
            v-for="type in MEAL_TYPES"
            :key="type"
            class="type-pill"
            :class="{ active: selectedMealType === type }"
            @click="selectedMealType = type"
          >
            {{ type }}
          </button>
        </div>
      </div>

      <div class="meal-type-section">
        <span class="section-label">Hány főre</span>
        <div class="cal-servings">
          <button
            type="button"
            class="cal-serv-btn"
            :disabled="calServings <= 1"
            @click="stepServings(-1)"
            aria-label="Kevesebb"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              aria-hidden="true"
            >
              <path d="M5 12h14" stroke-linecap="round" />
            </svg>
          </button>
          <input
            v-model.number="calServings"
            type="number"
            min="1"
            max="100"
            class="cal-serv-input"
            aria-label="Adagok száma"
          />
          <button
            type="button"
            class="cal-serv-btn"
            :disabled="calServings >= 100"
            @click="stepServings(1)"
            aria-label="Több"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              aria-hidden="true"
            >
              <path d="M12 5v14M5 12h14" stroke-linecap="round" />
            </svg>
          </button>
          <span class="cal-serv-unit">fő</span>
        </div>
      </div>

      <p v-if="addError" class="add-error" role="alert">{{ addError }}</p>
    </div>

    <template #footer>
      <BaseButton
        variant="primary"
        block
        :loading="addLoading"
        :disabled="!selectedRecipe"
        @click="onSubmit"
      >
        Hozzáadás a naptárhoz
      </BaseButton>
    </template>
  </BaseModal>
</template>

<style scoped>
.modal-body {
  display: flex;
  flex-direction: column;
  gap: 1.125rem;
}

.modal-date-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-muted);
  text-transform: capitalize;
  padding-bottom: 0.25rem;
  border-bottom: 1px solid var(--color-stroke);
}

.search-wrap {
  position: relative;
}

.search-icon {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  width: 1rem;
  height: 1rem;
  color: var(--color-muted);
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 0.625rem 0.875rem 0.625rem 2.25rem;
  border-radius: 0.75rem;
  border: 1.5px solid var(--color-stroke);
  background: var(--color-bg);
  font-size: 0.875rem;
  color: var(--color-text);
  outline: none;
  transition:
    border-color 160ms ease,
    box-shadow 160ms ease;
}

.search-input::placeholder {
  color: var(--color-muted);
}

.search-input:focus {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-accent) 15%, transparent);
}

.recipe-list {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  max-height: 220px;
  overflow-y: auto;
  padding-right: 0.25rem;
  scrollbar-width: thin;
  scrollbar-color: var(--color-stroke) transparent;
}

.recipes-loading {
  display: flex;
  justify-content: center;
  padding: 1.5rem;
}

.recipe-opt {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  width: 100%;
  padding: 0.5rem 0.625rem;
  border-radius: 0.625rem;
  border: 1.5px solid transparent;
  background: transparent;
  cursor: pointer;
  text-align: left;
  transition:
    background 160ms var(--ease-ui-out),
    border-color 160ms ease,
    transform 160ms var(--ease-ui-out);
}

@media (hover: hover) and (pointer: fine) {
  .recipe-opt:hover {
    background: var(--color-surface);
  }
}

.recipe-opt:active {
  transform: scale(0.985);
}

.recipe-opt.selected {
  background: color-mix(in srgb, var(--color-accent) 8%, var(--color-bg));
  border-color: color-mix(in srgb, var(--color-accent) 40%, transparent);
}

.recipe-thumb {
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 0.5rem;
  overflow: hidden;
  flex-shrink: 0;
  background: var(--color-surface);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
}

.recipe-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.recipe-opt-name {
  flex: 1;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text);
  line-height: 1.3;
  min-width: 0;
}

.check-mark {
  width: 1.125rem;
  height: 1.125rem;
  flex-shrink: 0;
  color: var(--color-accent);
  display: flex;
}

.check-mark svg {
  width: 100%;
  height: 100%;
}

.no-results {
  text-align: center;
  font-size: 0.85rem;
  color: var(--color-muted);
  padding: 1rem;
}

.meal-type-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.section-label {
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--color-muted);
}

.meal-type-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
}

.type-pill {
  padding: 0.3rem 0.75rem;
  border-radius: 999px;
  border: 1.5px solid var(--color-stroke);
  background: transparent;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-muted);
  cursor: pointer;
  transition:
    background 160ms ease,
    border-color 160ms ease,
    color 160ms ease,
    transform 160ms var(--ease-ui-out);
}

.type-pill.active {
  background: var(--color-accent);
  border-color: var(--color-accent);
  color: var(--color-bg);
}

.type-pill:active {
  transform: scale(0.94);
}

.cal-servings {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.cal-serv-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 999px;
  border: 1.5px solid var(--color-stroke);
  background: transparent;
  color: var(--color-text);
  cursor: pointer;
  transition:
    background 140ms ease,
    border-color 140ms ease,
    transform 140ms var(--ease-ui-out);
}
.cal-serv-btn svg {
  width: 0.875rem;
  height: 0.875rem;
}

@media (hover: hover) and (pointer: fine) {
  .cal-serv-btn:hover:not(:disabled) {
    background: var(--color-surface);
    border-color: var(--color-accent);
    color: var(--color-accent);
  }
}

.cal-serv-btn:active:not(:disabled) {
  transform: scale(0.92);
}
.cal-serv-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.cal-serv-input {
  width: 3.25rem;
  padding: 0.35rem 0.25rem;
  border-radius: 0.5rem;
  border: 1.5px solid var(--color-stroke);
  background: var(--color-bg);
  font-size: 0.9375rem;
  font-weight: 700;
  text-align: center;
  color: var(--color-text);
  outline: none;
  transition:
    border-color 140ms ease,
    box-shadow 140ms ease;
  -moz-appearance: textfield;
}
.cal-serv-input::-webkit-outer-spin-button,
.cal-serv-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.cal-serv-input:focus {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-accent) 15%, transparent);
}

.cal-serv-unit {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-muted);
}

.add-error {
  font-size: 0.8125rem;
  color: var(--color-danger);
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  background: color-mix(in srgb, var(--color-danger) 8%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-danger) 25%, transparent);
}
</style>
