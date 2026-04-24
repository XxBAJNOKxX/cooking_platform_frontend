<!-- Naptár egy napjának egy étkezés-cellája (drag-drop target). -->

<script setup>
defineProps({
  date: { type: Date, required: true },
  meals: { type: Array, default: () => [] },
  isToday: { type: Boolean, default: false },
  index: { type: Number, default: 0 },
})

const emit = defineEmits(['add', 'delete'])

const MEAL_COLORS = {
  Reggeli: '#f59e0b',
  Tízórai: '#22c55e',
  Ebéd: '#e9692c',
  Uzsonna: '#0ea5e9',
  Vacsora: '#8b5cf6',
}

function toDateStr(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const mealColor = (type) => MEAL_COLORS[type] ?? '#9ca3af'
</script>

<template>
  <div class="day-cell" :class="{ 'is-today': isToday }" :style="{ '--i': index }">
    <!-- Meal list -->
    <div class="meals-wrap">
      <TransitionGroup name="meal" tag="div" class="meal-list">
        <div v-for="meal in meals" :key="meal.id" class="meal-card">
          <span class="meal-dot" :style="{ background: mealColor(meal.meal_type) }"></span>
          <div class="meal-info">
            <span class="meal-title">{{ meal.recipe?.title ?? '–' }}</span>
            <span class="meal-type">{{ meal.meal_type }}</span>
          </div>
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

      <div v-if="!meals.length" class="empty-hint">Nincs étkezés</div>
    </div>

    <!-- Add button -->
    <button class="add-btn" @click="emit('add', toDateStr(date))">
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
  </div>
</template>

<style scoped>
.day-cell {
  display: flex;
  flex-direction: column;
  min-height: 200px;
  background: var(--color-surface);
  border: 1.5px solid var(--color-stroke);
  border-radius: 0.875rem;
  overflow: hidden;
  animation: cellIn 320ms var(--ease-ui-out) both;
  animation-delay: calc(var(--i) * 35ms);
  transition: border-color 200ms ease;
}

@keyframes cellIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.day-cell.is-today {
  border-color: var(--color-accent);
  background: color-mix(in srgb, var(--color-accent) 5%, var(--color-surface));
}

/* ── Meals ── */
.meals-wrap {
  flex: 1;
  padding: 0.625rem 0.625rem 0.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.meal-list {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  position: relative;
}

.meal-card {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.5rem;
  border-radius: 0.5rem;
  background: var(--color-bg);
  border: 1px solid var(--color-stroke);
  min-width: 0;
  transition:
    border-color 150ms ease,
    box-shadow 150ms ease;
}

.meal-card:hover {
  border-color: color-mix(in srgb, var(--color-stroke) 70%, var(--color-muted));
  box-shadow: 0 1px 4px -1px rgba(47, 30, 23, 0.08);
}

.meal-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  flex-shrink: 0;
}

.meal-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.05rem;
}

.meal-title {
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.3;
}

.meal-type {
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--color-muted);
  line-height: 1;
}

.del-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.25rem;
  height: 1.25rem;
  flex-shrink: 0;
  border: none;
  background: transparent;
  color: var(--color-muted);
  border-radius: 0.25rem;
  cursor: pointer;
  padding: 0;
  transition:
    color 130ms ease,
    background 130ms ease,
    transform 130ms var(--ease-ui-out);
}

.del-btn svg {
  width: 0.625rem;
  height: 0.625rem;
}

@media (hover: hover) and (pointer: fine) {
  .del-btn:hover {
    color: var(--color-danger);
    background: color-mix(in srgb, var(--color-danger) 10%, transparent);
  }
}

.del-btn:active {
  transform: scale(0.85);
}

.empty-hint {
  font-size: 0.72rem;
  color: var(--color-muted);
  opacity: 0.55;
  text-align: center;
  padding: 0.5rem 0;
}

/* ── Add button ── */
.add-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 0.5rem;
  border: none;
  border-top: 1px dashed var(--color-stroke);
  background: transparent;
  color: var(--color-muted);
  cursor: pointer;
  flex-shrink: 0;
  transition:
    background 160ms ease,
    color 160ms ease,
    transform 150ms var(--ease-ui-out);
}

.add-btn svg {
  width: 0.875rem;
  height: 0.875rem;
}

@media (hover: hover) and (pointer: fine) {
  .add-btn:hover {
    background: color-mix(in srgb, var(--color-accent) 8%, transparent);
    color: var(--color-accent);
  }
}

.add-btn:active {
  transform: scale(0.97);
}

/* ── Meal transitions ── */
.meal-enter-active {
  transition:
    opacity 200ms var(--ease-ui-out),
    transform 200ms var(--ease-ui-out);
}
.meal-leave-active {
  transition: opacity 140ms ease-out;
  position: absolute;
  width: 100%;
}
.meal-enter-from {
  opacity: 0;
  transform: translateY(-4px) scale(0.97);
}
.meal-leave-to {
  opacity: 0;
}
.meal-move {
  transition: transform 200ms var(--ease-ui-out);
}
</style>
