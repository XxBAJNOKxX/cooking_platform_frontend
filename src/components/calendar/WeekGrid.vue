<script setup>
const props = defineProps({
  weekDays:    { type: Array,  required: true },
  mealsByDate: { type: Object, required: true },
  today:       { type: Date,   required: true },
})

const emit = defineEmits(['add', 'delete'])

const MEAL_TYPES  = ['Reggeli', 'Tízórai', 'Ebéd', 'Uzsonna', 'Vacsora']
const MEAL_COLORS = {
  Reggeli: '#f59e0b',
  Tízórai: '#22c55e',
  Ebéd:    '#e9692c',
  Uzsonna: '#0ea5e9',
  Vacsora: '#8b5cf6',
}
const DAY_ABBR = ['V', 'H', 'K', 'Sze', 'Cs', 'P', 'Szo']

function toDateStr(d) {
  const y  = d.getFullYear()
  const m  = String(d.getMonth() + 1).padStart(2, '0')
  const dy = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dy}`
}

const todayStr = toDateStr(new Date())

function isToday(d) {
  return toDateStr(d) === todayStr
}

function getMeals(day, type) {
  return (props.mealsByDate[toDateStr(day)] ?? []).filter(m => m.meal_type === type)
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
            'is-today':  isToday(day),
            'row-last':  i === weekDays.length - 1,
            'col-last':  type === MEAL_TYPES[MEAL_TYPES.length - 1],
          }"
          :style="{ '--i': i }"
        >
          <TransitionGroup name="meal" tag="div" class="slot-meals">
            <div
              v-for="meal in getMeals(day, type)"
              :key="meal.id"
              class="slot-card"
            >
              <span class="slot-title">{{ meal.recipe?.title ?? '–' }}</span>
              <button
                class="del-btn"
                @click.stop="emit('delete', meal.id)"
                aria-label="Törlés"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
                  <path d="M18 6L6 18M6 6l12 12" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
            </div>
          </TransitionGroup>

          <button
            class="slot-add"
            @click="emit('add', toDateStr(day), type)"
            aria-label="Étkezés hozzáadása"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
              <path d="M12 5v14M5 12h14" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>

      </template>
    </div>
  </div>
</template>

<style scoped>
/* ── Scroll wrapper ── */
.table-scroll {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  padding-bottom: 0.5rem;
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
.type-hdr.col-last { border-right: none; }

.type-dot {
  width: 7px; height: 7px;
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
.day-label.row-last { border-bottom: none; }
.day-label.is-today { background: color-mix(in srgb, var(--color-accent) 5%, var(--color-surface)); }

.day-abbr {
  font-size: 0.575rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-muted);
}
.day-label.is-today .day-abbr { color: var(--color-accent); }

.day-num {
  font-size: 0.9375rem;
  font-weight: 700;
  color: var(--color-text);
  width: 1.625rem; height: 1.625rem;
  display: flex; align-items: center; justify-content: center;
  border-radius: 999px;
  line-height: 1;
  transition: background 180ms ease, color 180ms ease;
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
.slot.col-last { border-right: none; }
.slot.row-last { border-bottom: none; }
.slot.is-today { background: color-mix(in srgb, var(--color-accent) 4%, var(--color-bg)); }

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
  display: flex; align-items: center; justify-content: center;
  width: 0.875rem; height: 0.875rem;
  flex-shrink: 0;
  margin-top: 0.1rem;
  border: none;
  background: transparent;
  color: var(--color-muted);
  border-radius: 0.2rem;
  cursor: pointer;
  padding: 0;
  transition: color 130ms ease, transform 130ms cubic-bezier(0.23, 1, 0.32, 1);
}
.del-btn svg { width: 0.5rem; height: 0.5rem; }

@media (hover: hover) and (pointer: fine) {
  .del-btn:hover { color: var(--color-danger); }
}
.del-btn:active { transform: scale(0.85); }

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
.slot-add svg { width: 0.625rem; height: 0.625rem; }

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
}

.slot-add:active { transform: scale(0.93); }

/* ── Entrance animation ── */
@keyframes rowIn {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ── Meal card transitions ── */
.meal-enter-active {
  transition: opacity 180ms cubic-bezier(0.23, 1, 0.32, 1), transform 180ms cubic-bezier(0.23, 1, 0.32, 1);
}
.meal-leave-active {
  transition: opacity 120ms ease-out;
  position: absolute;
  width: 100%;
}
.meal-enter-from { opacity: 0; transform: translateY(-3px) scale(0.97); }
.meal-leave-to   { opacity: 0; }
.meal-move       { transition: transform 180ms cubic-bezier(0.23, 1, 0.32, 1); }
</style>
