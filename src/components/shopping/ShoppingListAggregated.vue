<!-- Bevásárlólista aggregált nézete (egy recept sincs, minden összevonva). -->

<script setup>
import CheckableListItem from '@/components/shopping/CheckableListItem.vue'
import { itemKey } from '@/composables/useShoppingList'

defineProps({
  aggregated: { type: Array, default: () => [] },
  sortedAggregated: { type: Array, default: () => [] },
  checkedIds: { type: Set, required: true },
  checkedCount: { type: Number, default: 0 },
  totalCount: { type: Number, default: 0 },
  progress: { type: Number, default: 0 },
})

const emit = defineEmits(['toggle', 'reset'])
</script>

<template>
  <div class="list-card">
    <div class="list-header no-print">
      <div class="progress-row">
        <span class="progress-label">
          <strong>{{ checkedCount }}</strong> / {{ totalCount }} cikk
        </span>
        <button v-if="checkedCount > 0" class="reset-btn" @click="emit('reset')">
          Visszaállítás
        </button>
      </div>
      <div
        class="progress-track"
        role="progressbar"
        :aria-valuenow="checkedCount"
        :aria-valuemax="totalCount"
      >
        <div class="progress-fill" :style="{ width: `${progress}%` }"></div>
      </div>
    </div>

    <TransitionGroup name="sl-item" tag="div" class="items-list no-print">
      <CheckableListItem
        v-for="(item, i) in sortedAggregated"
        :key="itemKey(item)"
        :item="item"
        :checked="checkedIds.has(itemKey(item))"
        :index="i"
        @toggle="() => emit('toggle', itemKey(item))"
      />
    </TransitionGroup>

    <ul class="print-only print-items" role="list">
      <li
        v-for="item in aggregated"
        :key="`p-agg-${itemKey(item)}`"
        class="print-item"
        :class="{ 'print-item-checked': checkedIds.has(itemKey(item)) }"
      >
        <span
          class="print-checkbox"
          :class="{ 'print-checkbox-checked': checkedIds.has(itemKey(item)) }"
          aria-hidden="true"
          >{{ checkedIds.has(itemKey(item)) ? '✓' : '' }}</span
        >
        <span class="print-name">{{ item.name }}</span>
        <span class="print-qty">
          {{ item.quantity % 1 === 0 ? item.quantity : item.quantity.toFixed(2)
          }}<span v-if="item.unit">&nbsp;{{ item.unit }}</span>
        </span>
      </li>
    </ul>

    <Transition name="done-fade">
      <div v-if="checkedCount === totalCount && totalCount > 0" class="all-done no-print">
        <span>🎉</span> Minden megvan!
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.list-card {
  max-width: 720px;
  width: 100%;
  margin: 0 auto;
  background: var(--color-bg);
  border: 1.5px solid var(--color-stroke);
  border-radius: 1rem;
  overflow: hidden;
  animation: fadeIn 300ms var(--ease-ui-out) both;
}

.list-header {
  padding: 0.875rem 1rem 0;
}

.progress-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.progress-label {
  font-size: 0.8125rem;
  color: var(--color-muted);
}
.progress-label strong {
  color: var(--color-text);
  font-weight: 800;
}

.reset-btn {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--color-muted);
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0.1rem 0.25rem;
  border-radius: 0.25rem;
  transition: color 150ms ease;
  text-decoration: underline;
  text-decoration-color: transparent;
  text-underline-offset: 3px;
}
.reset-btn:hover {
  color: var(--color-accent);
  text-decoration-color: color-mix(in srgb, var(--color-accent) 50%, transparent);
}

.progress-track {
  height: 4px;
  background: var(--color-surface);
  border-radius: 999px;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: var(--color-chip);
  border-radius: 999px;
  transition: width 300ms var(--ease-ui-out);
}

.items-list {
  padding: 0.5rem 0.25rem;
  position: relative;
}

.sl-item-move {
  transition: transform 300ms var(--ease-ui-out);
}

.all-done {
  text-align: center;
  padding: 0.875rem;
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--color-chip);
  border-top: 1px solid var(--color-stroke);
}

.done-fade-enter-active {
  transition:
    opacity 300ms var(--ease-ui-out),
    transform 300ms var(--ease-ui-out);
}
.done-fade-enter-from {
  opacity: 0;
  transform: translateY(6px);
}
</style>
