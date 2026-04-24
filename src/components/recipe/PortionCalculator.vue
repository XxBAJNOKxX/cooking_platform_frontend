<!-- Adag-skálázó (plusz/mínusz gombokkal). -->

<template>
  <div class="portion-calc">
    <span class="label">Adagok</span>
    <div class="controls">
      <button
        class="ctrl-btn"
        type="button"
        :disabled="portions <= 1"
        @click="decrease"
        aria-label="Csökkentés"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="M5 12h14" stroke-linecap="round" />
        </svg>
      </button>
      <span class="value" :key="portions">{{ portions }}</span>
      <button
        class="ctrl-btn"
        type="button"
        :disabled="portions >= 50"
        @click="increase"
        aria-label="Növelés"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="M12 5v14M5 12h14" stroke-linecap="round" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  default: { type: Number, default: 4 },
})

const emit = defineEmits(['change'])
const portions = ref(props.default)

function decrease() {
  if (portions.value > 1) {
    portions.value--
    emit('change', portions.value)
  }
}
function increase() {
  if (portions.value < 50) {
    portions.value++
    emit('change', portions.value)
  }
}
</script>

<style scoped>
.portion-calc {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  background: var(--color-surface);
  border: 1px solid var(--color-stroke);
  border-radius: 12px;
  padding: 8px 14px;
  margin-bottom: 16px;
}

.label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.controls {
  display: flex;
  align-items: center;
  gap: 6px;
}

.ctrl-btn {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  border: 1px solid var(--color-stroke);
  background: var(--color-bg);
  color: var(--color-text);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  transition:
    background 150ms var(--ease-ui-out),
    border-color 150ms var(--ease-ui-out),
    transform 150ms var(--ease-ui-out);
}

.ctrl-btn svg {
  width: 14px;
  height: 14px;
}

.ctrl-btn:hover:not(:disabled) {
  background: var(--color-accent);
  border-color: var(--color-accent);
  color: var(--color-bg);
}

.ctrl-btn:active:not(:disabled) {
  transform: scale(0.9);
}

.ctrl-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.value {
  font-size: 1.1rem;
  font-weight: 800;
  color: var(--color-text);
  min-width: 26px;
  text-align: center;
  animation: numPop 160ms var(--ease-ui-out) both;
}

@keyframes numPop {
  from {
    opacity: 0.5;
    transform: scale(0.95);
  }

  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
