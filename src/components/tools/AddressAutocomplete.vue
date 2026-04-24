<!-- Cím autocomplete mezők (ország/megye/város/utca) — geocoding backed. -->

<script setup>
import { ref, watch, onBeforeUnmount } from 'vue'
import { searchAddress, debounceCancellable } from '@/services/geocoding'

const props = defineProps({
  modelValue: { type: String, default: '' },
  label: { type: String, default: 'Cím keresése' },
  placeholder: { type: String, default: 'Kezdd el beírni a címet…' },
  error: { type: String, default: '' },
})

const emit = defineEmits(['update:modelValue', 'select'])

const query = ref(props.modelValue ?? '')
const results = ref([])
const open = ref(false)
const loading = ref(false)
const highlight = ref(-1)
const inputEl = ref(null)

watch(
  () => props.modelValue,
  (v) => {
    if (v !== query.value) query.value = v ?? ''
  },
)

const runSearch = debounceCancellable(async (signal, q) => {
  loading.value = true
  try {
    const r = await searchAddress(q, { signal, countryCodes: 'hu', limit: 6 })
    results.value = r
    highlight.value = r.length ? 0 : -1
  } catch (e) {
    if (e?.name !== 'AbortError') {
      console.warn('[geocoding]', e)
      results.value = []
    }
  } finally {
    loading.value = false
  }
}, 350)

function onInput(e) {
  const v = e.target.value
  query.value = v
  emit('update:modelValue', v)
  if (v.trim().length < 3) {
    results.value = []
    open.value = false
    return
  }
  open.value = true
  runSearch(v)
}

function pick(hit) {
  query.value = hit.displayName
  emit('update:modelValue', hit.displayName)
  emit('select', hit)
  open.value = false
  results.value = []
}

function onKeydown(e) {
  if (!open.value || results.value.length === 0) return
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    highlight.value = (highlight.value + 1) % results.value.length
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    highlight.value = (highlight.value - 1 + results.value.length) % results.value.length
  } else if (e.key === 'Enter') {
    if (highlight.value >= 0) {
      e.preventDefault()
      pick(results.value[highlight.value])
    }
  } else if (e.key === 'Escape') {
    open.value = false
  }
}

function onBlur() {
  // Delay so click events on suggestions fire first.
  setTimeout(() => {
    open.value = false
  }, 150)
}

onBeforeUnmount(() => runSearch.cancel?.())
</script>

<template>
  <div class="aac">
    <label v-if="label" class="aac-label">
      <span>{{ label }}</span>
      <span v-if="error" class="aac-err">{{ error }}</span>
    </label>

    <div class="aac-wrap">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        class="aac-icon"
        aria-hidden="true"
      >
        <path d="M21 21l-4.35-4.35" stroke-linecap="round" />
        <circle cx="11" cy="11" r="7" />
      </svg>

      <input
        ref="inputEl"
        type="text"
        class="aac-input"
        :class="{ 'aac-input-err': error }"
        :value="query"
        :placeholder="placeholder"
        autocomplete="off"
        spellcheck="false"
        @input="onInput"
        @keydown="onKeydown"
        @focus="open = results.length > 0"
        @blur="onBlur"
      />

      <div v-if="loading" class="aac-spinner" aria-hidden="true" />

      <ul v-if="open && results.length" class="aac-list" role="listbox">
        <li
          v-for="(hit, i) in results"
          :key="hit.osmId"
          class="aac-item"
          :class="{ 'is-active': i === highlight }"
          role="option"
          :aria-selected="i === highlight"
          @mousedown.prevent="pick(hit)"
          @mouseenter="highlight = i"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            class="aac-pin"
            aria-hidden="true"
          >
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <span class="aac-item-text">{{ hit.displayName }}</span>
        </li>
      </ul>
    </div>

    <p class="aac-hint">Adatforrás: OpenStreetMap</p>
  </div>
</template>

<style scoped>
.aac {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  width: 100%;
}

.aac-label {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-muted);
}
.aac-err {
  color: var(--color-danger);
  font-size: 0.75rem;
  font-weight: 600;
}

.aac-wrap {
  position: relative;
}

.aac-icon {
  position: absolute;
  left: 0.875rem;
  top: 50%;
  width: 1.05rem;
  height: 1.05rem;
  transform: translateY(-50%);
  color: var(--color-muted);
  pointer-events: none;
}

.aac-input {
  width: 100%;
  padding: 0.625rem 1rem 0.625rem 2.5rem;
  border-radius: 0.5rem;
  border: 1px solid var(--color-stroke);
  background: var(--color-bg);
  color: var(--color-text);
  font-size: 0.95rem;
  outline: none;
  transition:
    box-shadow 150ms var(--ease-ui-out),
    border-color 150ms var(--ease-ui-out);
}
.aac-input:focus {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-accent) 30%, transparent);
}
.aac-input-err {
  border-color: var(--color-danger);
}

.aac-spinner {
  position: absolute;
  right: 0.875rem;
  top: 50%;
  width: 0.9rem;
  height: 0.9rem;
  border: 2px solid var(--color-stroke);
  border-top-color: var(--color-accent);
  border-radius: 999px;
  transform: translateY(-50%);
  animation: aacSpin 0.6s linear infinite;
}
@keyframes aacSpin {
  to {
    transform: translateY(-50%) rotate(360deg);
  }
}

.aac-list {
  position: absolute;
  top: calc(100% + 0.375rem);
  left: 0;
  right: 0;
  background: var(--color-bg);
  border: 1px solid var(--color-stroke);
  border-radius: 0.625rem;
  box-shadow: 0 20px 40px -18px rgba(47, 30, 23, 0.22);
  overflow: hidden;
  z-index: 30;
  max-height: 19rem;
  overflow-y: auto;
  list-style: none;
  margin: 0;
  padding: 0.25rem;
  animation: aacPop 180ms var(--ease-ui-out) both;
}
@keyframes aacPop {
  from {
    opacity: 0;
    transform: translateY(-4px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

@starting-style {
  .aac-list {
    opacity: 0;
    transform: translateY(-4px);
  }
}

.aac-item {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.55rem 0.625rem;
  border-radius: 0.45rem;
  cursor: pointer;
  font-size: 0.85rem;
  color: var(--color-text);
  line-height: 1.35;
  transition: background 120ms var(--ease-ui-out);
}
.aac-item.is-active,
.aac-item:hover {
  background: color-mix(in srgb, var(--color-accent) 12%, transparent);
}

.aac-pin {
  flex-shrink: 0;
  width: 0.95rem;
  height: 0.95rem;
  color: var(--color-accent);
}

.aac-item-text {
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.aac-hint {
  margin: 0;
  font-size: 0.7rem;
  color: var(--color-muted);
  opacity: 0.7;
}
</style>
