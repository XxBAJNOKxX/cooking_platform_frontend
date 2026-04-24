<!-- Kategória multi-select + új kategória létrehozás a szerkesztőben. -->

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import api from '@/services/api'

const props = defineProps({
  modelValue: { type: Array, required: true }, // selected category ids
  categories: { type: Array, default: () => [] }, // { id, name }[]
  loading: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'update:categories'])

const query = ref('')
const dropdown = ref(false)
const creating = ref(false)
const wrapRef = ref(null)

const selectedCats = computed(() => props.categories.filter((c) => props.modelValue.includes(c.id)))

const filteredCats = computed(() => {
  const q = query.value.trim().toLowerCase()
  const selected = new Set(props.modelValue)
  const pool = props.categories.filter((c) => !selected.has(c.id))
  if (!q) return pool
  return pool.filter((c) => c.name.toLowerCase().includes(q))
})

const queryExists = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return false
  return props.categories.some((c) => c.name.toLowerCase() === q)
})

const showCreateBtn = computed(() => query.value.trim() && !queryExists.value && !creating.value)

function onInput(e) {
  query.value = e.target.value
  dropdown.value = true
}

function onFocus() {
  dropdown.value = true
}

function selectCategory(cat) {
  if (!props.modelValue.includes(cat.id)) {
    emit('update:modelValue', [...props.modelValue, cat.id])
  }
  query.value = ''
  dropdown.value = false
}

function removeCategory(id) {
  emit(
    'update:modelValue',
    props.modelValue.filter((i) => i !== id),
  )
}

async function createAndSelect() {
  const name = query.value.trim()
  if (!name || creating.value) return
  creating.value = true
  try {
    const { data } = await api.post('/categories', { name })
    const cat = data.data
    if (!props.categories.some((c) => c.id === cat.id)) {
      emit('update:categories', [...props.categories, cat])
    }
    selectCategory(cat)
  } finally {
    creating.value = false
  }
}

function onDocClick(e) {
  if (wrapRef.value && !wrapRef.value.contains(e.target)) {
    dropdown.value = false
  }
}

onMounted(() => document.addEventListener('click', onDocClick))
onBeforeUnmount(() => document.removeEventListener('click', onDocClick))
</script>

<template>
  <div class="rce-root" ref="wrapRef">
    <!-- Selected chips -->
    <div v-if="selectedCats.length" class="rce-selected">
      <span v-for="cat in selectedCats" :key="cat.id" class="rce-chip">
        {{ cat.name }}
        <button
          type="button"
          class="rce-chip-rm"
          @click="removeCategory(cat.id)"
          :aria-label="`${cat.name} eltávolítása`"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            aria-hidden="true"
          >
            <path d="M18 6L6 18M6 6l12 12" stroke-linecap="round" />
          </svg>
        </button>
      </span>
    </div>

    <!-- Search input -->
    <div class="rce-search-box" :class="{ 'rce-search-box--open': dropdown }">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2.2"
        class="rce-ico"
        aria-hidden="true"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" stroke-linecap="round" />
      </svg>
      <input
        :value="query"
        @input="onInput"
        @focus="onFocus"
        type="text"
        class="rce-input"
        placeholder="Kategória keresése…"
        autocomplete="off"
      />
      <svg
        v-if="loading"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2.2"
        class="rce-spinner"
        aria-hidden="true"
      >
        <path
          d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"
          stroke-linecap="round"
        />
      </svg>
    </div>

    <!-- Dropdown -->
    <div v-if="dropdown && (filteredCats.length || showCreateBtn)" class="rce-dropdown">
      <button
        v-for="cat in filteredCats"
        :key="cat.id"
        type="button"
        class="rce-option"
        @mousedown.prevent
        @click="selectCategory(cat)"
      >
        {{ cat.name }}
      </button>

      <button
        v-if="showCreateBtn"
        type="button"
        class="rce-option rce-option--create"
        @mousedown.prevent
        @click="createAndSelect"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          aria-hidden="true"
        >
          <path d="M12 5v14M5 12h14" stroke-linecap="round" />
        </svg>
        <span
          >Új kategória: <strong>{{ query.trim() }}</strong></span
        >
      </button>
    </div>
  </div>
</template>

<style scoped>
.rce-root {
  display: flex;
  flex-direction: column;
  gap: 8px;
  position: relative;
}

/* ── Selected chips ── */
.rce-selected {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.rce-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px 4px 12px;
  border-radius: 20px;
  background: color-mix(in srgb, var(--color-accent) 12%, transparent);
  border: 1.5px solid color-mix(in srgb, var(--color-accent) 35%, transparent);
  color: var(--color-accent);
  font-size: 0.8rem;
  font-weight: 600;
}

.rce-chip-rm {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border: none;
  background: transparent;
  color: currentColor;
  cursor: pointer;
  padding: 0;
  opacity: 0.7;
  border-radius: 50%;
  transition: opacity 150ms;
}
.rce-chip-rm:hover {
  opacity: 1;
}
.rce-chip-rm svg {
  width: 10px;
  height: 10px;
}

/* ── Search box ── */
.rce-search-box {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 14px;
  border-radius: 12px;
  border: 1.5px solid var(--color-stroke);
  background: var(--color-bg);
  transition:
    border-color 150ms var(--ease-ui-out),
    box-shadow 150ms var(--ease-ui-out);
}
.rce-search-box:focus-within,
.rce-search-box--open {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 1px var(--color-accent);
}

.rce-ico {
  width: 15px;
  height: 15px;
  color: var(--color-muted);
  flex-shrink: 0;
}

.rce-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  color: var(--color-text);
  font-size: 0.875rem;
  font-family: inherit;
}
.rce-input::placeholder {
  color: var(--color-muted);
}

@keyframes rceSpin {
  to {
    transform: rotate(360deg);
  }
}
.rce-spinner {
  width: 15px;
  height: 15px;
  color: var(--color-accent);
  flex-shrink: 0;
  animation: rceSpin 0.8s linear infinite;
}

/* ── Dropdown ── */
.rce-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  z-index: 50;
  border: 1.5px solid var(--color-stroke);
  border-radius: 12px;
  background: var(--color-bg);
  box-shadow: 0 8px 28px -6px rgba(47, 30, 23, 0.16);
  overflow: hidden;
  max-height: 220px;
  overflow-y: auto;
  animation: rceDropIn 160ms var(--ease-ui-out) both;
}

@keyframes rceDropIn {
  from {
    opacity: 0;
    transform: translateY(-6px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

.rce-option {
  display: block;
  width: 100%;
  padding: 10px 14px;
  text-align: left;
  border: none;
  border-bottom: 1px solid var(--color-stroke);
  background: transparent;
  color: var(--color-text);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 120ms var(--ease-ui-out);
  font-family: inherit;
}
.rce-option:last-child {
  border-bottom: none;
}
.rce-option:hover {
  background: var(--color-surface);
}

.rce-option--create {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--color-accent);
  font-weight: 600;
  background: color-mix(in srgb, var(--color-accent) 5%, transparent);
}
.rce-option--create svg {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}
.rce-option--create strong {
  font-weight: 700;
}
.rce-option--create:hover {
  background: color-mix(in srgb, var(--color-accent) 12%, transparent);
}
</style>
