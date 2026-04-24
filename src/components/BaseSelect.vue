<!-- Általános legördülő select custom megjelenéssel. -->

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  modelValue: { type: [String, Number, null], default: '' },
  options: {
    type: Array,
    required: true,
  },
  placeholder: { type: String, default: '' },
  title: { type: String, default: '' },
  size: { type: String, default: 'md' },
})

const emit = defineEmits(['update:modelValue'])

const open = ref(false)
const triggerRef = ref(null)
const panelRef = ref(null)
const panelPos = ref({ top: 0, left: 0, width: 0 })

const normalized = computed(() =>
  props.options.map((o) =>
    typeof o === 'object' && o !== null ? o : { value: o, label: String(o) },
  ),
)

const selectedLabel = computed(() => {
  const found = normalized.value.find((o) => o.value === props.modelValue)
  return found ? found.label : ''
})

function toggle() {
  if (open.value) {
    open.value = false
    return
  }
  const rect = triggerRef.value?.getBoundingClientRect()
  if (rect) {
    panelPos.value = {
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
    }
  }
  open.value = true
}

function pick(option) {
  emit('update:modelValue', option.value)
  open.value = false
}

function onDocClick(e) {
  if (!open.value) return
  const inTrigger = triggerRef.value?.contains(e.target)
  const inPanel = panelRef.value?.contains(e.target)
  if (!inTrigger && !inPanel) open.value = false
}

onMounted(() => document.addEventListener('click', onDocClick))
onBeforeUnmount(() => document.removeEventListener('click', onDocClick))
</script>

<template>
  <button
    ref="triggerRef"
    type="button"
    class="bsel-trigger"
    :class="['bsel-trigger--' + size, { 'bsel-trigger--open': open }]"
    :title="title"
    @click.stop="toggle"
  >
    <span class="bsel-label" :class="{ 'bsel-placeholder': !selectedLabel }">
      {{ selectedLabel || placeholder }}
    </span>
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2.5"
      class="bsel-chev"
      aria-hidden="true"
    >
      <polyline points="6,9 12,15 18,9" />
    </svg>
  </button>

  <Teleport to="body">
    <div
      v-if="open"
      ref="panelRef"
      class="bsel-panel"
      :style="{
        position: 'fixed',
        top: panelPos.top + 'px',
        left: panelPos.left + 'px',
        width: panelPos.width + 'px',
      }"
      role="listbox"
    >
      <button
        v-for="o in normalized"
        :key="o.value ?? '_empty'"
        type="button"
        class="bsel-option"
        :class="{ 'bsel-option--active': o.value === modelValue }"
        role="option"
        @mousedown.prevent="pick(o)"
      >
        {{ o.label }}
      </button>
    </div>
  </Teleport>
</template>

<style scoped>
.bsel-trigger {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  padding: 6px 10px;
  border-radius: 8px;
  border: 1.5px solid var(--color-stroke);
  background: var(--color-bg);
  color: var(--color-text);
  font-size: 0.8rem;
  font-family: inherit;
  font-weight: 600;
  cursor: pointer;
  outline: none;
  box-sizing: border-box;
  transition:
    border-color 150ms var(--ease-ui-out),
    box-shadow 150ms var(--ease-ui-out),
    background 150ms var(--ease-ui-out);
}

.bsel-trigger--sm {
  padding: 4px 8px;
  font-size: 0.78rem;
}

.bsel-trigger:hover {
  border-color: color-mix(in srgb, var(--color-stroke) 60%, var(--color-accent));
}

.bsel-trigger--open,
.bsel-trigger:focus-visible {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 1px var(--color-accent);
}

.bsel-label {
  flex: 1;
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.bsel-placeholder {
  color: var(--color-muted);
  font-weight: 500;
}

.bsel-chev {
  width: 11px;
  height: 11px;
  color: var(--color-muted);
  flex-shrink: 0;
  transition: transform 160ms var(--ease-ui-out);
}

.bsel-trigger--open .bsel-chev {
  transform: rotate(180deg);
}

.bsel-panel {
  z-index: 9999;
  border: 1.5px solid var(--color-stroke);
  border-radius: 10px;
  background: var(--color-bg);
  box-shadow: 0 8px 24px -4px rgba(47, 30, 23, 0.16);
  overflow: hidden;
  max-height: 240px;
  overflow-y: auto;
  animation: bselDropIn 140ms var(--ease-ui-out) both;
}

@keyframes bselDropIn {
  from {
    opacity: 0;
    transform: translateY(-4px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

.bsel-option {
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

.bsel-option:last-child {
  border-bottom: none;
}

.bsel-option:hover {
  background: var(--color-surface);
}

.bsel-option--active {
  color: var(--color-accent);
  font-weight: 700;
  background: color-mix(in srgb, var(--color-accent) 7%, transparent);
}
</style>
