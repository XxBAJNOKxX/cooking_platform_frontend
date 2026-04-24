<!-- Receptlista szűrő oldalsáv (idő, nehézség, kategória, kedvenc). -->

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import BaseInput from '@/components/BaseInput.vue'

const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
  categories: { type: Array, default: () => [] },
  categoriesLoading: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue'])

const MAX_TIME_MINUTES = 180

const local = ref({ ...props.modelValue })
let searchTimer = null
let timeTimer = null
const mobileOpen = ref(false)
const catOpen = ref(false)
const catSearch = ref('')
const catDropRef = ref(null)
const catOptionsRef = ref(null)
const catSearchRef = ref(null)

watch(
  () => props.modelValue,
  (v) => {
    if (JSON.stringify(v) !== JSON.stringify(local.value)) {
      local.value = { ...v }
    }
  },
  { deep: true },
)

function patch(key, val) {
  local.value[key] = val
  emit('update:modelValue', { ...local.value })
}

function onSearch(val) {
  local.value.search = val
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => emit('update:modelValue', { ...local.value }), 320)
}

const filteredCategories = computed(() => {
  const q = catSearch.value.trim().toLowerCase()
  if (!q) return props.categories
  return props.categories.filter((c) => c.name.toLowerCase().includes(q))
})

const selectedCats = computed(() => {
  const raw = local.value.category ?? ''
  if (!raw) return []
  return String(raw)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
})

function toggleCategory(name) {
  const current = selectedCats.value
  const next = current.includes(name) ? current.filter((c) => c !== name) : [...current, name]
  patch('category', next.join(','))
}

function clearCategories() {
  catOpen.value = false
  catSearch.value = ''
  patch('category', '')
}

function openCatDropdown() {
  catOpen.value = !catOpen.value
  if (catOpen.value) {
    catSearch.value = ''
    setTimeout(() => catSearchRef.value?.focus(), 50)
  }
}

function toggleDifficulty(d) {
  patch('difficulty', local.value.difficulty === d ? '' : d)
}

function onTimeInput(e) {
  const val = Number(e.target.value)
  local.value.max_time = val >= MAX_TIME_MINUTES ? '' : val
  clearTimeout(timeTimer)
  timeTimer = setTimeout(() => emit('update:modelValue', { ...local.value }), 400)
}

function reset() {
  clearTimeout(searchTimer)
  clearTimeout(timeTimer)
  catOpen.value = false
  catSearch.value = ''
  local.value = { search: '', category: '', difficulty: '', max_time: '' }
  emit('update:modelValue', { ...local.value })
}

function onDocClick(e) {
  if (catDropRef.value && !catDropRef.value.contains(e.target)) {
    catOpen.value = false
  }
}

const activeCount = computed(() => {
  let n = 0
  if (local.value.search) n++
  n += selectedCats.value.length
  if (local.value.difficulty) n++
  if (local.value.max_time) n++
  return n
})

const sliderPct = computed(() => {
  const v = Number(local.value.max_time) || MAX_TIME_MINUTES
  return ((v - 5) / (MAX_TIME_MINUTES - 5)) * 100
})

onMounted(() => {
  document.addEventListener('click', onDocClick)
})

onUnmounted(() => {
  document.removeEventListener('click', onDocClick)
  clearTimeout(searchTimer)
  clearTimeout(timeTimer)
})

const DIFFICULTIES = [
  { key: 'Könnyű', cls: 'easy' },
  { key: 'Közepes', cls: 'medium' },
  { key: 'Nehéz', cls: 'hard' },
]
</script>

<template>
  <div class="fsb-root">
    <!-- Mobile toggle -->
    <button class="fsb-toggle" @click="mobileOpen = !mobileOpen" :aria-expanded="mobileOpen">
      <span class="fsb-toggle-inner">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.2"
          class="fsb-icon"
          aria-hidden="true"
        >
          <path d="M3 6h18M7 12h10M11 18h2" stroke-linecap="round" />
        </svg>
        Szűrők
        <span v-if="activeCount" class="fsb-badge">{{ activeCount }}</span>
      </span>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2.5"
        class="fsb-chevron"
        :class="{ open: mobileOpen }"
        aria-hidden="true"
      >
        <polyline points="6,9 12,15 18,9" />
      </svg>
    </button>

    <!-- Sidebar panel -->
    <div class="fsb-panel" :class="{ 'fsb-panel-open': mobileOpen }">
      <!-- Desktop title row -->
      <div class="fsb-hdr">
        <h3 class="fsb-hdr-title">
          Szűrők
          <span v-if="activeCount" class="fsb-badge-inline">{{ activeCount }}</span>
        </h3>
        <button v-if="activeCount" class="fsb-reset" @click="reset">Törlés</button>
      </div>

      <!-- Search -->
      <div class="fsb-section">
        <p class="fsb-label">Keresés</p>
        <BaseInput
          :model-value="local.search"
          @update:model-value="onSearch"
          type="search"
          placeholder="Cím vagy leírás..."
        />
      </div>

      <!-- Category custom dropdown -->
      <div class="fsb-section">
        <p class="fsb-label">Kategória</p>

        <!-- Selected category chips (each removable) -->
        <div v-if="selectedCats.length" class="cat-chips">
          <button
            v-for="name in selectedCats"
            :key="`chip-${name}`"
            type="button"
            class="cat-chip"
            :aria-label="`${name} eltávolítása`"
            @click.stop="toggleCategory(name)"
          >
            <span>{{ name }}</span>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="3"
              class="cat-chip-x"
              aria-hidden="true"
            >
              <path d="M18 6L6 18M6 6l12 12" stroke-linecap="round" />
            </svg>
          </button>
        </div>

        <div class="cat-dd" ref="catDropRef">
          <button
            type="button"
            class="cat-trigger"
            :class="{ 'cat-trigger--active': selectedCats.length > 0 }"
            :disabled="categoriesLoading"
            :aria-expanded="catOpen"
            @click="openCatDropdown"
          >
            <span class="cat-trigger-text">
              {{
                categoriesLoading
                  ? 'Betöltés…'
                  : selectedCats.length
                    ? 'További kategória hozzáadása'
                    : 'Összes kategória'
              }}
            </span>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              class="cat-chev"
              :class="{ open: catOpen }"
              aria-hidden="true"
            >
              <polyline points="6,9 12,15 18,9" />
            </svg>
          </button>

          <div v-show="catOpen" class="cat-options" role="listbox" ref="catOptionsRef">
            <div class="cat-search-wrap">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.2"
                class="cat-search-ico"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" stroke-linecap="round" />
              </svg>
              <input
                ref="catSearchRef"
                v-model="catSearch"
                type="text"
                class="cat-search-input"
                placeholder="Keresés…"
                autocomplete="off"
                @keydown.esc="catOpen = false"
              />
            </div>
            <div class="cat-list">
              <button
                type="button"
                class="cat-option cat-option-all"
                :class="{ on: selectedCats.length === 0 }"
                role="option"
                @mousedown.prevent
                @click="clearCategories"
              >
                Összes kategória
              </button>
              <button
                v-for="cat in filteredCategories"
                :key="cat.id"
                type="button"
                class="cat-option"
                :class="{ on: selectedCats.includes(cat.name) }"
                role="option"
                :aria-pressed="selectedCats.includes(cat.name)"
                @mousedown.prevent
                @click="toggleCategory(cat.name)"
              >
                <span class="cat-check" aria-hidden="true">
                  <svg
                    v-if="selectedCats.includes(cat.name)"
                    viewBox="0 0 12 10"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.2"
                  >
                    <path d="M1 5l3.5 3.5L11 1" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </span>
                {{ cat.name }}
              </button>
              <p v-if="catSearch && filteredCategories.length === 0" class="cat-no-result">
                Nincs találat
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Difficulty -->
      <div class="fsb-section">
        <p class="fsb-label">Nehézség</p>
        <div class="chip-row">
          <button
            v-for="d in DIFFICULTIES"
            :key="d.key"
            class="chip"
            :class="[`diff-${d.cls}`, { on: local.difficulty === d.key }]"
            @click="toggleDifficulty(d.key)"
          >
            {{ d.key }}
          </button>
        </div>
      </div>

      <!-- Max time slider -->
      <div class="fsb-section fsb-section-last">
        <div class="fsb-label-row">
          <p class="fsb-label">Max. elkészítési idő</p>
          <span v-if="local.max_time" class="fsb-time-val">{{ local.max_time }} perc</span>
        </div>
        <input
          type="range"
          min="5"
          :max="MAX_TIME_MINUTES"
          step="5"
          :value="local.max_time || MAX_TIME_MINUTES"
          @input="onTimeInput"
          class="fsb-range"
          :style="{ '--pct': `${sliderPct}%` }"
          aria-label="Maximális elkészítési idő"
        />
        <div class="fsb-range-labels">
          <span>5 perc</span>
          <span>3+ óra</span>
        </div>
      </div>

      <!-- Mobile reset -->
      <div v-if="activeCount" class="fsb-mobile-reset">
        <button class="fsb-reset-btn" @click="reset">Szűrők törlése</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.fsb-root {
  width: 100%;
}

/* ---- Mobile toggle ---- */
.fsb-toggle {
  display: none;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  padding: 11px 16px;
  border-radius: 14px;
  border: 1.5px solid var(--color-stroke);
  background: var(--color-bg);
  cursor: pointer;
  transition:
    background 150ms var(--ease-ui-out),
    transform 150ms var(--ease-ui-out);
}
.fsb-toggle:hover {
  background: var(--color-surface);
}
.fsb-toggle:active {
  transform: scale(0.98);
}

.fsb-toggle-inner {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--color-text);
}

.fsb-icon {
  width: 15px;
  height: 15px;
  color: var(--color-accent);
  flex-shrink: 0;
}

.fsb-chevron {
  width: 15px;
  height: 15px;
  color: var(--color-muted);
  flex-shrink: 0;
  transition: transform 250ms var(--ease-ui-out);
}
.fsb-chevron.open {
  transform: rotate(180deg);
}

/* ---- Badge ---- */
.fsb-badge,
.fsb-badge-inline {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 20px;
  font-size: 0.68rem;
  font-weight: 800;
  background: var(--color-accent);
  color: #fff;
  flex-shrink: 0;
}

/* ---- Panel ---- */
.fsb-panel {
  display: flex;
  flex-direction: column;
}

/* ---- Desktop header ---- */
.fsb-hdr {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 22px;
}

.fsb-hdr-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1rem;
  font-weight: 800;
  color: var(--color-text);
  margin: 0;
}

.fsb-reset {
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--color-accent);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  transition: color 150ms;
}
.fsb-reset:hover {
  color: var(--color-accent-hover);
}

/* ---- Sections ---- */
.fsb-section {
  padding-bottom: 20px;
  margin-bottom: 20px;
  border-bottom: 1.5px solid var(--color-stroke);
}
.fsb-section-last {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.fsb-label {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--color-muted);
  margin: 0 0 10px;
}

.fsb-label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}
.fsb-label-row .fsb-label {
  margin-bottom: 0;
}

.fsb-time-val {
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--color-accent);
  padding: 2px 7px;
  border-radius: 6px;
  background: color-mix(in srgb, var(--color-accent) 10%, transparent);
}

/* ---- Selected category chips ---- */
.cat-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 8px;
}

.cat-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 4px 3px 10px;
  border-radius: 999px;
  border: 1.5px solid var(--color-accent);
  background: color-mix(in srgb, var(--color-accent) 10%, transparent);
  color: var(--color-accent);
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
  transition:
    background 150ms var(--ease-ui-out),
    transform 150ms var(--ease-ui-out);
}

.cat-chip:hover {
  background: color-mix(in srgb, var(--color-accent) 18%, transparent);
}

.cat-chip:active {
  transform: scale(0.95);
}

.cat-chip-x {
  width: 14px;
  height: 14px;
  padding: 2px;
  border-radius: 50%;
  color: var(--color-accent);
  flex-shrink: 0;
}

.cat-chip:hover .cat-chip-x {
  background: color-mix(in srgb, var(--color-accent) 20%, transparent);
}

/* ---- Category custom dropdown ---- */
.cat-dd {
  position: relative;
}

.cat-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 9px 12px 9px 13px;
  border-radius: 10px;
  border: 1.5px solid var(--color-stroke);
  background: var(--color-bg);
  color: var(--color-text);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  text-align: left;
  outline: none;
  transition:
    border-color 150ms var(--ease-ui-out),
    box-shadow 150ms var(--ease-ui-out);
}
.cat-trigger:hover:not(:disabled) {
  border-color: var(--color-accent-soft);
}
.cat-trigger:focus {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 1px var(--color-accent);
}
.cat-trigger:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
.cat-trigger--active {
  border-color: var(--color-accent);
  color: var(--color-accent);
  font-weight: 600;
}

.cat-trigger-text {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cat-chev {
  width: 14px;
  height: 14px;
  color: var(--color-muted);
  flex-shrink: 0;
  margin-left: 8px;
  transition: transform 250ms var(--ease-ui-out);
}
.cat-chev.open {
  transform: rotate(180deg);
}

.cat-options {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  z-index: 60;
  border: 1.5px solid var(--color-stroke);
  border-radius: 12px;
  background: var(--color-bg);
  box-shadow: 0 8px 24px -6px rgba(47, 30, 23, 0.14);
  overflow: hidden;
  max-height: 260px;
  display: flex;
  flex-direction: column;
}

.cat-search-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--color-stroke);
  flex-shrink: 0;
}

.cat-search-ico {
  width: 13px;
  height: 13px;
  color: var(--color-muted);
  flex-shrink: 0;
}

.cat-search-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  color: var(--color-text);
  font-size: 0.825rem;
  font-family: inherit;
}
.cat-search-input::placeholder {
  color: var(--color-muted);
}

.cat-no-result {
  padding: 10px 13px;
  font-size: 0.8rem;
  color: var(--color-muted);
  font-style: italic;
  margin: 0;
}

.cat-list {
  overflow-y: auto;
  flex: 1;
  min-height: 0;
}

.cat-option {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 9px 13px;
  text-align: left;
  border: none;
  border-bottom: 1px solid var(--color-stroke);
  background: transparent;
  color: var(--color-text);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 120ms var(--ease-ui-out);
}
.cat-option:last-child {
  border-bottom: none;
}
.cat-option:hover {
  background: var(--color-surface);
}
.cat-option.on {
  color: var(--color-accent);
  font-weight: 700;
  background: color-mix(in srgb, var(--color-accent) 6%, transparent);
}

.cat-check {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  flex-shrink: 0;
  border: 1.5px solid var(--color-stroke);
  border-radius: 3px;
  background: var(--color-bg);
  color: #fff;
}
.cat-option.on .cat-check {
  background: var(--color-accent);
  border-color: var(--color-accent);
}
.cat-check svg {
  width: 9px;
  height: 9px;
}

.cat-option-all {
  font-weight: 700;
  padding-left: 13px;
}

/* ---- Difficulty chips ---- */
.chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.chip {
  display: inline-flex;
  align-items: center;
  padding: 5px 13px;
  border-radius: 20px;
  font-size: 0.79rem;
  font-weight: 600;
  border: 1.5px solid var(--color-stroke);
  background: transparent;
  color: var(--color-muted);
  cursor: pointer;
  transition:
    border-color 150ms var(--ease-ui-out),
    background 150ms var(--ease-ui-out),
    color 150ms var(--ease-ui-out),
    transform 150ms var(--ease-ui-out);
}
.chip:hover {
  background: var(--color-surface);
  color: var(--color-text);
}
.chip:active {
  transform: scale(0.93);
}

.diff-easy.on {
  border-color: #5b7f43;
  background: color-mix(in srgb, #5b7f43 11%, transparent);
  color: #3b5c28;
}
.diff-medium.on {
  border-color: #d97706;
  background: color-mix(in srgb, #d97706 11%, transparent);
  color: #7c4f08;
}
.diff-hard.on {
  border-color: #d94b4b;
  background: color-mix(in srgb, #d94b4b 11%, transparent);
  color: #8b1f1f;
}

/* ---- Range slider ---- */
.fsb-range {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 4px;
  border-radius: 4px;
  background: linear-gradient(
    to right,
    var(--color-accent) var(--pct, 100%),
    var(--color-stroke) var(--pct, 100%)
  );
  outline: none;
  cursor: pointer;
  margin-bottom: 7px;
}

.fsb-range::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--color-accent);
  border: 2.5px solid #fff;
  box-shadow: 0 1px 5px rgba(0, 0, 0, 0.18);
  cursor: pointer;
  transition: transform 150ms var(--ease-ui-out);
}
.fsb-range::-webkit-slider-thumb:hover {
  transform: scale(1.22);
}
.fsb-range::-webkit-slider-thumb:active {
  transform: scale(1.1);
}

.fsb-range::-moz-range-thumb {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--color-accent);
  border: 2.5px solid #fff;
  box-shadow: 0 1px 5px rgba(0, 0, 0, 0.18);
  cursor: pointer;
}

.fsb-range-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.69rem;
  color: var(--color-muted);
  font-weight: 500;
}

/* ---- Mobile reset ---- */
.fsb-mobile-reset {
  display: none;
  padding-top: 14px;
}

.fsb-reset-btn {
  width: 100%;
  padding: 10px;
  border-radius: 10px;
  border: 1.5px solid var(--color-stroke);
  background: transparent;
  color: var(--color-muted);
  font-size: 0.875rem;
  font-weight: 700;
  cursor: pointer;
  transition:
    background 150ms var(--ease-ui-out),
    color 150ms var(--ease-ui-out),
    transform 150ms var(--ease-ui-out);
}
.fsb-reset-btn:hover {
  background: var(--color-surface);
  color: var(--color-text);
}
.fsb-reset-btn:active {
  transform: scale(0.97);
}

/* ---- Mobile responsive ---- */
@media (max-width: 767px) {
  .fsb-toggle {
    display: flex;
  }
  .fsb-hdr {
    display: none;
  }

  .fsb-panel {
    max-height: 0;
    overflow: hidden;
    opacity: 0;
    margin-top: 0;
    transition:
      max-height 320ms var(--ease-drawer),
      opacity 250ms var(--ease-ui-out),
      margin-top 250ms var(--ease-ui-out);
  }

  .fsb-panel.fsb-panel-open {
    max-height: 900px;
    opacity: 1;
    margin-top: 10px;
    padding: 16px;
    border: 1.5px solid var(--color-stroke);
    border-radius: 16px;
    background: var(--color-bg);
  }

  .fsb-mobile-reset {
    display: block;
  }
}
</style>
