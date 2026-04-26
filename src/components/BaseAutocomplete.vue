<!-- Általános autocomplete input egyedi érték beírás támogatással. -->

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'

const props = defineProps({
  modelValue: { type: String, default: '' },
  options: { type: Array, required: true },
  placeholder: { type: String, default: '' },
  allowCustom: { type: Boolean, default: true },
  customLabel: { type: String, default: 'Egyéni:' },
  hasError: { type: Boolean, default: false },
  emptyText: { type: String, default: '' },
})

const emit = defineEmits(['update:modelValue', 'select', 'custom'])

const open = ref(false)
const query = ref(props.modelValue ?? '')
const rootRef = ref(null)
const inputRef = ref(null)
const panelRef = ref(null)
const panelPos = ref({ top: 0, left: 0, width: 0 })

function updatePanelPos() {
  const el = inputRef.value
  if (!el) return
  const r = el.getBoundingClientRect()
  panelPos.value = { top: r.bottom + 4, left: r.left, width: r.width }
}

watch(
  () => props.modelValue,
  (v) => {
    if (v !== query.value) query.value = v ?? ''
  },
)

watch(open, async (o) => {
  if (!o) return
  await nextTick()
  updatePanelPos()
})

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return props.options
  return props.options.filter((o) => o.toLowerCase().includes(q))
})

const isCustomMatch = computed(() => {
  const q = query.value.trim()
  if (!q || !props.allowCustom) return false
  return !props.options.some((o) => o.toLowerCase() === q.toLowerCase())
})

function onInput(e) {
  query.value = e.target.value
  emit('update:modelValue', query.value)
  open.value = true
}

function onFocus() {
  open.value = true
}

function pickOption(value) {
  query.value = value
  emit('update:modelValue', value)
  emit('select', value)
  open.value = false
  inputRef.value?.blur()
}

function pickCustom() {
  const name = query.value.trim()
  if (!name) return
  emit('update:modelValue', name)
  emit('custom', name)
  open.value = false
  inputRef.value?.blur()
}

// Click-outside listener `mousedown`-on (focus változás előtt) — így nincs blur/click race condition
// Mind a root (trigger) elemet, mind a teleportált panelt ellenőrizzük
function onDocMouseDown(e) {
  if (!open.value) return
  const inTrigger = rootRef.value?.contains(e.target)
  const inPanel = panelRef.value?.contains(e.target)
  if (!inTrigger && !inPanel) {
    open.value = false
    emit('update:modelValue', query.value.trim())
  }
}

// Görgetés / resize esetén újrapozícionáljuk a teleportált panelt
function onReposition() {
  if (open.value) updatePanelPos()
}

onMounted(() => {
  document.addEventListener('mousedown', onDocMouseDown)
  window.addEventListener('scroll', onReposition, true)
  window.addEventListener('resize', onReposition)
})
onBeforeUnmount(() => {
  document.removeEventListener('mousedown', onDocMouseDown)
  window.removeEventListener('scroll', onReposition, true)
  window.removeEventListener('resize', onReposition)
})

defineExpose({
  focus: () => inputRef.value?.focus(),
  clear: () => {
    query.value = ''
    emit('update:modelValue', '')
  },
})
</script>

<template>
  <div ref="rootRef" class="bac-root">
    <input
      ref="inputRef"
      :value="query"
      :placeholder="placeholder"
      :class="['bac-input', { 'bac-input--err': hasError }]"
      autocomplete="off"
      spellcheck="false"
      @input="onInput"
      @focus="onFocus"
      @keydown.enter.prevent="isCustomMatch ? pickCustom() : (open = false)"
      @keydown.esc="open = false"
    />
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2.5"
      class="bac-chev"
      aria-hidden="true"
    >
      <polyline points="6,9 12,15 18,9" />
    </svg>
  </div>

  <Teleport to="body">
    <div
      v-if="open && (filtered.length || isCustomMatch || emptyText)"
      ref="panelRef"
      class="bac-panel"
      role="listbox"
      :style="{
        top: panelPos.top + 'px',
        left: panelPos.left + 'px',
        width: panelPos.width + 'px',
      }"
    >
      <button
        v-for="o in filtered"
        :key="o"
        type="button"
        class="bac-option"
        role="option"
        @click="pickOption(o)"
      >
        {{ o }}
      </button>

      <button
        v-if="isCustomMatch"
        type="button"
        class="bac-option bac-option--custom"
        @click="pickCustom"
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
          >{{ customLabel }} <strong>{{ query.trim() }}</strong></span
        >
      </button>

      <p v-if="!filtered.length && !isCustomMatch && emptyText" class="bac-empty">
        {{ emptyText }}
      </p>
    </div>
  </Teleport>
</template>

<style scoped>
.bac-root {
  position: relative;
  width: 100%;
}

.bac-input {
  width: 100%;
  padding: 6px 26px 6px 10px;
  border-radius: 8px;
  border: 1.5px solid var(--color-stroke);
  background: var(--color-bg);
  color: var(--color-text);
  font-size: 0.8rem;
  font-family: inherit;
  outline: none;
  box-sizing: border-box;
  transition:
    border-color 150ms var(--ease-ui-out),
    box-shadow 150ms var(--ease-ui-out);
}

.bac-input:focus {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 1px var(--color-accent);
}

.bac-input--err {
  border-color: var(--color-danger);
}

.bac-chev {
  position: absolute;
  right: 7px;
  top: 50%;
  transform: translateY(-50%);
  width: 11px;
  height: 11px;
  color: var(--color-muted);
  pointer-events: none;
}

.bac-panel {
  position: fixed;
  z-index: 9999;
  border: 1.5px solid var(--color-stroke);
  border-radius: 10px;
  background: var(--color-bg);
  box-shadow: 0 8px 24px -4px rgba(47, 30, 23, 0.16);
  overflow: hidden;
  max-height: 220px;
  overflow-y: auto;
  animation: bacDropIn 140ms var(--ease-ui-out) both;
}

@keyframes bacDropIn {
  from {
    opacity: 0;
    transform: translateY(-4px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

.bac-option {
  display: block;
  width: 100%;
  padding: 8px 12px;
  text-align: left;
  border: none;
  border-bottom: 1px solid var(--color-stroke);
  background: transparent;
  color: var(--color-text);
  font-size: 0.825rem;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  transition: background 120ms var(--ease-ui-out);
}

.bac-option:last-child {
  border-bottom: none;
}

.bac-option:hover {
  background: var(--color-surface);
}

.bac-option--custom {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--color-accent);
  font-weight: 600;
  background: color-mix(in srgb, var(--color-accent) 5%, transparent);
}

.bac-option--custom svg {
  width: 12px;
  height: 12px;
  flex-shrink: 0;
}

.bac-option--custom strong {
  font-weight: 700;
}

.bac-option--custom:hover {
  background: color-mix(in srgb, var(--color-accent) 12%, transparent);
}

.bac-empty {
  margin: 0;
  padding: 10px 12px;
  font-size: 0.8rem;
  color: var(--color-muted);
  text-align: center;
}
</style>
