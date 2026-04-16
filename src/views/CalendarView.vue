<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import api from '@/services/api'
import WeekGrid from '@/components/calendar/WeekGrid.vue'
import BaseModal from '@/components/BaseModal.vue'
import BaseButton from '@/components/BaseButton.vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toDateStr(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function getMondayOf(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  const day = d.getDay()
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day))
  return d
}

// ─── Week Navigation ──────────────────────────────────────────────────────────

const currentWeekStart = ref(getMondayOf(new Date()))
const slideDir = ref('forward') // 'forward' | 'backward'

const weekDays = computed(() =>
  Array.from({ length: 7 }, (_, i) => {
    const d = new Date(currentWeekStart.value)
    d.setDate(d.getDate() + i)
    return d
  })
)

const weekKey = computed(() => toDateStr(weekDays.value[0]))

const weekLabel = computed(() => {
  const start = weekDays.value[0]
  const end = weekDays.value[6]
  const startStr = start.toLocaleDateString('hu-HU', { month: 'long', day: 'numeric' })
  const endStr = end.toLocaleDateString('hu-HU', { day: 'numeric' })
  return `${start.getFullYear()}. ${startStr}–${endStr}.`
})

const isCurrentWeek = computed(
  () => toDateStr(currentWeekStart.value) === toDateStr(getMondayOf(new Date()))
)

function goWeek(dir) {
  slideDir.value = dir > 0 ? 'forward' : 'backward'
  const d = new Date(currentWeekStart.value)
  d.setDate(d.getDate() + dir * 7)
  currentWeekStart.value = d
}

function goToday() {
  const now = getMondayOf(new Date())
  slideDir.value = currentWeekStart.value < now ? 'forward' : 'backward'
  currentWeekStart.value = now
}

// ─── Meal Plans Data ──────────────────────────────────────────────────────────

const mealPlans = ref([])
const loading = ref(true)
const fetchError = ref(null)

async function fetchMealPlans() {
  loading.value = true
  fetchError.value = null
  try {
    const res = await api.get('/meal-plans', { params: { per_page: 100 } })
    mealPlans.value = res.data.data ?? []
  } catch {
    fetchError.value = 'Nem sikerült betölteni az étkezési tervet.'
  } finally {
    loading.value = false
  }
}

const mealsByDate = computed(() => {
  const map = {}
  for (const plan of mealPlans.value) {
    if (!map[plan.planned_date]) map[plan.planned_date] = []
    map[plan.planned_date].push(plan)
  }
  return map
})

// ─── Delete ───────────────────────────────────────────────────────────────────

async function handleDelete(id) {
  mealPlans.value = mealPlans.value.filter((p) => p.id !== id)
  try {
    await api.delete(`/meal-plans/${id}`)
  } catch {
    await fetchMealPlans()
  }
}

// ─── Add Modal ────────────────────────────────────────────────────────────────

const MEAL_TYPES = ['Reggeli', 'Tízórai', 'Ebéd', 'Uzsonna', 'Vacsora']

const showModal = ref(false)
const modalDate = ref('')
const selectedRecipe = ref(null)
const selectedMealType = ref('Ebéd')
const recipes = ref([])
const recipeSearch = ref('')
const recipesLoading = ref(false)
const addLoading = ref(false)
const addError = ref(null)
let debounceTimer = null

const modalDateLabel = computed(() => {
  if (!modalDate.value) return ''
  return new Date(`${modalDate.value}T12:00:00`).toLocaleDateString('hu-HU', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
})

async function loadRecipes(search = '') {
  recipesLoading.value = true
  try {
    const res = await api.get('/recipes', { params: { search, per_page: 30 } })
    recipes.value = res.data.data ?? []
  } catch {
    recipes.value = []
  } finally {
    recipesLoading.value = false
  }
}

function onSearchInput() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => loadRecipes(recipeSearch.value), 300)
}

async function openAddModal(dateStr, mealType = 'Ebéd') {
  modalDate.value = dateStr
  selectedRecipe.value = null
  selectedMealType.value = mealType
  recipeSearch.value = ''
  addError.value = null
  showModal.value = true
  await loadRecipes('')
}

async function submitAddMeal() {
  if (!selectedRecipe.value) return
  addLoading.value = true
  addError.value = null
  try {
    const res = await api.post('/meal-plans', {
      recipe_id: selectedRecipe.value.id,
      meal_type: selectedMealType.value,
      planned_date: modalDate.value,
    })
    mealPlans.value.push(res.data.data)
    showModal.value = false
  } catch {
    addError.value = 'Nem sikerült hozzáadni. Próbáld újra!'
  } finally {
    addLoading.value = false
  }
}

onMounted(fetchMealPlans)
onUnmounted(() => clearTimeout(debounceTimer))
</script>

<template>
  <div class="cal-page">

    <!-- ── Page Header ─────────────────────────────────────────────────── -->
    <div class="cal-header">
      <div class="cal-title-row">
        <h1 class="cal-title">Étkezési napló</h1>
        <p class="cal-subtitle">Tervezd meg a heti étrendedet</p>
      </div>

      <div class="week-nav">
        <button class="nav-arrow" @click="goWeek(-1)" aria-label="Előző hét">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
            <path d="M15 18l-6-6 6-6" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>

        <div class="week-center">
          <span class="week-label">{{ weekLabel }}</span>
          <Transition name="today-btn">
            <button v-if="!isCurrentWeek" class="today-btn" @click="goToday">
              Ma
            </button>
          </Transition>
        </div>

        <button class="nav-arrow" @click="goWeek(1)" aria-label="Következő hét">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
            <path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- ── States ─────────────────────────────────────────────────────── -->
    <div v-if="loading" class="state-center">
      <LoadingSpinner />
    </div>

    <div v-else-if="fetchError" class="state-center">
      <p class="error-text">{{ fetchError }}</p>
      <BaseButton variant="outline" size="sm" @click="fetchMealPlans">Újra</BaseButton>
    </div>

    <!-- ── Grid ───────────────────────────────────────────────────────── -->
    <div v-else class="grid-wrap">
      <Transition :name="slideDir">
        <WeekGrid
          :key="weekKey"
          :week-days="weekDays"
          :meals-by-date="mealsByDate"
          :today="new Date()"
          @add="openAddModal"
          @delete="handleDelete"
        />
      </Transition>
    </div>

    <!-- ── Add Meal Modal ─────────────────────────────────────────────── -->
    <BaseModal v-model="showModal" title="Étkezés hozzáadása" max-width="max-w-md">
      <template #default>
        <div class="modal-body">

          <!-- Date label -->
          <p class="modal-date-label">{{ modalDateLabel }}</p>

          <!-- Recipe search -->
          <div class="search-wrap">
            <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35" stroke-linecap="round"/>
            </svg>
            <input
              v-model="recipeSearch"
              @input="onSearchInput"
              class="search-input"
              placeholder="Recept keresése…"
              type="search"
            />
          </div>

          <!-- Recipe list -->
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
                @click="selectedRecipe = recipe"
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
                    <path d="M5 13l4 4L19 7" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </span>
              </button>

              <p v-if="!recipes.length" class="no-results">Nincs találat</p>
            </template>
          </div>

          <!-- Meal type -->
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

          <p v-if="addError" class="add-error" role="alert">{{ addError }}</p>
        </div>
      </template>

      <template #footer>
        <BaseButton
          variant="primary"
          block
          :loading="addLoading"
          :disabled="!selectedRecipe"
          @click="submitAddMeal"
        >
          Hozzáadás a naptárhoz
        </BaseButton>
      </template>
    </BaseModal>

  </div>
</template>

<style scoped>
/* ── Page Layout ──────────────────────────────────────────────── */
.cal-page {
  padding: 1.5rem 0 3rem;
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
}

/* ── Header ───────────────────────────────────────────────────── */
.cal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
  padding: 0 0.25rem;
}

.cal-title {
  font-size: 1.625rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--color-text);
  line-height: 1.2;
}

.cal-subtitle {
  font-size: 0.875rem;
  color: var(--color-muted);
  margin-top: 0.2rem;
}

/* ── Week Nav ─────────────────────────────────────────────────── */
.week-nav {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  background: var(--color-surface);
  border: 1.5px solid var(--color-stroke);
  border-radius: 999px;
  padding: 0.3rem 0.3rem 0.3rem 0.5rem;
}

.nav-arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 999px;
  border: none;
  background: transparent;
  color: var(--color-muted);
  cursor: pointer;
  flex-shrink: 0;
  transition: background 160ms ease, color 160ms ease, transform 160ms var(--ease-ui-out);
}

.nav-arrow svg { width: 1rem; height: 1rem; }

@media (hover: hover) and (pointer: fine) {
  .nav-arrow:hover {
    background: var(--color-bg);
    color: var(--color-text);
  }
}

.nav-arrow:active { transform: scale(0.90); }

.week-center {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0 0.25rem;
}

.week-label {
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--color-text);
  white-space: nowrap;
}

.today-btn {
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  border: 1.5px solid var(--color-accent);
  background: color-mix(in srgb, var(--color-accent) 10%, transparent);
  color: var(--color-accent);
  cursor: pointer;
  transition: background 160ms ease, transform 160ms var(--ease-ui-out);
}

.today-btn:active { transform: scale(0.94); }

.today-btn-enter-active,
.today-btn-leave-active {
  transition: opacity 180ms var(--ease-ui-out), transform 180ms var(--ease-ui-out);
}
.today-btn-enter-from,
.today-btn-leave-to {
  opacity: 0;
  transform: scale(0.8);
}

/* ── Grid Wrapper (for slide transition) ─────────────────────── */
.grid-wrap {
  position: relative;
  overflow: hidden;
}

/* forward (next week): new content enters from right */
.forward-enter-active,
.forward-leave-active,
.backward-enter-active,
.backward-leave-active {
  transition: opacity 220ms var(--ease-ui-out), transform 260ms var(--ease-ui-in-out);
}

.forward-leave-active,
.backward-leave-active {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.forward-enter-from  { opacity: 0; transform: translateX(24px);  }
.forward-leave-to    { opacity: 0; transform: translateX(-24px); }
.backward-enter-from { opacity: 0; transform: translateX(-24px); }
.backward-leave-to   { opacity: 0; transform: translateX(24px);  }

/* ── States ───────────────────────────────────────────────────── */
.state-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 4rem 0;
  color: var(--color-muted);
}

.error-text {
  font-size: 0.9rem;
  color: var(--color-danger);
}

/* ── Modal Body ───────────────────────────────────────────────── */
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

/* ── Search ───────────────────────────────────────────────────── */
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
  transition: border-color 160ms ease, box-shadow 160ms ease;
}

.search-input::placeholder { color: var(--color-muted); }

.search-input:focus {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-accent) 15%, transparent);
}

/* ── Recipe List ──────────────────────────────────────────────── */
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

.recipe-opt:active { transform: scale(0.985); }

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

/* ── Meal Type Picker ─────────────────────────────────────────── */
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

.type-pill:active { transform: scale(0.94); }

/* ── Error ────────────────────────────────────────────────────── */
.add-error {
  font-size: 0.8125rem;
  color: var(--color-danger);
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  background: color-mix(in srgb, var(--color-danger) 8%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-danger) 25%, transparent);
}

/* ── Responsive ───────────────────────────────────────────────── */
@media (max-width: 640px) {
  .cal-page { padding: 1rem 0 3rem; }
  .cal-header { flex-direction: column; align-items: stretch; padding: 0 0.25rem; }
  .week-nav { justify-content: center; }
  .cal-title { font-size: 1.375rem; }
}
</style>
