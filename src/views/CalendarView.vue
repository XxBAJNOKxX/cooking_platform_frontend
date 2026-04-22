<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import api from '@/services/api'
import WeekGrid from '@/components/calendar/WeekGrid.vue'
import BaseModal from '@/components/BaseModal.vue'
import BaseButton from '@/components/BaseButton.vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

function printCalendar() {
  window.print()
}

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

const showDeleteModal = ref(false)
const pendingDeleteId = ref(null)
const deleteError = ref(null)
const deleteLoading = ref(false)

const pendingDeleteMeal = computed(() =>
  mealPlans.value.find((p) => p.id === pendingDeleteId.value) ?? null
)

function handleDelete(id) {
  pendingDeleteId.value = id
  deleteError.value = null
  showDeleteModal.value = true
}

async function confirmDelete() {
  if (!pendingDeleteId.value) return
  const id = pendingDeleteId.value
  deleteLoading.value = true
  deleteError.value = null
  try {
    await api.delete(`/meal-plans/${id}`)
    mealPlans.value = mealPlans.value.filter((p) => p.id !== id)
    showDeleteModal.value = false
    pendingDeleteId.value = null
  } catch {
    deleteError.value = 'Nem sikerült törölni. Próbáld újra!'
  } finally {
    deleteLoading.value = false
  }
}

// ─── Move (drag & drop) ───────────────────────────────────────────────────────
async function handleMove({ id, date, meal_type }) {
  const idx = mealPlans.value.findIndex((p) => p.id === id)
  if (idx === -1) return
  const current = mealPlans.value[idx]
  if (current.planned_date === date && current.meal_type === meal_type) return

  // Optimistic update — snapshot so we can roll back on failure.
  const snapshot = { ...current }
  mealPlans.value[idx] = { ...current, planned_date: date, meal_type }

  try {
    await api.put(`/meal-plans/${id}`, { planned_date: date, meal_type })
  } catch {
    mealPlans.value[idx] = snapshot
    fetchError.value = 'Nem sikerült áthelyezni. Próbáld újra!'
    setTimeout(() => { fetchError.value = null }, 3000)
  }
}

// ─── Add Modal ────────────────────────────────────────────────────────────────

const MEAL_TYPES = ['Reggeli', 'Tízórai', 'Ebéd', 'Uzsonna', 'Vacsora']

const showModal = ref(false)
const modalDate = ref('')
const selectedRecipe = ref(null)
const selectedMealType = ref('Ebéd')
const calServings = ref(4)
const recipes = ref([])
const recipeSearch = ref('')
const recipesLoading = ref(false)
const addLoading = ref(false)
const addError = ref(null)
let debounceTimer = null

function stepServings(delta) {
  const next = (calServings.value || 1) + delta
  calServings.value = Math.min(100, Math.max(1, next))
}

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
  calServings.value = 4
  recipeSearch.value = ''
  addError.value = null
  showModal.value = true
  await loadRecipes('')
}

function onRecipePick(recipe) {
  selectedRecipe.value = recipe
  if (recipe?.servings) {
    calServings.value = recipe.servings
  }
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
      servings: calServings.value,
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

    <!-- ── Print-only header strip ────────────────────────────────────── -->
    <div class="print-header print-only">
      <div class="print-head-top">
        <div class="print-logo">Cookr<span class="print-logo-dot">.</span></div>
        <p v-if="authStore.user?.username" class="print-user">{{ authStore.user.username }}</p>
      </div>
      <div class="print-head-bottom">
        <p class="print-title">Étkezési napló</p>
        <p class="print-range">{{ weekLabel }}</p>
      </div>
    </div>

    <!-- ── Page Header ─────────────────────────────────────────────────── -->
    <div class="cal-header no-print">
      <div class="cal-title-row">
        <h1 class="cal-title">Étkezési napló</h1>
        <p class="cal-subtitle">Tervezd meg a heti étrendedet</p>
      </div>

      <button
        class="print-btn"
        @click="printCalendar"
        aria-label="Nyomtatás"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <polyline points="6,9 6,2 18,2 18,9"/>
          <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/>
          <rect x="6" y="14" width="12" height="8"/>
        </svg>
        Nyomtatás
      </button>

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
          @move="handleMove"
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

          <!-- Servings picker -->
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
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
                  <path d="M5 12h14" stroke-linecap="round"/>
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
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
                  <path d="M12 5v14M5 12h14" stroke-linecap="round"/>
                </svg>
              </button>
              <span class="cal-serv-unit">fő</span>
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

    <!-- ── Delete Confirmation Modal ─────────────────────────────────── -->
    <BaseModal v-model="showDeleteModal" title="Étkezés törlése" max-width="max-w-sm">
      <template #default>
        <div class="del-modal-body">
          <p class="del-modal-text">
            Biztosan törlöd
            <strong v-if="pendingDeleteMeal?.recipe?.title">„{{ pendingDeleteMeal.recipe.title }}”</strong>
            <span v-else>ezt az étkezést</span>
            a naptárból?
          </p>
          <p v-if="deleteError" class="add-error" role="alert">{{ deleteError }}</p>
        </div>
      </template>
      <template #footer>
        <div class="del-modal-actions">
          <BaseButton variant="outline" :disabled="deleteLoading" @click="showDeleteModal = false">
            Mégsem
          </BaseButton>
          <BaseButton variant="danger" :loading="deleteLoading" @click="confirmDelete">
            Törlés
          </BaseButton>
        </div>
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
  max-width: 100%;
  min-width: 0;
}

/* Allow inner .table-scroll to show its own horizontal scrollbar */
.grid-wrap > * { max-width: 100%; }

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

/* ── Servings picker ──────────────────────────────────────────── */
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
  transition: background 140ms ease, border-color 140ms ease, transform 140ms var(--ease-ui-out);
}
.cal-serv-btn svg { width: 0.875rem; height: 0.875rem; }

@media (hover: hover) and (pointer: fine) {
  .cal-serv-btn:hover:not(:disabled) {
    background: var(--color-surface);
    border-color: var(--color-accent);
    color: var(--color-accent);
  }
}

.cal-serv-btn:active:not(:disabled) { transform: scale(0.92); }
.cal-serv-btn:disabled { opacity: 0.4; cursor: not-allowed; }

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
  transition: border-color 140ms ease, box-shadow 140ms ease;
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

/* ── Delete modal ─────────────────────────────────────────────── */
.del-modal-body {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.del-modal-text {
  font-size: 0.9rem;
  line-height: 1.5;
  color: var(--color-text);
}

.del-modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  width: 100%;
}

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

/* ── Print button (screen) ─────────────────────────────────────── */
.print-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.5rem 1rem;
  border-radius: 0.625rem;
  border: 1.5px solid var(--color-stroke);
  background: var(--color-surface);
  font-size: 0.8125rem;
  font-weight: 700;
  color: var(--color-muted);
  cursor: pointer;
  transition:
    background 160ms ease,
    border-color 160ms ease,
    color 160ms ease,
    transform 160ms var(--ease-ui-out);
}
.print-btn svg { width: 1rem; height: 1rem; }
@media (hover: hover) and (pointer: fine) {
  .print-btn:hover {
    background: var(--color-surface-hover);
    border-color: var(--color-muted);
    color: var(--color-text);
  }
}
.print-btn:active { transform: scale(0.96); }

/* ── Print styles ──────────────────────────────────────────────── */
.print-only { display: none; }

@media print {
  .no-print { display: none !important; }
  .print-only { display: block !important; }

  @page {
    size: A4 landscape;
    margin: 10mm;
  }

  html, body {
    background: #fff !important;
    color: #000 !important;
    font-family: 'Helvetica Neue', Arial, sans-serif;
    font-size: 10pt;
    line-height: 1.4;
  }

  .cal-page {
    padding: 0 !important;
    max-width: 100% !important;
    margin: 0 !important;
  }

  /* Header strip (same visual language as ShoppingListView) */
  .print-header {
    padding: 0 0 8pt 0;
    border-bottom: 1.5pt solid #000;
    margin-bottom: 10pt;
  }
  .print-head-top {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 1rem;
  }
  .print-head-bottom {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 1rem;
    margin-top: 4pt;
  }
  .print-logo {
    font-size: 16pt;
    font-weight: 900;
    letter-spacing: -0.02em;
    color: #000;
    line-height: 1;
  }
  .print-logo-dot { color: #e9692c; }
  .print-user {
    font-size: 9pt;
    color: #000;
    font-weight: 700;
    margin: 0;
  }
  .print-title {
    font-size: 13pt;
    font-weight: 800;
    color: #000;
    margin: 0;
    letter-spacing: -0.01em;
  }
  .print-range {
    font-size: 9pt;
    color: #444;
    font-weight: 600;
    margin: 0;
  }

  /* Flatten the grid wrapper so the calendar spans the whole landscape page. */
  .table-scroll {
    overflow: visible !important;
    padding: 0 !important;
  }
  .week-table {
    min-width: 0 !important;
    width: 100% !important;
    border: 1pt solid #000 !important;
    border-radius: 0 !important;
    page-break-inside: avoid;
  }

  /* Type headers / day labels — stripped to ink-only */
  .type-hdr,
  .day-label,
  .corner {
    background: #f3f3f3 !important;
    border-color: #999 !important;
  }
  .slot { background: #fff !important; border-color: #ccc !important; }

  /* Hide interactive bits inside cells */
  .slot-add,
  .del-btn { display: none !important; }

  .slot-card {
    background: #fff !important;
    border: 1pt solid #999 !important;
    cursor: default !important;
  }
  .slot-title { font-size: 8.5pt !important; }
}
</style>

<!-- Unscoped: hide app chrome (navbar, footer) while printing the calendar. -->
<style>
@media print {
  #app > div > header,
  #app > div > nav,
  #app > div > footer {
    display: none !important;
  }
}
</style>
