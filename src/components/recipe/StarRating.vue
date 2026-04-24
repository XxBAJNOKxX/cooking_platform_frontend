<!-- Csillag értékelés (olvasható és interaktív módban). -->

<template>
  <div
    class="star-rating"
    :class="{ 'is-interactive': interactive }"
    role="group"
    :aria-label="`Értékelés: ${modelValue} / 5`"
  >
    <button
      v-for="star in 5"
      :key="star"
      type="button"
      class="star-btn"
      :class="{ hovered: interactive && star <= hovered }"
      :style="interactive ? `--i: ${star}` : ''"
      :disabled="!interactive"
      @click="interactive && emit('update:modelValue', star)"
      @mouseenter="interactive && (hovered = star)"
      @mouseleave="interactive && (hovered = 0)"
      :aria-label="`${star} csillag`"
    >
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="18" height="18">
        <defs>
          <linearGradient :id="`sg-${uid}-${star}`" x1="0" x2="1" y1="0" y2="0">
            <stop :offset="`${fillPercent(star)}%`" stop-color="var(--color-accent)" />
            <stop :offset="`${fillPercent(star)}%`" stop-color="var(--color-stroke)" />
          </linearGradient>
        </defs>
        <path
          :fill="interactive && hovered >= star ? 'var(--color-accent)' : `url(#sg-${uid}-${star})`"
          d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
        />
      </svg>
    </button>

    <span v-if="showCount && count !== undefined" class="count">({{ count }})</span>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  modelValue: { type: Number, default: 0 },
  count: { type: Number, default: undefined },
  showCount: { type: Boolean, default: false },
  interactive: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue'])
const hovered = ref(0)

const uid = Math.random().toString(36).slice(2, 8)

const displayValue = computed(() =>
  props.interactive && hovered.value ? hovered.value : props.modelValue,
)

function fillPercent(star) {
  const val = displayValue.value
  if (star <= Math.floor(val)) return 100
  if (star === Math.ceil(val)) return Math.round((val % 1) * 100)
  return 0
}
</script>

<style scoped>
.star-rating {
  display: inline-flex;
  align-items: center;
  gap: 2px;
}

.star-btn {
  background: none;
  border: none;
  padding: 1px;
  cursor: default;
  transition: transform 150ms var(--ease-ui-out);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
}

.is-interactive .star-btn {
  cursor: pointer;
}

@media (hover: hover) and (pointer: fine) {
  .is-interactive .star-btn:hover,
  .is-interactive .star-btn.hovered {
    transform: scale(1.2);
  }
}

.is-interactive .star-btn:active {
  transform: scale(0.9);
}

.is-interactive .star-btn {
  animation: starPop 200ms var(--ease-ui-out) both;
  animation-delay: calc(var(--i, 1) * 40ms);
}

@keyframes starPop {
  from {
    opacity: 0;
    transform: scale(0.95);
  }

  to {
    opacity: 1;
    transform: scale(1);
  }
}

.count {
  font-size: 0.8rem;
  color: var(--color-muted);
  margin-left: 4px;
}
</style>
