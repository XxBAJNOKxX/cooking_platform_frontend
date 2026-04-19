<script setup>
import { ref, computed, watch } from 'vue'
import api from '@/services/api'
import DateRangePicker from '@/components/DateRangePicker.vue'
import CheckableListItem from '@/components/CheckableListItem.vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'

// ─── Date range ──────────────────────────────────────────────────────────────

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

function thisWeekRange() {
  const monday = getMondayOf(new Date())
  const sunday = new Date(monday)
  sunday.setDate(sunday.getDate() + 6)
  return { start: toDateStr(monday), end: toDateStr(sunday) }
}

const dateRange = ref(thisWeekRange())

// ─── Data ─────────────────────────────────────────────────────────────────────

const aggregated = ref([])
const byRecipe = ref([])
const loading = ref(false)
const error = ref(null)
const hasLoaded = ref(false)

// ─── View mode ───────────────────────────────────────────────────────────────

const viewMode = ref('aggregated') // 'aggregated' | 'by_recipe'

async function fetchList() {
  if (!dateRange.value.start || !dateRange.value.end) return

  loading.value = true
  error.value = null
  try {
    const res = await api.get('/shopping-list', {
      params: { start_date: dateRange.value.start, end_date: dateRange.value.end },
    })
    aggregated.value = res.data?.aggregated ?? []
    byRecipe.value   = res.data?.by_recipe ?? []
    checkedIds.value = loadChecked()
    hasLoaded.value = true
  } catch {
    error.value = 'Nem sikerült betölteni a bevásárlólistát.'
  } finally {
    loading.value = false
  }
}

watch(dateRange, fetchList, { immediate: true })

// ─── Checked state (frontend only, persisted to localStorage) ────────────────

const checkedIds = ref(new Set())

function storageKey() {
  return `sl_checked_${dateRange.value.start}_${dateRange.value.end}`
}

function saveChecked() {
  localStorage.setItem(storageKey(), JSON.stringify([...checkedIds.value]))
}

function loadChecked() {
  try {
    const raw = localStorage.getItem(storageKey())
    return raw ? new Set(JSON.parse(raw)) : new Set()
  } catch {
    return new Set()
  }
}

function toggle(id) {
  const next = new Set(checkedIds.value)
  next.has(id) ? next.delete(id) : next.add(id)
  checkedIds.value = next
  saveChecked()
}

function resetAll() {
  checkedIds.value = new Set()
  saveChecked()
}

const checkedCount = computed(() => {
  let n = 0
  for (const it of aggregated.value) {
    if (checkedIds.value.has(itemKey(it))) n++
  }
  return n
})
const totalCount = computed(() => aggregated.value.length)

const progress = computed(() =>
  totalCount.value === 0 ? 0 : (checkedCount.value / totalCount.value) * 100
)

const sortedAggregated = computed(() => {
  const unchecked = aggregated.value.filter(i => !checkedIds.value.has(itemKey(i)))
  const checked   = aggregated.value.filter(i =>  checkedIds.value.has(itemKey(i)))
  return [...unchecked, ...checked]
})

const hasAnyItems = computed(
  () => aggregated.value.length > 0 || byRecipe.value.length > 0
)

// ─── Range label ─────────────────────────────────────────────────────────────

const rangeLabel = computed(() => {
  const { start, end } = dateRange.value
  if (!start || !end) return ''
  const s = new Date(`${start}T12:00:00`).toLocaleDateString('hu-HU', { month: 'short', day: 'numeric' })
  const e = new Date(`${end}T12:00:00`).toLocaleDateString('hu-HU', { month: 'short', day: 'numeric' })
  return `${s} – ${e}`
})

// ─── Per-recipe helpers ──────────────────────────────────────────────────────

const MEAL_COLORS = {
  Reggeli: '#f59e0b',
  Tízórai: '#22c55e',
  'Ebéd':  '#e9692c',
  Uzsonna: '#0ea5e9',
  Vacsora: '#8b5cf6',
}

function planLabel(plan) {
  if (!plan.planned_date) return plan.meal_type ?? ''
  const d = new Date(`${plan.planned_date}T12:00:00`)
  const date = d.toLocaleDateString('hu-HU', { month: 'short', day: 'numeric' })
  return plan.meal_type ? `${date} · ${plan.meal_type}` : date
}

// Composite key for aggregated items: same ingredient can appear with diff units.
function itemKey(item) {
  return `${item.id}:${item.unit ?? ''}`
}

// Per-recipe key (namespaced to avoid collisions with aggregated view).
function recipeIngKey(recipeId, ing) {
  return `r${recipeId}:${ing.id}:${ing.unit ?? ''}`
}


// ─── Print ───────────────────────────────────────────────────────────────────

function printList() {
  window.print()
}
</script>

<template>
  <div class="sl-page">

    <!-- ── Header ──────────────────────────────────────────────────── -->
    <div class="sl-header">
      <div class="sl-title-block">
        <h1 class="sl-title">Bevásárlólista</h1>
        <p class="sl-subtitle">Az étrendedből automatikusan összeállítva</p>
      </div>

      <button
        v-if="hasAnyItems"
        class="print-btn no-print"
        @click="printList"
        aria-label="Nyomtatás"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <polyline points="6,9 6,2 18,2 18,9"/>
          <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/>
          <rect x="6" y="14" width="12" height="8"/>
        </svg>
        Nyomtatás
      </button>
    </div>

    <!-- ── Controls (picker only) ──────────────────────────────────── -->
    <div class="controls no-print">
      <div class="picker-card">
        <DateRangePicker v-model="dateRange" />
      </div>
    </div>

    <!-- ── Loading ─────────────────────────────────────────────────── -->
    <div v-if="loading" class="state-center">
      <LoadingSpinner />
    </div>

    <div v-else-if="error" class="state-center">
      <p class="error-text">{{ error }}</p>
      <button class="retry-btn" @click="fetchList">Újra</button>
    </div>

    <!-- ── Empty ───────────────────────────────────────────────────── -->
    <div v-else-if="hasLoaded && !hasAnyItems" class="empty-state">
      <div class="empty-icon" aria-hidden="true">🥦</div>
      <p class="empty-title">Nincs mit venni</p>
      <p class="empty-sub">Erre az időszakra nincs betervezett étkezés. Adj hozzá recepteket a <RouterLink to="/calendar" class="empty-link">naptárban</RouterLink>!</p>
    </div>

    <!-- ── Shared mode toolbar (stable position) ─────────────────── -->
    <div v-else-if="hasAnyItems" class="mode-toolbar no-print">
      <div class="view-toggle" role="tablist" aria-label="Nézet">
        <button
          class="view-pill"
          role="tab"
          :aria-selected="viewMode === 'aggregated'"
          :class="{ active: viewMode === 'aggregated' }"
          @click="viewMode = 'aggregated'"
        >Összes</button>
        <button
          class="view-pill"
          role="tab"
          :aria-selected="viewMode === 'by_recipe'"
          :class="{ active: viewMode === 'by_recipe' }"
          @click="viewMode = 'by_recipe'"
        >Receptenként</button>
      </div>
    </div>

    <!-- ── Print header (both modes) ─────────────────────────────── -->
    <div v-if="hasAnyItems" class="print-header print-only">
      <div class="print-head-top">
        <div class="print-logo">Cookr<span class="print-logo-dot">.</span></div>
        <p class="print-range">{{ rangeLabel }}</p>
      </div>
      <p class="print-title">Bevásárlólista</p>
    </div>

    <!-- ── Content: crossfade between modes ──────────────────────── -->
    <Transition name="mode-fade" mode="out-in">

      <!-- Aggregated -->
      <div
        v-if="hasLoaded && viewMode === 'aggregated' && aggregated.length"
        key="aggregated"
        class="mode-pane"
      >
        <div class="list-card">
          <div class="list-header no-print">
            <div class="progress-row">
              <span class="progress-label">
                <strong>{{ checkedCount }}</strong> / {{ totalCount }} cikk
              </span>
              <button
                v-if="checkedCount > 0"
                class="reset-btn"
                @click="resetAll"
              >
                Visszaállítás
              </button>
            </div>
            <div class="progress-track" role="progressbar" :aria-valuenow="checkedCount" :aria-valuemax="totalCount">
              <div class="progress-fill" :style="{ width: `${progress}%` }"></div>
            </div>
          </div>

          <TransitionGroup name="sl-item" tag="div" class="items-list no-print">
            <CheckableListItem
              v-for="(item, i) in sortedAggregated"
              :key="itemKey(item)"
              :item="item"
              :checked="checkedIds.has(itemKey(item))"
              :index="i"
              @toggle="() => toggle(itemKey(item))"
            />
          </TransitionGroup>

          <!-- Print-only ingredient list (reflects checked state) -->
          <ul class="print-only print-items" role="list">
            <li
              v-for="item in aggregated"
              :key="`p-agg-${itemKey(item)}`"
              class="print-item"
              :class="{ 'print-item-checked': checkedIds.has(itemKey(item)) }"
            >
              <span
                class="print-checkbox"
                :class="{ 'print-checkbox-checked': checkedIds.has(itemKey(item)) }"
                aria-hidden="true"
              >{{ checkedIds.has(itemKey(item)) ? '✓' : '' }}</span>
              <span class="print-name">{{ item.name }}</span>
              <span class="print-qty">
                {{ item.quantity % 1 === 0 ? item.quantity : item.quantity.toFixed(2) }}<span v-if="item.unit"> {{ item.unit }}</span>
              </span>
            </li>
          </ul>

          <Transition name="done-fade">
            <div v-if="checkedCount === totalCount && totalCount > 0" class="all-done no-print">
              <span>🎉</span> Minden megvan!
            </div>
          </Transition>
        </div>
      </div>

      <!-- By-recipe -->
      <div
        v-else-if="hasLoaded && viewMode === 'by_recipe' && byRecipe.length"
        key="by_recipe"
        class="mode-pane"
      >
        <div class="recipes-grid no-print">
          <section v-for="entry in byRecipe" :key="entry.recipe.id" class="recipe-card">
            <header class="recipe-head">
              <RouterLink
                :to="{ name: 'recipe-detail', params: { id: entry.recipe.id } }"
                class="recipe-thumb-link"
                :aria-label="entry.recipe.title"
              >
                <img v-if="entry.recipe.image_url"
                     :src="entry.recipe.image_url"
                     :alt="entry.recipe.title"
                     class="recipe-thumb"
                     loading="lazy" />
                <div v-else class="recipe-thumb recipe-thumb-fallback" aria-hidden="true">🍲</div>
              </RouterLink>

              <div class="recipe-meta">
                <RouterLink
                  :to="{ name: 'recipe-detail', params: { id: entry.recipe.id } }"
                  class="recipe-title"
                >{{ entry.recipe.title }}</RouterLink>

                <div class="recipe-plans">
                  <span
                    v-for="plan in entry.plans"
                    :key="plan.id"
                    class="plan-chip"
                    :style="{ '--dot': MEAL_COLORS[plan.meal_type] || 'var(--color-accent)' }"
                  >
                    {{ planLabel(plan) }}
                    <span v-if="plan.servings" class="plan-serv">· {{ plan.servings }} fő</span>
                  </span>
                </div>
              </div>
            </header>

            <div class="ings-list">
              <CheckableListItem
                v-for="(ing, ingIdx) in entry.ingredients"
                :key="recipeIngKey(entry.recipe.id, ing)"
                :item="ing"
                :checked="checkedIds.has(recipeIngKey(entry.recipe.id, ing))"
                :index="ingIdx"
                @toggle="() => toggle(recipeIngKey(entry.recipe.id, ing))"
              />
            </div>
          </section>
        </div>

        <!-- Print-only by-recipe layout -->
        <div class="print-only print-recipes">
          <section
            v-for="entry in byRecipe"
            :key="`p-r-${entry.recipe.id}`"
            class="print-recipe"
          >
            <h3 class="print-recipe-title">{{ entry.recipe.title }}</h3>
            <p class="print-recipe-meta">
              <span
                v-for="(plan, idx) in entry.plans"
                :key="plan.id"
              >
                <template v-if="idx > 0"> · </template>
                {{ planLabel(plan) }}<template v-if="plan.servings"> · {{ plan.servings }} fő</template>
              </span>
            </p>
            <ul class="print-items" role="list">
              <li
                v-for="ing in entry.ingredients"
                :key="`p-${entry.recipe.id}-${ing.id}-${ing.unit}`"
                class="print-item"
                :class="{ 'print-item-checked': checkedIds.has(recipeIngKey(entry.recipe.id, ing)) }"
              >
                <span
                  class="print-checkbox"
                  :class="{ 'print-checkbox-checked': checkedIds.has(recipeIngKey(entry.recipe.id, ing)) }"
                  aria-hidden="true"
                >{{ checkedIds.has(recipeIngKey(entry.recipe.id, ing)) ? '✓' : '' }}</span>
                <span class="print-name">{{ ing.name }}</span>
                <span class="print-qty">
                  {{ ing.quantity % 1 === 0 ? ing.quantity : ing.quantity.toFixed(2) }}<span v-if="ing.unit"> {{ ing.unit }}</span>
                </span>
              </li>
            </ul>
          </section>
        </div>
      </div>
    </Transition>

  </div>
</template>

<style scoped>
/* ── Page ──────────────────────────────────────────────────────── */
.sl-page {
  max-width: 1100px;
  margin: 0 auto;
  padding: 2rem 1.25rem 4rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

/* ── Header ────────────────────────────────────────────────────── */
.sl-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.sl-title {
  font-size: 1.625rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--color-text);
  line-height: 1.2;
}

.sl-subtitle {
  font-size: 0.875rem;
  color: var(--color-muted);
  margin-top: 0.2rem;
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

.print-btn svg { width: 1rem; height: 1rem; }

@media (hover: hover) and (pointer: fine) {
  .print-btn:hover {
    background: var(--color-surface-hover);
    border-color: var(--color-muted);
    color: var(--color-text);
  }
}

.print-btn:active { transform: scale(0.96); }

/* ── Controls ──────────────────────────────────────────────────── */
.controls {
  display: block;
}

.picker-card {
  background: var(--color-surface);
  border: 1.5px solid var(--color-stroke);
  border-radius: 1rem;
  padding: 1rem 1.125rem;
}

/* ── View toggle (compact, lives inside list-card / by-recipe toolbar) */
.view-toggle {
  display: inline-flex;
  background: var(--color-surface);
  border: 1px solid var(--color-stroke);
  border-radius: 999px;
  padding: 0.125rem;
  gap: 0.0625rem;
}

.view-pill {
  padding: 0.2rem 0.55rem;
  border-radius: 999px;
  border: none;
  background: transparent;
  font-size: 0.6875rem;
  font-weight: 700;
  color: var(--color-muted);
  cursor: pointer;
  white-space: nowrap;
  letter-spacing: 0.01em;
  transition:
    background 160ms ease,
    color 160ms ease,
    transform 160ms var(--ease-ui-out);
}

@media (hover: hover) and (pointer: fine) {
  .view-pill:not(.active):hover { color: var(--color-text); }
}

.view-pill.active {
  background: var(--color-bg);
  color: var(--color-text);
  box-shadow: 0 1px 2px rgba(0,0,0,0.04);
}

.view-pill:active { transform: scale(0.94); }

/* Shared, stable-position toolbar above mode content. */
.mode-toolbar {
  display: flex;
  justify-content: flex-end;
  max-width: 1100px;
  width: 100%;
  margin: 0 auto;
}

.mode-pane {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* Smooth crossfade between aggregated ↔ by-recipe. */
.mode-fade-enter-active,
.mode-fade-leave-active {
  transition: opacity 220ms var(--ease-ui-out), transform 220ms var(--ease-ui-out);
}
.mode-fade-enter-from { opacity: 0; transform: translateY(4px); }
.mode-fade-leave-to   { opacity: 0; transform: translateY(-4px); }

/* ── States ────────────────────────────────────────────────────── */
.state-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 3rem 0;
}

.error-text {
  font-size: 0.9rem;
  color: var(--color-danger);
}

.retry-btn {
  padding: 0.5rem 1.25rem;
  border-radius: 0.625rem;
  border: 1.5px solid var(--color-stroke);
  background: transparent;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-muted);
  cursor: pointer;
  transition: background 150ms ease, transform 150ms var(--ease-ui-out);
}

.retry-btn:hover { background: var(--color-surface); color: var(--color-text); }
.retry-btn:active { transform: scale(0.96); }

/* ── Empty state ───────────────────────────────────────────────── */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.625rem;
  padding: 3rem 1rem;
  text-align: center;
  animation: fadeIn 300ms var(--ease-ui-out) both;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

.empty-icon { font-size: 2.5rem; line-height: 1; margin-bottom: 0.25rem; }
.empty-title { font-size: 1.125rem; font-weight: 800; color: var(--color-text); }
.empty-sub {
  font-size: 0.875rem;
  color: var(--color-muted);
  max-width: 320px;
  line-height: 1.6;
}
.empty-link {
  color: var(--color-accent);
  font-weight: 700;
  text-decoration: underline;
  text-decoration-color: color-mix(in srgb, var(--color-accent) 40%, transparent);
  text-underline-offset: 3px;
}

/* ── Aggregated list card ──────────────────────────────────────── */
.list-card {
  max-width: 720px;
  width: 100%;
  margin: 0 auto;
  background: var(--color-bg);
  border: 1.5px solid var(--color-stroke);
  border-radius: 1rem;
  overflow: hidden;
  animation: fadeIn 300ms var(--ease-ui-out) both;
}

.list-header { padding: 0.875rem 1rem 0; }

.progress-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.progress-label { font-size: 0.8125rem; color: var(--color-muted); }
.progress-label strong { color: var(--color-text); font-weight: 800; }

.reset-btn {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--color-muted);
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0.1rem 0.25rem;
  border-radius: 0.25rem;
  transition: color 150ms ease;
  text-decoration: underline;
  text-decoration-color: transparent;
  text-underline-offset: 3px;
}
.reset-btn:hover {
  color: var(--color-accent);
  text-decoration-color: color-mix(in srgb, var(--color-accent) 50%, transparent);
}

.progress-track {
  height: 4px;
  background: var(--color-surface);
  border-radius: 999px;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: var(--color-chip);
  border-radius: 999px;
  transition: width 300ms var(--ease-ui-out);
}

.items-list { padding: 0.5rem 0.25rem; position: relative; }

.all-done {
  text-align: center;
  padding: 0.875rem;
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--color-chip);
  border-top: 1px solid var(--color-stroke);
}

.done-fade-enter-active { transition: opacity 300ms var(--ease-ui-out), transform 300ms var(--ease-ui-out); }
.done-fade-enter-from { opacity: 0; transform: translateY(6px); }

.sl-item-move { transition: transform 300ms var(--ease-ui-out); }

/* ── By-recipe view ────────────────────────────────────────────── */
.recipes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1rem;
  animation: fadeIn 300ms var(--ease-ui-out) both;
}

.recipe-card {
  background: var(--color-bg);
  border: 1.5px solid var(--color-stroke);
  border-radius: 1rem;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.recipe-head {
  display: flex;
  gap: 0.75rem;
  padding: 0.75rem;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-stroke);
}

.recipe-thumb-link {
  flex-shrink: 0;
  width: 3.25rem;
  height: 3.25rem;
  border-radius: 0.625rem;
  overflow: hidden;
  display: block;
  transition: transform 150ms var(--ease-ui-out);
}
.recipe-thumb-link:active { transform: scale(0.95); }

.recipe-thumb {
  width: 100%; height: 100%;
  object-fit: cover;
  display: block;
}
.recipe-thumb-fallback {
  display: flex; align-items: center; justify-content: center;
  background: var(--color-bg);
  border: 1px solid var(--color-stroke);
  font-size: 1.25rem;
  border-radius: 0.625rem;
}

.recipe-meta {
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.recipe-title {
  font-size: 0.95rem;
  font-weight: 800;
  color: var(--color-text);
  text-decoration: none;
  line-height: 1.3;
  overflow-wrap: anywhere;
  word-break: break-word;
  transition: color 150ms ease;
}
.recipe-title:hover { color: var(--color-accent); }

.recipe-plans {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}

.plan-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.7rem;
  font-weight: 600;
  padding: 0.15rem 0.5rem 0.15rem 0.375rem;
  border-radius: 999px;
  background: var(--color-bg);
  border: 1px solid var(--color-stroke);
  color: var(--color-muted);
}
.plan-chip::before {
  content: '';
  width: 6px; height: 6px;
  border-radius: 50%;
  background: var(--dot, var(--color-accent));
  flex-shrink: 0;
}
.plan-serv { font-weight: 700; color: var(--color-text); }

.ings-list {
  list-style: none;
  margin: 0;
  padding: 0.5rem 0.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.ing-row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  min-width: 0;
}

.ing-dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  background: var(--color-stroke);
  flex-shrink: 0;
}

.ing-name {
  flex: 1;
  min-width: 0;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-text);
  line-height: 1.3;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.ing-qty {
  display: inline-flex;
  align-items: baseline;
  gap: 0.2rem;
  flex-shrink: 0;
  white-space: nowrap;
}
.qty-num {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--color-text);
  font-variant-numeric: tabular-nums;
}
.qty-unit {
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--color-muted);
}

/* ── Print styles ──────────────────────────────────────────────── */
.print-only { display: none; }

@media print {
  .no-print { display: none !important; }
  .print-only { display: block !important; }
  ul.print-only { display: block !important; }

  /* Hide layout chrome */
  header, nav, footer { display: none !important; }

  @page {
    size: A4;
    margin: 14mm 14mm 16mm;
  }

  /* Reset page surface */
  html, body {
    background: #fff !important;
    color: #000 !important;
    font-family: 'Helvetica Neue', Arial, sans-serif;
    font-size: 11pt;
    line-height: 1.4;
  }

  .sl-page {
    padding: 0 !important;
    max-width: 100% !important;
    margin: 0 !important;
    gap: 0 !important;
    color: #000;
  }

  .sl-header { display: none !important; }

  /* Print header — clean banner */
  .print-header {
    padding: 0 0 8pt 0;
    border-bottom: 1.5pt solid #000;
    margin-bottom: 12pt;
  }
  .print-head-top {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 1rem;
  }
  .print-logo {
    font-size: 18pt;
    font-weight: 900;
    letter-spacing: -0.02em;
    color: #000;
    line-height: 1;
  }
  .print-logo-dot { color: #e9692c; }
  .print-range {
    font-size: 10pt;
    color: #444;
    font-weight: 600;
    margin: 0;
  }
  .print-title {
    font-size: 14pt;
    font-weight: 800;
    color: #000;
    margin: 6pt 0 0;
    letter-spacing: -0.01em;
  }

  /* Card chrome reset */
  .list-card {
    border: none !important;
    border-radius: 0 !important;
    max-width: 100% !important;
    background: transparent !important;
    overflow: visible !important;
  }

  /* Aggregated print list — two columns where possible */
  .print-items {
    list-style: none;
    margin: 0;
    padding: 0;
    column-count: 2;
    column-gap: 14mm;
    column-rule: 1px solid #e5e5e5;
  }
  .print-item {
    display: flex;
    align-items: baseline;
    gap: 6pt;
    padding: 3pt 0;
    border-bottom: 0.5pt dotted #bbb;
    break-inside: avoid;
    page-break-inside: avoid;
  }
  .print-checkbox {
    flex-shrink: 0;
    width: 9pt;
    height: 9pt;
    border: 1pt solid #000;
    border-radius: 1.5pt;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
    transform: translateY(1pt);
    /* Ensure black ink when browsers strip background colors in print. */
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .print-checkbox-checked {
    background: #000;
    color: #fff;
    font-size: 8pt;
    font-weight: 900;
  }
  .print-item-checked .print-name,
  .print-item-checked .print-qty {
    text-decoration: line-through;
    text-decoration-thickness: 0.7pt;
    color: #777 !important;
  }
  .print-name {
    flex: 1;
    min-width: 0;
    font-size: 10.5pt;
    color: #000;
    overflow-wrap: anywhere;
  }
  .print-qty {
    flex-shrink: 0;
    font-size: 10pt;
    font-weight: 700;
    color: #000;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }

  /* By-recipe print — stacked sections, single column per recipe */
  .print-recipes {
    display: block;
  }
  .print-recipe {
    margin-bottom: 10pt;
    padding-bottom: 6pt;
    break-inside: avoid;
    page-break-inside: avoid;
  }
  .print-recipe + .print-recipe {
    margin-top: 6pt;
    padding-top: 8pt;
    border-top: 0.5pt solid #ddd;
  }
  .print-recipe-title {
    font-size: 12pt;
    font-weight: 800;
    color: #000;
    margin: 0 0 2pt;
    letter-spacing: -0.005em;
  }
  .print-recipe-meta {
    font-size: 9pt;
    color: #555;
    margin: 0 0 5pt;
    font-weight: 500;
  }
  .print-recipe .print-items {
    column-count: 1;
    column-rule: none;
  }
}

/* ── Responsive ────────────────────────────────────────────────── */
@media (max-width: 640px) {
  .sl-page { padding: 1.25rem 1rem 3rem; }
  .sl-title { font-size: 1.375rem; }

  .view-toggle { align-self: stretch; justify-content: center; }
  .view-pill { flex: 1; }

  .recipes-grid { grid-template-columns: 1fr; }

  .recipe-thumb-link {
    width: 2.75rem;
    height: 2.75rem;
  }
  .recipe-title { font-size: 0.9rem; }
}
</style>
