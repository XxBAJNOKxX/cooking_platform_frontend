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

const items = ref([])
const loading = ref(false)
const error = ref(null)
const hasLoaded = ref(false)

async function fetchList() {
  if (!dateRange.value.start || !dateRange.value.end) return

  loading.value = true
  error.value = null
  try {
    const res = await api.get('/shopping-list', {
      params: { start_date: dateRange.value.start, end_date: dateRange.value.end },
    })
    items.value = (res.data ?? []).sort((a, b) => a.name.localeCompare(b.name, 'hu'))
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

const checkedCount = computed(() => checkedIds.value.size)
const totalCount = computed(() => items.value.length)

const progress = computed(() =>
  totalCount.value === 0 ? 0 : (checkedCount.value / totalCount.value) * 100
)

const sortedItems = computed(() => {
  const unchecked = items.value.filter(i => !checkedIds.value.has(i.id))
  const checked = items.value.filter(i => checkedIds.value.has(i.id))
  return [...unchecked, ...checked]
})

// ─── Range label ─────────────────────────────────────────────────────────────

const rangeLabel = computed(() => {
  const { start, end } = dateRange.value
  if (!start || !end) return ''
  const s = new Date(`${start}T12:00:00`).toLocaleDateString('hu-HU', { month: 'short', day: 'numeric' })
  const e = new Date(`${end}T12:00:00`).toLocaleDateString('hu-HU', { month: 'short', day: 'numeric' })
  return `${s} – ${e}`
})

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
        v-if="items.length"
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

    <!-- ── Date picker ─────────────────────────────────────────────── -->
    <div class="picker-card no-print">
      <DateRangePicker v-model="dateRange" />
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
    <div v-else-if="hasLoaded && items.length === 0" class="empty-state">
      <div class="empty-icon" aria-hidden="true">🥦</div>
      <p class="empty-title">Nincs mit venni</p>
      <p class="empty-sub">Erre az időszakra nincs betervezett étkezés. Adj hozzá recepteket a <RouterLink to="/calendar" class="empty-link">naptárban</RouterLink>!</p>
    </div>

    <!-- ── List ────────────────────────────────────────────────────── -->
    <div v-else-if="items.length" class="list-card">

      <!-- Progress bar (print: hidden) -->
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

      <!-- Print header (print only) -->
      <div class="print-header print-only">
        <div class="print-logo">Cookr<span class="print-logo-dot">.</span></div>
        <p class="print-title">Bevásárlólista</p>
        <p class="print-range">{{ rangeLabel }}</p>
      </div>

      <!-- Items -->
      <TransitionGroup name="sl-item" tag="div" class="items-list">
        <CheckableListItem
          v-for="(item, i) in sortedItems"
          :key="item.id"
          :item="item"
          :checked="checkedIds.has(item.id)"
          :index="i"
          @toggle="toggle"
        />
      </TransitionGroup>

      <!-- All done state -->
      <Transition name="done-fade">
        <div v-if="checkedCount === totalCount && totalCount > 0" class="all-done no-print">
          <span>🎉</span> Minden megvan!
        </div>
      </Transition>
    </div>

  </div>
</template>

<style scoped>
/* ── Page ──────────────────────────────────────────────────────── */
.sl-page {
  max-width: 680px;
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

/* ── Picker card ───────────────────────────────────────────────── */
.picker-card {
  background: var(--color-surface);
  border: 1.5px solid var(--color-stroke);
  border-radius: 1rem;
  padding: 1rem 1.125rem;
}

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

.empty-icon {
  font-size: 2.5rem;
  line-height: 1;
  margin-bottom: 0.25rem;
}

.empty-title {
  font-size: 1.125rem;
  font-weight: 800;
  color: var(--color-text);
}

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

/* ── List card ─────────────────────────────────────────────────── */
.list-card {
  background: var(--color-bg);
  border: 1.5px solid var(--color-stroke);
  border-radius: 1rem;
  overflow: hidden;
  animation: fadeIn 300ms var(--ease-ui-out) both;
}

/* ── Progress ──────────────────────────────────────────────────── */
.list-header {
  padding: 0.875rem 1rem 0;
}

.progress-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.progress-label {
  font-size: 0.8125rem;
  color: var(--color-muted);
}

.progress-label strong {
  color: var(--color-text);
  font-weight: 800;
}

.reset-btn {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--color-muted);
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0.1rem 0.25rem;
  border-radius: 0.25rem;
  transition: color 150ms ease, background 150ms ease;
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

/* ── Items ─────────────────────────────────────────────────────── */
.items-list {
  padding: 0.5rem 0.25rem;
  position: relative;
}

/* ── All done ──────────────────────────────────────────────────── */
.all-done {
  text-align: center;
  padding: 0.875rem;
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--color-chip);
  border-top: 1px solid var(--color-stroke);
}

.done-fade-enter-active {
  transition: opacity 300ms var(--ease-ui-out), transform 300ms var(--ease-ui-out);
}
.done-fade-enter-from {
  opacity: 0;
  transform: translateY(6px);
}

/* ── TransitionGroup: item reorder ────────────────────────────── */
.sl-item-move {
  transition: transform 300ms var(--ease-ui-out);
}

/* ── Print styles ──────────────────────────────────────────────── */
.print-only { display: none; }

.print-header {
  padding: 0.75rem 1rem 0;
}

.print-logo {
  font-size: 1.5rem;
  font-weight: 900;
  letter-spacing: -0.02em;
  color: #000;
  line-height: 1;
  margin-bottom: 0.125rem;
}

.print-logo-dot {
  color: #e9692c;
}

.print-title {
  font-size: 1rem;
  font-weight: 800;
  color: #000;
  margin: 0.1rem 0;
}

.print-range {
  font-size: 0.875rem;
  color: #555;
  font-weight: 600;
}

@media print {
  .no-print { display: none !important; }
  .print-only { display: block !important; }

  header, nav { display: none !important; }

  .sl-page {
    padding: 0;
    max-width: 100%;
    gap: 0.5rem;
  }

  .sl-title {
    font-size: 1.25rem;
    color: #000;
  }

  .list-card {
    border: none;
    border-radius: 0;
  }

  .items-list {
    padding: 0;
  }
}

/* ── Responsive ────────────────────────────────────────────────── */
@media (max-width: 640px) {
  .sl-page { padding: 1.25rem 1rem 3rem; }
  .sl-title { font-size: 1.375rem; }
}
</style>
