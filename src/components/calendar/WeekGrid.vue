<!-- Heti naptár táblázat (napok × étkezés-típusok). -->

<script setup>
import { ref } from 'vue'

const props = defineProps({
  weekDays: { type: Array, required: true },
  mealsByDate: { type: Object, required: true },
  today: { type: Date, required: true },
})

const emit = defineEmits(['add', 'delete', 'move'])

const MEAL_TYPES = ['Reggeli', 'Tízórai', 'Ebéd', 'Uzsonna', 'Vacsora']
const MEAL_COLORS = {
  Reggeli: '#f59e0b',
  Tízórai: '#22c55e',
  Ebéd: '#e9692c',
  Uzsonna: '#0ea5e9',
  Vacsora: '#8b5cf6',
}
const DAY_ABBR = ['V', 'H', 'K', 'Sze', 'Cs', 'P', 'Szo']

function toDateStr(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dy = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dy}`
}

const todayStr = toDateStr(new Date())

function isToday(d) {
  return toDateStr(d) === todayStr
}

function getMeals(day, type) {
  return (props.mealsByDate[toDateStr(day)] ?? []).filter((m) => m.meal_type === type)
}

// Drag & drop natív HTML5 API-val; dragId = épp húzott kártya, dropKey = aktuális drop célcella
const dragId = ref(null)
const dropKey = ref(null)

function onDragStart(e, meal) {
  dragId.value = meal.id
  e.dataTransfer.effectAllowed = 'move'
  e.dataTransfer.setData('text/plain', String(meal.id))
}

function onDragEnd() {
  dragId.value = null
  dropKey.value = null
}

function onCellDragOver(e) {
  if (dragId.value == null) return
  e.preventDefault()
  e.dataTransfer.dropEffect = 'move'
}

function onCellDragEnter(day, type) {
  if (dragId.value == null) return
  dropKey.value = `${toDateStr(day)}|${type}`
}

function onCellDragLeave(e, day, type) {
  // A leave event a gyerekekre lépéskor is tüzel — csak akkor töröljük, ha tényleg kivittük az egeret a cellából
  const r = e.currentTarget.getBoundingClientRect()
  if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) {
    const k = `${toDateStr(day)}|${type}`
    if (dropKey.value === k) dropKey.value = null
  }
}

function onCellDrop(day, type) {
  const id = dragId.value
  dragId.value = null
  dropKey.value = null
  if (id == null) return
  emit('move', { id, date: toDateStr(day), meal_type: type })
}

function cellKey(day, type) {
  return `${toDateStr(day)}|${type}`
}
</script>

<template>
  <div class="table-scroll">
    <div class="week-table">
      <!-- ── Header row ── -->
      <div class="corner"></div>
      <div
        v-for="type in MEAL_TYPES"
        :key="'hdr-' + type"
        class="type-hdr"
        :class="{ 'col-last': type === MEAL_TYPES[MEAL_TYPES.length - 1] }"
      >
        <span class="type-dot" :style="{ background: MEAL_COLORS[type] }"></span>
        <span class="type-name">{{ type }}</span>
      </div>

      <!-- ── Day rows ── -->
      <template v-for="(day, i) in weekDays" :key="toDateStr(day)">
        <div
          class="day-label"
          :class="{
            'is-today': isToday(day),
            'row-last': i === weekDays.length - 1,
          }"
          :style="{ '--i': i }"
        >
          <span class="day-abbr">{{ DAY_ABBR[day.getDay()] }}</span>
          <span class="day-num" :class="{ 'day-num--today': isToday(day) }">
            {{ day.getDate() }}
          </span>
        </div>

        <div
          v-for="type in MEAL_TYPES"
          :key="toDateStr(day) + '-' + type"
          class="slot"
          :class="{
            'is-today': isToday(day),
            'row-last': i === weekDays.length - 1,
            'col-last': type === MEAL_TYPES[MEAL_TYPES.length - 1],
            'is-empty': getMeals(day, type).length === 0,
            'is-drop': dropKey === cellKey(day, type),
          }"
          :style="{ '--i': i }"
          @dragover="onCellDragOver"
          @dragenter.prevent="onCellDragEnter(day, type)"
          @dragleave="onCellDragLeave($event, day, type)"
          @drop.prevent="onCellDrop(day, type)"
        >
          <template v-if="getMeals(day, type).length === 0">
            <button
              class="slot-add slot-add--full"
              @click="emit('add', toDateStr(day), type)"
              aria-label="Étkezés hozzáadása"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
                aria-hidden="true"
              >
                <path d="M12 5v14M5 12h14" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </button>
          </template>

          <template v-else>
            <TransitionGroup name="meal" tag="div" class="slot-meals">
              <div
                v-for="meal in getMeals(day, type)"
                :key="meal.id"
                class="slot-card"
                :class="{ 'is-dragging': dragId === meal.id }"
                draggable="true"
                @dragstart="onDragStart($event, meal)"
                @dragend="onDragEnd"
              >
                <span class="slot-title">{{ meal.recipe?.title ?? '–' }}</span>
                <span
                  v-if="meal.servings"
                  class="slot-servings"
                  :aria-label="`${meal.servings} adag`"
                >
                  {{ meal.servings }}<span class="slot-servings-unit">fő</span>
                </span>
                <button class="del-btn" @click.stop="emit('delete', meal.id)" aria-label="Törlés">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.5"
                    aria-hidden="true"
                  >
                    <path d="M18 6L6 18M6 6l12 12" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </button>
              </div>
            </TransitionGroup>

            <button
              class="slot-add"
              @click="emit('add', toDateStr(day), type)"
              aria-label="Étkezés hozzáadása"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
                aria-hidden="true"
              >
                <path d="M12 5v14M5 12h14" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </button>
          </template>
        </div>
      </template>
    </div>
  </div>

  <!-- Print-only table: <thead> repeats on each page, <tr> break-inside: avoid
       keeps each day on a single page. -->
  <table class="week-print-table print-only">
    <thead>
      <tr>
        <th class="wp-corner"></th>
        <th v-for="type in MEAL_TYPES" :key="'p-hdr-' + type" class="wp-type-hdr">
          {{ type }}
        </th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="day in weekDays" :key="'p-row-' + toDateStr(day)">
        <th class="wp-day-label">
          <span class="wp-day-abbr">{{ DAY_ABBR[day.getDay()] }}</span>
          <span class="wp-day-num">{{ day.getDate() }}</span>
        </th>
        <td
          v-for="type in MEAL_TYPES"
          :key="'p-cell-' + toDateStr(day) + '-' + type"
          class="wp-slot"
        >
          <div v-for="meal in getMeals(day, type)" :key="'p-meal-' + meal.id" class="wp-meal">
            <span class="wp-meal-title">{{ meal.recipe?.title ?? '–' }}</span>
            <span v-if="meal.servings" class="wp-meal-servings"> · {{ meal.servings }} fő</span>
          </div>
        </td>
      </tr>
    </tbody>
  </table>
</template>

<style scoped>
/* ── Scroll wrapper ── */
.table-scroll {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  padding-bottom: 0.5rem;
  max-width: 100%;
  scrollbar-width: thin;
  scrollbar-color: var(--color-stroke) transparent;
}
.table-scroll::-webkit-scrollbar {
  height: 6px;
}
.table-scroll::-webkit-scrollbar-track {
  background: transparent;
}
.table-scroll::-webkit-scrollbar-thumb {
  background: var(--color-stroke);
  border-radius: 999px;
}

/* ── Table grid ── */
.week-table {
  display: grid;
  grid-template-columns: 3.5rem repeat(5, minmax(140px, 1fr));
  min-width: 760px;
  border: 1.5px solid var(--color-stroke);
  border-radius: 1rem;
  overflow: hidden;
}

@media (max-width: 900px) {
  .week-table {
    grid-template-columns: 2.75rem repeat(5, minmax(110px, 1fr));
    min-width: 610px;
  }
}

@media (max-width: 640px) {
  .week-table {
    grid-template-columns: 2.5rem repeat(5, minmax(96px, 1fr));
    min-width: 535px;
  }
  .type-hdr {
    padding: 0.5rem 0.5rem;
    gap: 0.3rem;
  }
  .type-name {
    font-size: 0.6rem;
    letter-spacing: 0.05em;
  }
  .slot {
    padding: 0.3rem 0.3rem;
    min-height: 3.25rem;
  }
  .slot-title {
    font-size: 0.7rem;
  }
}

/* ── Corner ── */
.corner {
  background: var(--color-surface);
  border-right: 1.5px solid var(--color-stroke);
  border-bottom: 1.5px solid var(--color-stroke);
}

/* ── Type headers ── */
.type-hdr {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.625rem 0.75rem;
  background: var(--color-surface);
  border-bottom: 1.5px solid var(--color-stroke);
  border-right: 1px solid var(--color-stroke);
}
.type-hdr.col-last {
  border-right: none;
}

.type-dot {
  width: 7px;
  height: 7px;
  border-radius: 999px;
  flex-shrink: 0;
}

.type-name {
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: var(--color-muted);
}

/* ── Day labels ── */
.day-label {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.1rem;
  padding: 0.625rem 0;
  background: var(--color-surface);
  border-right: 1.5px solid var(--color-stroke);
  border-bottom: 1px solid var(--color-stroke);
  animation: rowIn 280ms cubic-bezier(0.23, 1, 0.32, 1) both;
  animation-delay: calc(var(--i) * 40ms);
}
.day-label.row-last {
  border-bottom: none;
}
.day-label.is-today {
  background: color-mix(in srgb, var(--color-accent) 5%, var(--color-surface));
}

.day-abbr {
  font-size: 0.575rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-muted);
}
.day-label.is-today .day-abbr {
  color: var(--color-accent);
}

.day-num {
  font-size: 0.9375rem;
  font-weight: 700;
  color: var(--color-text);
  width: 1.625rem;
  height: 1.625rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  line-height: 1;
  transition:
    background 180ms ease,
    color 180ms ease;
}
.day-num--today {
  background: var(--color-accent);
  color: var(--color-bg);
}

/* ── Slot cells ── */
.slot {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  padding: 0.375rem 0.4rem;
  min-height: 3.75rem;
  border-right: 1px solid var(--color-stroke);
  border-bottom: 1px solid var(--color-stroke);
  background: var(--color-bg);
  animation: rowIn 280ms cubic-bezier(0.23, 1, 0.32, 1) both;
  animation-delay: calc(var(--i) * 40ms);
  transition: background 180ms ease;
}
.slot.col-last {
  border-right: none;
}
.slot.row-last {
  border-bottom: none;
}
.slot.is-today {
  background: color-mix(in srgb, var(--color-accent) 4%, var(--color-bg));
}
.slot.is-drop {
  background: color-mix(in srgb, var(--color-accent) 12%, var(--color-bg));
  outline: 2px dashed var(--color-accent);
  outline-offset: -3px;
}

.slot-card {
  cursor: grab;
}
.slot-card:active {
  cursor: grabbing;
}
.slot-card.is-dragging {
  opacity: 0.35;
}

/* ── Slot meals ── */
.slot-meals {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  position: relative;
  flex: 1;
}

.slot-card {
  display: flex;
  align-items: flex-start;
  gap: 0.3rem;
  padding: 0.3rem 0.375rem;
  border-radius: 0.4rem;
  background: var(--color-surface);
  border: 1px solid var(--color-stroke);
  min-width: 0;
  transition: border-color 150ms ease;
}

@media (hover: hover) and (pointer: fine) {
  .slot-card:hover {
    border-color: color-mix(in srgb, var(--color-stroke) 50%, var(--color-muted));
  }
}

.slot-title {
  flex: 1;
  font-size: 0.73rem;
  font-weight: 600;
  color: var(--color-text);
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.del-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 0.875rem;
  height: 0.875rem;
  flex-shrink: 0;
  margin-top: 0.1rem;
  border: none;
  background: transparent;
  color: var(--color-muted);
  border-radius: 0.2rem;
  cursor: pointer;
  padding: 0;
  transition:
    color 130ms ease,
    transform 130ms cubic-bezier(0.23, 1, 0.32, 1);
}
.del-btn svg {
  width: 0.5rem;
  height: 0.5rem;
}

@media (hover: hover) and (pointer: fine) {
  .del-btn:hover {
    color: var(--color-danger);
  }
}
.del-btn:active {
  transform: scale(0.85);
}

/* ── Slot add button ── */
.slot-add {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 0.2rem;
  border: 1px dashed transparent;
  border-radius: 0.375rem;
  background: transparent;
  color: transparent;
  cursor: pointer;
  transition:
    border-color 160ms ease,
    color 160ms ease,
    background 160ms ease,
    transform 150ms cubic-bezier(0.23, 1, 0.32, 1);
}
.slot-add svg {
  width: 0.625rem;
  height: 0.625rem;
}

/* Full-cell variant: fills empty slot completely */
.slot-add--full {
  flex: 1;
  align-self: stretch;
  margin: -0.075rem;
  padding: 0.5rem;
  border-radius: 0.5rem;
}
.slot-add--full svg {
  width: 1rem;
  height: 1rem;
}

@media (hover: hover) and (pointer: fine) {
  .slot:hover .slot-add {
    color: var(--color-muted);
    border-color: var(--color-stroke);
  }
  .slot:hover .slot-add:hover {
    color: var(--color-accent);
    border-color: color-mix(in srgb, var(--color-accent) 50%, transparent);
    background: color-mix(in srgb, var(--color-accent) 8%, transparent);
  }
}

@media (hover: none) {
  .slot-add {
    color: var(--color-muted);
    border-color: var(--color-stroke);
  }
  .slot-add--full {
    color: color-mix(in srgb, var(--color-muted) 60%, transparent);
    border-color: color-mix(in srgb, var(--color-stroke) 70%, transparent);
  }
}

.slot-add:active {
  transform: scale(0.93);
}
.slot-add--full:active {
  transform: scale(0.97);
}

/* ── Servings badge on slot cards ── */
.slot-servings {
  display: inline-flex;
  align-items: baseline;
  gap: 1px;
  flex-shrink: 0;
  font-size: 0.65rem;
  font-weight: 700;
  color: var(--color-muted);
  padding: 1px 5px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--color-muted) 10%, transparent);
  line-height: 1.1;
}
.slot-servings-unit {
  font-size: 0.55rem;
  margin-left: 1px;
  opacity: 0.85;
}

/* ── Entrance animation ── */
@keyframes rowIn {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ── Meal card transitions ── */
.meal-enter-active {
  transition:
    opacity 180ms cubic-bezier(0.23, 1, 0.32, 1),
    transform 180ms cubic-bezier(0.23, 1, 0.32, 1);
}
.meal-leave-active {
  transition: opacity 120ms ease-out;
  position: absolute;
  width: 100%;
}
.meal-enter-from {
  opacity: 0;
  transform: translateY(-3px) scale(0.97);
}
.meal-leave-to {
  opacity: 0;
}
.meal-move {
  transition: transform 180ms cubic-bezier(0.23, 1, 0.32, 1);
}

/* ── Print-only table ──────────────────────────────────────────────
   The on-screen grid (.table-scroll) is hidden when printing; this table
   renders instead. <thead> repeats on every page, <tr>{break-inside:avoid}
   keeps each day on a single page — moves the whole day if it doesn't fit. */
.week-print-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 10pt;
}

@media print {
  .table-scroll {
    display: none !important;
  }

  .week-print-table {
    display: table !important;
  }
  .week-print-table thead {
    display: table-header-group;
  }
  .week-print-table tbody {
    display: table-row-group;
  }
  .week-print-table tr {
    page-break-inside: avoid;
    break-inside: avoid;
  }

  .week-print-table th,
  .week-print-table td {
    border: 0.5pt solid #999;
    padding: 4pt 6pt;
    vertical-align: top;
    text-align: left;
  }

  .week-print-table .wp-corner {
    width: 14mm;
    background: #f3f3f3;
    border-bottom: 1pt solid #000;
  }

  .week-print-table .wp-type-hdr {
    background: #f3f3f3;
    border-bottom: 1pt solid #000;
    font-size: 9pt;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    color: #000;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .week-print-table .wp-day-label {
    background: #f3f3f3;
    width: 14mm;
    font-weight: 700;
    color: #000;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .wp-day-abbr {
    display: block;
    font-size: 8pt;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: #555;
  }
  .wp-day-num {
    display: block;
    font-size: 14pt;
    font-weight: 800;
    line-height: 1;
  }

  .week-print-table .wp-slot {
    min-height: 14mm;
    background: #fff;
  }

  .wp-meal {
    font-size: 9.5pt;
    line-height: 1.3;
    padding: 1pt 0;
    break-inside: avoid;
  }
  .wp-meal + .wp-meal {
    border-top: 0.3pt dotted #ccc;
    margin-top: 2pt;
    padding-top: 2pt;
  }
  .wp-meal-title {
    font-weight: 600;
    color: #000;
  }
  .wp-meal-servings {
    color: #555;
    font-weight: 500;
  }
}
</style>
