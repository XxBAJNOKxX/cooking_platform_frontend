<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({ start: '', end: '' }),
  },
})

const emit = defineEmits(['update:modelValue'])

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

function weekRange(mondayOffset = 0) {
  const monday = getMondayOf(new Date())
  monday.setDate(monday.getDate() + mondayOffset * 7)
  const sunday = new Date(monday)
  sunday.setDate(sunday.getDate() + 6)
  return { start: toDateStr(monday), end: toDateStr(sunday) }
}

const PRESETS = [
  { label: 'Ez a hét',       range: () => weekRange(0) },
  { label: 'Következő hét',  range: () => weekRange(1) },
  { label: '2 hét',          range: () => {
    const r0 = weekRange(0)
    const r1 = weekRange(1)
    return { start: r0.start, end: r1.end }
  }},
]

const activePreset = computed(() => {
  for (const p of PRESETS) {
    const r = p.range()
    if (r.start === props.modelValue.start && r.end === props.modelValue.end) return p.label
  }
  return null
})

function applyPreset(p) {
  emit('update:modelValue', p.range())
}

function onStartChange(e) {
  emit('update:modelValue', { ...props.modelValue, start: e.target.value })
}

function onEndChange(e) {
  emit('update:modelValue', { ...props.modelValue, end: e.target.value })
}
</script>

<template>
  <div class="drp">
    <div class="presets">
      <button
        v-for="p in PRESETS"
        :key="p.label"
        class="preset-btn"
        :class="{ active: activePreset === p.label }"
        @click="applyPreset(p)"
      >
        {{ p.label }}
      </button>
    </div>

    <div class="date-inputs">
      <div class="date-field">
        <label class="date-label" for="drp-start">Kezdés</label>
        <input
          id="drp-start"
          type="date"
          class="date-input"
          :value="modelValue.start"
          @change="onStartChange"
        />
      </div>

      <div class="date-sep" aria-hidden="true">
        <svg viewBox="0 0 24 6" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M0 3h24" stroke-dasharray="3 2"/>
        </svg>
      </div>

      <div class="date-field">
        <label class="date-label" for="drp-end">Vége</label>
        <input
          id="drp-end"
          type="date"
          class="date-input"
          :value="modelValue.end"
          :min="modelValue.start"
          @change="onEndChange"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.drp {
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
}

/* ── Presets ── */
.presets {
  display: flex;
  gap: 0.375rem;
  flex-wrap: wrap;
}

.preset-btn {
  padding: 0.3rem 0.875rem;
  border-radius: 999px;
  border: 1.5px solid var(--color-stroke);
  background: transparent;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-muted);
  cursor: pointer;
  transition:
    background 150ms ease,
    border-color 150ms ease,
    color 150ms ease,
    transform 150ms var(--ease-ui-out);
}

.preset-btn.active {
  background: var(--color-accent);
  border-color: var(--color-accent);
  color: var(--color-bg);
}

@media (hover: hover) and (pointer: fine) {
  .preset-btn:not(.active):hover {
    border-color: var(--color-muted);
    color: var(--color-text);
    background: var(--color-surface);
  }
}

.preset-btn:active { transform: scale(0.94); }

/* ── Date inputs ── */
.date-inputs {
  display: flex;
  align-items: flex-end;
  gap: 0.5rem;
}

.date-field {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  flex: 1;
}

.date-label {
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--color-muted);
}

.date-input {
  width: 100%;
  padding: 0.55rem 0.75rem;
  border-radius: 0.625rem;
  border: 1.5px solid var(--color-stroke);
  background: var(--color-bg);
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text);
  outline: none;
  cursor: pointer;
  transition: border-color 150ms ease, box-shadow 150ms ease;
}

.date-input:focus {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-accent) 14%, transparent);
}

.date-sep {
  width: 1.25rem;
  flex-shrink: 0;
  padding-bottom: 0.55rem;
  color: var(--color-stroke);
}

.date-sep svg { width: 100%; }

@media (max-width: 480px) {
  .date-inputs { flex-direction: column; }
  .date-sep { display: none; }
}
</style>
