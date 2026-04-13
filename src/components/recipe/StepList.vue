<template>
  <ol class="step-list" role="list">
    <li v-for="(step, i) in parsedSteps" :key="i" class="step-item"
      :class="{ 'is-done': done.has(i), 'is-active': !done.has(i) && i === activeIdx }" :style="`--i: ${i}`"
      @click="toggle(i)">
      <span class="step-num" :aria-label="`${i + 1}. lépés`">
        <span v-if="!done.has(i)">{{ i + 1 }}</span>
        <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="check-icon">
          <path d="M5 13l4 4L19 7" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </span>
      <p class="step-text">{{ step }}</p>
    </li>
  </ol>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  steps: { type: String, default: '' }
})

const parsedSteps = computed(() =>
  props.steps.split('\n').map(s => s.trim()).filter(Boolean)
)

const done = ref(new Set())
const activeIdx = ref(0)

function toggle(i) {
  const next = new Set(done.value)
  if (next.has(i)) {
    next.delete(i)
  } else {
    next.add(i)
    const nextActive = parsedSteps.value.findIndex((_, idx) => idx > i && !next.has(idx))
    if (nextActive !== -1) activeIdx.value = nextActive
  }
  done.value = next
}
</script>

<style scoped>
.step-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.step-item {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 14px 16px;
  border-radius: 14px;
  border: 1.5px solid transparent;
  background: var(--color-surface);
  cursor: pointer;
  transition:
    background 180ms var(--ease-ui-out),
    border-color 180ms var(--ease-ui-out),
    transform 150ms var(--ease-ui-out),
    opacity 180ms var(--ease-ui-out);
  animation: stepIn 280ms var(--ease-ui-out) both;
  animation-delay: calc(var(--i, 0) * 50ms);
}

@keyframes stepIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (hover: hover) and (pointer: fine) {
  .step-item:hover {
    background: var(--color-surface-hover);
    transform: translateY(-1px);
  }
}

.step-item:active {
  transform: scale(0.99) translateY(0);
}

.step-item.is-active {
  background: color-mix(in srgb, var(--color-accent) 8%, var(--color-bg));
  border-color: color-mix(in srgb, var(--color-accent) 30%, transparent);
}

.step-item.is-done {
  opacity: 0.55;
  background: color-mix(in srgb, var(--color-chip) 8%, var(--color-bg));
  border-color: color-mix(in srgb, var(--color-chip) 25%, transparent);
}

.step-item.is-done .step-text {
  text-decoration: line-through;
  color: var(--color-muted);
}

.step-num {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: var(--color-accent);
  color: var(--color-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 0.825rem;
  flex-shrink: 0;
  transition: background 200ms var(--ease-ui-out), transform 200ms var(--ease-ui-out);
}

.step-item.is-done .step-num {
  background: var(--color-chip);
}

.check-icon {
  width: 14px;
  height: 14px;
}

.step-text {
  flex: 1;
  margin: 0;
  line-height: 1.65;
  font-size: 0.925rem;
  color: var(--color-text);
  padding-top: 5px;
}
</style>
