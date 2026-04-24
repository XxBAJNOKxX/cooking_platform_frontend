<!-- Bevásárlólista egy sor (checkbox + név + mennyiség). -->

<script setup>
defineProps({
  item: { type: Object, required: true },
  checked: { type: Boolean, default: false },
  index: { type: Number, default: 0 },
})

defineEmits(['toggle'])
</script>

<template>
  <button
    class="item"
    :class="{ checked }"
    :style="{ '--i': index }"
    role="checkbox"
    :aria-checked="checked"
    @click="$emit('toggle', item.id)"
  >
    <span class="checkbox" aria-hidden="true">
      <svg class="check-svg" viewBox="0 0 12 10" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M1 5l3.5 3.5L11 1" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </span>

    <span class="item-name">{{ item.name }}</span>

    <span class="item-qty">
      <span class="qty-num">{{
        item.quantity % 1 === 0 ? item.quantity : item.quantity.toFixed(1)
      }}</span>
      <span v-if="item.unit" class="qty-unit">{{ item.unit }}</span>
    </span>
  </button>
</template>

<style scoped>
.item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.625rem 0.875rem;
  border-radius: 0.75rem;
  border: 1.5px solid transparent;
  background: transparent;
  cursor: pointer;
  text-align: left;

  transition:
    background 160ms ease,
    border-color 160ms ease,
    opacity 200ms ease,
    transform 150ms var(--ease-ui-out);
}

@media (hover: hover) and (pointer: fine) {
  .item:not(.checked):hover {
    background: var(--color-surface);
    border-color: var(--color-stroke);
  }
}

.item:active {
  transform: scale(0.99);
}

.item.checked {
  opacity: 0.48;
}

/* ── Checkbox ── */
.checkbox {
  width: 1.25rem;
  height: 1.25rem;
  flex-shrink: 0;
  border-radius: 0.375rem;
  border: 2px solid var(--color-stroke);
  background: var(--color-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    background 180ms var(--ease-ui-out),
    border-color 180ms ease,
    transform 180ms var(--ease-ui-out);
}

.item.checked .checkbox {
  background: var(--color-chip);
  border-color: var(--color-chip);
  transform: scale(1.05);
}

.check-svg {
  width: 0.625rem;
  height: 0.625rem;
  color: white;
  stroke-dasharray: 16;
  stroke-dashoffset: 16;
  transition: stroke-dashoffset 200ms var(--ease-ui-out) 40ms;
}

.item.checked .check-svg {
  stroke-dashoffset: 0;
}

/* ── Name ── */
.item-name {
  flex: 1;
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--color-text);
  line-height: 1.3;
  position: relative;
  transition: color 200ms ease;
}

.item-name::after {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  width: 100%;
  height: 1.5px;
  background: var(--color-muted);
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 220ms var(--ease-ui-out);
}

.item.checked .item-name {
  color: var(--color-muted);
}

.item.checked .item-name::after {
  transform: scaleX(1);
}

/* ── Quantity ── */
.item-qty {
  display: flex;
  align-items: baseline;
  gap: 0.2rem;
  flex-shrink: 0;
  transition: opacity 200ms ease;
}

.qty-num {
  font-size: 0.9375rem;
  font-weight: 700;
  color: var(--color-text);
  font-variant-numeric: tabular-nums;
}

.qty-unit {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-muted);
}

.item.checked .item-qty {
  opacity: 0.5;
}
</style>
