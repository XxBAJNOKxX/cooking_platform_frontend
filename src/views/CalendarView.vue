<!-- Heti étkezési naptár, drag-and-drop áthelyezéssel és nyomtatással. -->

<script setup>
import { ref, computed, onMounted } from 'vue'
import WeekGrid from '@/components/calendar/WeekGrid.vue'
import AddMealModal from '@/components/calendar/AddMealModal.vue'
import DeleteConfirmModal from '@/components/recipe/DeleteConfirmModal.vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import BaseButton from '@/components/BaseButton.vue'
import { useAuthStore } from '@/stores/auth'
import { useMealPlans, getMondayOf, formatDateStr } from '@/composables/useMealPlans'
import { usePageRule } from '@/composables/usePageRule'

usePageRule('@page { size: A4 landscape; margin: 10mm; }')

const authStore = useAuthStore()

const {
  mealPlans,
  mealsByDate,
  loading,
  fetchError,
  deleteLoading,
  deleteError,
  addLoading,
  addError,
  fetchMealPlans,
  deleteMealPlan,
  moveMealPlan,
  addMealPlan,
} = useMealPlans()

function printCalendar() {
  window.print()
}

const currentWeekStart = ref(getMondayOf(new Date()))
const slideDir = ref('forward')

const weekDays = computed(() =>
  Array.from({ length: 7 }, (_, i) => {
    const d = new Date(currentWeekStart.value)
    d.setDate(d.getDate() + i)
    return d
  }),
)

const weekKey = computed(() => formatDateStr(weekDays.value[0]))

const weekLabel = computed(() => {
  const start = weekDays.value[0]
  const end = weekDays.value[6]
  const startStr = start.toLocaleDateString('hu-HU', { month: 'long', day: 'numeric' })
  const endStr = end.toLocaleDateString('hu-HU', { day: 'numeric' })
  return `${start.getFullYear()}. ${startStr}–${endStr}.`
})

const isCurrentWeek = computed(
  () => formatDateStr(currentWeekStart.value) === formatDateStr(getMondayOf(new Date())),
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

const showDeleteModal = ref(false)
const pendingDeleteId = ref(null)

const pendingDeleteMeal = computed(
  () => mealPlans.value.find((p) => p.id === pendingDeleteId.value) ?? null,
)

function handleDelete(id) {
  pendingDeleteId.value = id
  showDeleteModal.value = true
}

async function confirmDelete() {
  if (!pendingDeleteId.value) return
  const ok = await deleteMealPlan(pendingDeleteId.value)
  if (ok) {
    showDeleteModal.value = false
    pendingDeleteId.value = null
  }
}

const showModal = ref(false)
const modalDate = ref('')
const initialMealType = ref('Ebéd')

function openAddModal(dateStr, mealType = 'Ebéd') {
  modalDate.value = dateStr
  initialMealType.value = mealType
  showModal.value = true
}

async function onSubmitAdd(payload) {
  const ok = await addMealPlan(payload)
  if (ok) showModal.value = false
}

onMounted(fetchMealPlans)
</script>

<template>
  <div class="cal-page">
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

    <div class="cal-header no-print">
      <div class="cal-title-row">
        <h1 class="cal-title">Étkezési napló</h1>
        <p class="cal-subtitle">Tervezd meg a heti étrendedet</p>
      </div>

      <button class="print-btn" @click="printCalendar" aria-label="Nyomtatás">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          aria-hidden="true"
        >
          <polyline points="6,9 6,2 18,2 18,9" />
          <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" />
          <rect x="6" y="14" width="12" height="8" />
        </svg>
        Nyomtatás
      </button>

      <div class="week-nav">
        <button class="nav-arrow" @click="goWeek(-1)" aria-label="Előző hét">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            aria-hidden="true"
          >
            <path d="M15 18l-6-6 6-6" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>

        <div class="week-center">
          <span class="week-label">{{ weekLabel }}</span>
          <Transition name="today-btn">
            <button v-if="!isCurrentWeek" class="today-btn" @click="goToday">Ma</button>
          </Transition>
        </div>

        <button class="nav-arrow" @click="goWeek(1)" aria-label="Következő hét">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            aria-hidden="true"
          >
            <path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
      </div>
    </div>

    <div v-if="loading" class="state-center">
      <LoadingSpinner />
    </div>

    <div v-else-if="fetchError" class="state-center">
      <p class="error-text">{{ fetchError }}</p>
      <BaseButton variant="outline" size="sm" @click="fetchMealPlans">Újra</BaseButton>
    </div>

    <div v-else class="grid-wrap">
      <Transition :name="slideDir">
        <WeekGrid
          :key="weekKey"
          :week-days="weekDays"
          :meals-by-date="mealsByDate"
          :today="new Date()"
          @add="openAddModal"
          @delete="handleDelete"
          @move="moveMealPlan"
        />
      </Transition>
    </div>

    <AddMealModal
      v-model="showModal"
      :date="modalDate"
      :initial-meal-type="initialMealType"
      :add-loading="addLoading"
      :add-error="addError || ''"
      @submit="onSubmitAdd"
    />

    <DeleteConfirmModal
      v-model="showDeleteModal"
      title="Étkezés törlése"
      :item-name="pendingDeleteMeal?.recipe?.title ?? 'étkezést'"
      body-prefix="Biztosan törlöd"
      body-suffix="a naptárból?"
      :deleting="deleteLoading"
      :error-message="deleteError || ''"
      @confirm="confirmDelete"
    />
  </div>
</template>

<style scoped>
.cal-page {
  padding: 1.5rem 0 3rem;
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
}

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
  transition:
    background 160ms ease,
    color 160ms ease,
    transform 160ms var(--ease-ui-out);
}

.nav-arrow svg {
  width: 1rem;
  height: 1rem;
}

@media (hover: hover) and (pointer: fine) {
  .nav-arrow:hover {
    background: var(--color-bg);
    color: var(--color-text);
  }
}

.nav-arrow:active {
  transform: scale(0.9);
}

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
  transition:
    background 160ms ease,
    transform 160ms var(--ease-ui-out);
}

.today-btn:active {
  transform: scale(0.94);
}

.today-btn-enter-active,
.today-btn-leave-active {
  transition:
    opacity 180ms var(--ease-ui-out),
    transform 180ms var(--ease-ui-out);
}
.today-btn-enter-from,
.today-btn-leave-to {
  opacity: 0;
  transform: scale(0.8);
}

.grid-wrap {
  position: relative;
  overflow: hidden;
  max-width: 100%;
  min-width: 0;
}

.grid-wrap > * {
  max-width: 100%;
}

.forward-enter-active,
.forward-leave-active,
.backward-enter-active,
.backward-leave-active {
  transition:
    opacity 220ms var(--ease-ui-out),
    transform 260ms var(--ease-ui-in-out);
}

.forward-leave-active,
.backward-leave-active {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.forward-enter-from {
  opacity: 0;
  transform: translateX(24px);
}
.forward-leave-to {
  opacity: 0;
  transform: translateX(-24px);
}
.backward-enter-from {
  opacity: 0;
  transform: translateX(-24px);
}
.backward-leave-to {
  opacity: 0;
  transform: translateX(24px);
}

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

@media (max-width: 640px) {
  .cal-page {
    padding: 1rem 0 3rem;
  }
  .cal-header {
    flex-direction: column;
    align-items: stretch;
    padding: 0 0.25rem;
  }
  .week-nav {
    justify-content: center;
  }
  .cal-title {
    font-size: 1.375rem;
  }
}

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
.print-btn svg {
  width: 1rem;
  height: 1rem;
}
@media (hover: hover) and (pointer: fine) {
  .print-btn:hover {
    background: var(--color-surface-hover);
    border-color: var(--color-muted);
    color: var(--color-text);
  }
}
.print-btn:active {
  transform: scale(0.96);
}

@media print {
  .cal-page {
    display: block !important;
    padding: 0 !important;
    max-width: 100% !important;
    margin: 0 !important;
  }

  .print-logo {
    font-size: 16pt;
  }
  .print-user,
  .print-range {
    font-size: 9pt;
  }
  .print-title {
    font-size: 13pt;
  }
}
</style>

<!-- Unscoped: html/body rules must not be scoped to a component hash. -->
<style>
@media print {
  #app > div > header,
  #app > div > nav,
  #app > div > footer {
    display: none !important;
  }

  html,
  body {
    font-family: 'Helvetica Neue', Arial, sans-serif;
    font-size: 10pt;
    line-height: 1.4;
    color: #000 !important;
  }
}
</style>
