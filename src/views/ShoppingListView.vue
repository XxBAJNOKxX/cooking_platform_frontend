<!-- Bevásárlólista a tervezett étkezésekből, aggregált és receptenkénti nézettel. -->

<script setup>
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import DateRangePicker from '@/components/DateRangePicker.vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import ShoppingListAggregated from '@/components/shopping/ShoppingListAggregated.vue'
import ShoppingListByRecipe from '@/components/shopping/ShoppingListByRecipe.vue'
import { useAuthStore } from '@/stores/auth'
import { useShoppingList } from '@/composables/useShoppingList'
import { usePageRule } from '@/composables/usePageRule'

usePageRule('@page { size: A4; margin: 14mm 14mm 16mm; }')

const authStore = useAuthStore()

const {
  dateRange,
  aggregated,
  byRecipe,
  loading,
  error,
  hasLoaded,
  checkedIds,
  fetchList,
  toggle,
  resetAll,
  checkedCount,
  totalCount,
  progress,
  sortedAggregated,
  hasAnyItems,
  rangeLabel,
} = useShoppingList()

const viewMode = ref('aggregated')

function printList() {
  window.print()
}
</script>

<template>
  <div class="sl-page">
    <div class="sl-header">
      <div class="sl-title-block">
        <h1 class="sl-title">Bevásárlólista</h1>
        <p class="sl-subtitle">Az étrendedből automatikusan összeállítva</p>
      </div>

      <button
        v-if="hasAnyItems"
        class="print-btn no-print"
        @click="printList"
        aria-label="Nyomtatás"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          aria-hidden="true"
        >
          <polyline points="6,9 6,2 18,2 18,9" />
          <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" />
          <rect x="6" y="14" width="12" height="8" />
        </svg>
        Nyomtatás
      </button>
    </div>

    <div class="controls no-print">
      <div class="picker-card">
        <DateRangePicker v-model="dateRange" />
      </div>
    </div>

    <div v-if="loading" class="state-center">
      <LoadingSpinner />
    </div>

    <div v-else-if="error" class="state-center">
      <p class="error-text">{{ error }}</p>
      <button class="retry-btn" @click="fetchList">Újra</button>
    </div>

    <div v-else-if="hasLoaded && !hasAnyItems" class="empty-state">
      <div class="empty-icon" aria-hidden="true">🥦</div>
      <p class="empty-title">Nincs mit venni</p>
      <p class="empty-sub">
        Erre az időszakra nincs betervezett étkezés. Adj hozzá recepteket a
        <RouterLink to="/calendar" class="empty-link">naptárban</RouterLink>!
      </p>
    </div>

    <div v-else-if="hasAnyItems" class="mode-toolbar no-print">
      <div class="view-toggle" role="tablist" aria-label="Nézet">
        <button
          class="view-pill"
          role="tab"
          :aria-selected="viewMode === 'aggregated'"
          :class="{ active: viewMode === 'aggregated' }"
          @click="viewMode = 'aggregated'"
        >
          Összes
        </button>
        <button
          class="view-pill"
          role="tab"
          :aria-selected="viewMode === 'by_recipe'"
          :class="{ active: viewMode === 'by_recipe' }"
          @click="viewMode = 'by_recipe'"
        >
          Receptenként
        </button>
      </div>
    </div>

    <div v-if="hasAnyItems" class="print-header print-only">
      <div class="print-head-top">
        <div class="print-logo">Cookr<span class="print-logo-dot">.</span></div>
        <p v-if="authStore.user?.username" class="print-user">{{ authStore.user.username }}</p>
      </div>
      <div class="print-head-bottom">
        <p class="print-title">Bevásárlólista</p>
        <p class="print-range">{{ rangeLabel }}</p>
      </div>
    </div>

    <Transition name="mode-fade" mode="out-in">
      <div
        v-if="hasLoaded && viewMode === 'aggregated' && aggregated.length"
        key="aggregated"
        class="mode-pane"
      >
        <ShoppingListAggregated
          :aggregated="aggregated"
          :sorted-aggregated="sortedAggregated"
          :checked-ids="checkedIds"
          :checked-count="checkedCount"
          :total-count="totalCount"
          :progress="progress"
          @toggle="toggle"
          @reset="resetAll"
        />
      </div>

      <div
        v-else-if="hasLoaded && viewMode === 'by_recipe' && byRecipe.length"
        key="by_recipe"
        class="mode-pane"
      >
        <ShoppingListByRecipe :by-recipe="byRecipe" :checked-ids="checkedIds" @toggle="toggle" />
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.sl-page {
  max-width: 1100px;
  margin: 0 auto;
  padding: 2rem 1.25rem 4rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.sl-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.sl-title {
  font-size: 1.625rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--color-text);
  line-height: 1.2;
}

.sl-subtitle {
  font-size: 0.875rem;
  color: var(--color-muted);
  margin-top: 0.2rem;
}

.print-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.5rem 1rem;
  border-radius: 0.625rem;
  border: 1.5px solid var(--color-stroke);
  background: var(--color-surface);
  font-size: 0.8125rem;
  font-weight: 700;
  color: var(--color-muted);
  cursor: pointer;
  transition:
    background 160ms ease,
    border-color 160ms ease,
    color 160ms ease,
    transform 160ms var(--ease-ui-out);
}

.print-btn svg {
  width: 1rem;
  height: 1rem;
}

@media (hover: hover) and (pointer: fine) {
  .print-btn:hover {
    background: var(--color-surface-hover);
    border-color: var(--color-muted);
    color: var(--color-text);
  }
}

.print-btn:active {
  transform: scale(0.96);
}

.controls {
  display: block;
}

.picker-card {
  background: var(--color-surface);
  border: 1.5px solid var(--color-stroke);
  border-radius: 1rem;
  padding: 1rem 1.125rem;
}

.view-toggle {
  display: inline-flex;
  background: var(--color-surface);
  border: 1px solid var(--color-stroke);
  border-radius: 999px;
  padding: 0.125rem;
  gap: 0.0625rem;
}

.view-pill {
  padding: 0.2rem 0.55rem;
  border-radius: 999px;
  border: none;
  background: transparent;
  font-size: 0.6875rem;
  font-weight: 700;
  color: var(--color-muted);
  cursor: pointer;
  white-space: nowrap;
  letter-spacing: 0.01em;
  transition:
    background 160ms ease,
    color 160ms ease,
    transform 160ms var(--ease-ui-out);
}

@media (hover: hover) and (pointer: fine) {
  .view-pill:not(.active):hover {
    color: var(--color-text);
  }
}

.view-pill.active {
  background: var(--color-bg);
  color: var(--color-text);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

.view-pill:active {
  transform: scale(0.94);
}

.mode-toolbar {
  display: flex;
  justify-content: flex-end;
  max-width: 1100px;
  width: 100%;
  margin: 0 auto;
}

.mode-pane {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.mode-fade-enter-active,
.mode-fade-leave-active {
  transition:
    opacity 220ms var(--ease-ui-out),
    transform 220ms var(--ease-ui-out);
}
.mode-fade-enter-from {
  opacity: 0;
  transform: translateY(4px);
}
.mode-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

.state-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 3rem 0;
}

.error-text {
  font-size: 0.9rem;
  color: var(--color-danger);
}

.retry-btn {
  padding: 0.5rem 1.25rem;
  border-radius: 0.625rem;
  border: 1.5px solid var(--color-stroke);
  background: transparent;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-muted);
  cursor: pointer;
  transition:
    background 150ms ease,
    transform 150ms var(--ease-ui-out);
}

.retry-btn:hover {
  background: var(--color-surface);
  color: var(--color-text);
}
.retry-btn:active {
  transform: scale(0.96);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.625rem;
  padding: 3rem 1rem;
  text-align: center;
  animation: fadeIn 300ms var(--ease-ui-out) both;
}

.empty-icon {
  font-size: 2.5rem;
  line-height: 1;
  margin-bottom: 0.25rem;
}
.empty-title {
  font-size: 1.125rem;
  font-weight: 800;
  color: var(--color-text);
}
.empty-sub {
  font-size: 0.875rem;
  color: var(--color-muted);
  max-width: 320px;
  line-height: 1.6;
}
.empty-link {
  color: var(--color-accent);
  font-weight: 700;
  text-decoration: underline;
  text-decoration-color: color-mix(in srgb, var(--color-accent) 40%, transparent);
  text-underline-offset: 3px;
}

@media print {
  ul.print-only {
    display: block !important;
  }

  .sl-page {
    display: block !important;
    padding: 0 !important;
    max-width: 100% !important;
    margin: 0 !important;
    gap: 0 !important;
    color: #000;
  }

  .sl-header {
    display: none !important;
  }

  .print-header {
    margin-bottom: 12pt;
  }
  .print-head-bottom {
    margin-top: 6pt;
  }
  .print-logo {
    font-size: 18pt;
  }
  .print-user,
  .print-range {
    font-size: 10pt;
  }
  .print-title {
    font-size: 14pt;
  }
}

@media (max-width: 640px) {
  .sl-page {
    padding: 1.25rem 1rem 3rem;
  }
  .sl-title {
    font-size: 1.375rem;
  }

  .view-toggle {
    align-self: stretch;
    justify-content: center;
  }
  .view-pill {
    flex: 1;
  }
}
</style>

<!-- Unscoped: html/body rules must not be scoped to a component hash. -->
<style>
@media print {
  #app > div > header,
  #app > div > nav,
  #app > div > footer {
    display: none !important;
  }

  html,
  body {
    font-family: 'Helvetica Neue', Arial, sans-serif;
    font-size: 11pt;
    line-height: 1.4;
    color: #000 !important;
  }

  /* Print styles that must apply inside child components (scoped styles don't cross boundaries) */
  .print-items {
    list-style: none;
    margin: 0;
    padding: 0;
    column-count: 2;
    column-gap: 14mm;
    column-rule: 1px solid #e5e5e5;
  }
  .print-item {
    display: flex;
    align-items: baseline;
    gap: 6pt;
    padding: 3pt 0;
    border-bottom: 0.5pt dotted #bbb;
    break-inside: avoid;
    page-break-inside: avoid;
  }
  .print-checkbox {
    flex-shrink: 0;
    width: 9pt;
    height: 9pt;
    border: 1pt solid #000;
    border-radius: 1.5pt;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
    transform: translateY(1pt);
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .print-checkbox-checked {
    background: #000;
    color: #fff;
    font-size: 8pt;
    font-weight: 900;
  }
  .print-item-checked .print-name,
  .print-item-checked .print-qty {
    text-decoration: line-through;
    text-decoration-thickness: 0.7pt;
    color: #777 !important;
  }
  .print-name {
    flex: 1;
    min-width: 0;
    font-size: 10.5pt;
    color: #000;
    overflow-wrap: anywhere;
  }
  .print-qty {
    flex-shrink: 0;
    font-size: 10pt;
    font-weight: 700;
    color: #000;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }

  .print-recipes {
    display: block;
  }
  .print-recipe {
    margin-bottom: 10pt;
    padding-bottom: 6pt;
    break-inside: avoid;
    page-break-inside: avoid;
  }
  .print-recipe + .print-recipe {
    margin-top: 6pt;
    padding-top: 8pt;
    border-top: 0.5pt solid #ddd;
  }
  .print-recipe-title {
    font-size: 12pt;
    font-weight: 800;
    color: #000;
    margin: 0 0 2pt;
    letter-spacing: -0.005em;
  }
  .print-recipe-meta {
    font-size: 9pt;
    color: #555;
    margin: 0 0 5pt;
    font-weight: 500;
  }
  .print-recipe .print-items {
    column-count: 1;
    column-rule: none;
  }

  .list-card {
    border: none !important;
    border-radius: 0 !important;
    max-width: 100% !important;
    background: transparent !important;
    overflow: visible !important;
  }
}
</style>
