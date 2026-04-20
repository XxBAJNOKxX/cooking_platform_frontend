<template>
  <div class="ingredient-groups">
    <section
      v-for="group in scaledGroups"
      :key="group.name || '_default'"
      class="ing-group"
    >
      <h3 v-if="group.name" class="ing-group-title">{{ group.name }}</h3>
      <ul class="ingredient-list" role="list">
        <li
          v-for="(ing, index) in group.items"
          :key="ing.id"
          class="ingredient-item"
          :style="`--i: ${index}`"
        >
          <span class="amount" :class="{ 'amount--taste': !ing.scaledQty && ing.unit }">
            <span v-if="ing.scaledQty != null && ing.scaledQty !== 0" class="qty">{{ formatQty(ing.scaledQty) }}</span>
            <span v-if="ing.unit" class="unit">{{ ing.unit }}</span>
          </span>
          <span class="name">{{ ing.name }}</span>
        </li>
      </ul>
    </section>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  ingredients: { type: Array, default: () => [] },
  basePortions: { type: Number, default: 4 },
  currentPortions: { type: Number, default: 4 },
})

const scaledGroups = computed(() => {
  const ratio = props.currentPortions / props.basePortions
  const buckets = new Map()
  for (const ing of props.ingredients) {
    const key = (ing.group ?? '').toString()
    if (!buckets.has(key)) buckets.set(key, [])
    buckets.get(key).push({
      ...ing,
      scaledQty: ing.quantity != null ? ing.quantity * ratio : null,
    })
  }
  const out = []
  if (buckets.has('')) out.push({ name: '', items: buckets.get('') })
  for (const [name, items] of buckets) if (name !== '') out.push({ name, items })
  return out
})

function formatQty(v) {
  if (v == null) return ''
  if (Number.isInteger(v)) return String(v)
  return parseFloat(v.toFixed(2)).toString()
}
</script>

<style scoped>
.ingredient-groups {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.ing-group { display: flex; flex-direction: column; gap: 4px; }

.ing-group-title {
  margin: 2px 0 2px;
  padding: 0 4px;
  font-size: 1rem;
  font-weight: 800;
  letter-spacing: 0.01em;
  color: var(--color-accent);
  text-transform: none;
}

.ingredient-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.ingredient-item {
  display: flex;
  align-items: baseline;
  gap: 10px;
  padding: 9px 10px;
  border-radius: 10px;
  transition: background 150ms var(--ease-ui-out);
  animation: slideIn 260ms var(--ease-ui-out) both;
  animation-delay: calc(var(--i, 0) * 35ms);
}

@media (hover: hover) and (pointer: fine) {
  .ingredient-item:hover {
    background: var(--color-surface);
  }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-10px);
  }

  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.amount {
  display: flex;
  align-items: baseline;
  gap: 3px;
  min-width: 72px;
  flex-shrink: 0;
}

.qty {
  font-weight: 700;
  font-size: 0.95rem;
  color: var(--color-accent);
}

.unit {
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--color-muted);
}

.amount--taste {
  min-width: unset;
  font-style: italic;
}

.name {
  font-size: 0.9rem;
  color: var(--color-text);
  text-transform: capitalize;
}
</style>
