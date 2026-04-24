<!-- Bevásárlólista receptenkénti nézete (recept + hozzá tartozó hozzávalók). -->

<script setup>
import { RouterLink } from 'vue-router'
import CheckableListItem from '@/components/shopping/CheckableListItem.vue'
import { recipeIngKey } from '@/composables/useShoppingList'

const MEAL_COLORS = {
  Reggeli: '#f59e0b',
  Tízórai: '#22c55e',
  Ebéd: '#e9692c',
  Uzsonna: '#0ea5e9',
  Vacsora: '#8b5cf6',
}

defineProps({
  byRecipe: { type: Array, default: () => [] },
  checkedIds: { type: Set, required: true },
})

const emit = defineEmits(['toggle'])

function planLabel(plan) {
  if (!plan.planned_date) return plan.meal_type ?? ''
  const d = new Date(`${plan.planned_date}T12:00:00`)
  const date = d.toLocaleDateString('hu-HU', { month: 'short', day: 'numeric' })
  return plan.meal_type ? `${date} · ${plan.meal_type}` : date
}
</script>

<template>
  <div>
    <div class="recipes-grid no-print">
      <section v-for="entry in byRecipe" :key="entry.recipe.id" class="recipe-card">
        <header class="recipe-head">
          <RouterLink
            :to="{ name: 'recipe-detail', params: { id: entry.recipe.id } }"
            class="recipe-thumb-link"
            :aria-label="entry.recipe.title"
          >
            <img
              v-if="entry.recipe.image_url"
              :src="entry.recipe.image_url"
              :alt="entry.recipe.title"
              class="recipe-thumb"
              loading="lazy"
            />
            <div v-else class="recipe-thumb recipe-thumb-fallback" aria-hidden="true">🍲</div>
          </RouterLink>

          <div class="recipe-meta">
            <RouterLink
              :to="{ name: 'recipe-detail', params: { id: entry.recipe.id } }"
              class="recipe-title"
              >{{ entry.recipe.title }}</RouterLink
            >

            <div class="recipe-plans">
              <span
                v-for="plan in entry.plans"
                :key="plan.id"
                class="plan-chip"
                :style="{ '--dot': MEAL_COLORS[plan.meal_type] || 'var(--color-accent)' }"
              >
                {{ planLabel(plan) }}
                <span v-if="plan.servings" class="plan-serv">· {{ plan.servings }} fő</span>
              </span>
            </div>
          </div>
        </header>

        <div class="ings-list">
          <CheckableListItem
            v-for="(ing, ingIdx) in entry.ingredients"
            :key="recipeIngKey(entry.recipe.id, ing)"
            :item="ing"
            :checked="checkedIds.has(recipeIngKey(entry.recipe.id, ing))"
            :index="ingIdx"
            @toggle="() => emit('toggle', recipeIngKey(entry.recipe.id, ing))"
          />
        </div>
      </section>
    </div>

    <div class="print-only print-recipes">
      <section v-for="entry in byRecipe" :key="`p-r-${entry.recipe.id}`" class="print-recipe">
        <h3 class="print-recipe-title">{{ entry.recipe.title }}</h3>
        <p class="print-recipe-meta">
          <span v-for="(plan, idx) in entry.plans" :key="plan.id">
            <template v-if="idx > 0"> · </template>
            {{ planLabel(plan) }}<template v-if="plan.servings"> · {{ plan.servings }} fő</template>
          </span>
        </p>
        <ul class="print-items" role="list">
          <li
            v-for="ing in entry.ingredients"
            :key="`p-${entry.recipe.id}-${ing.id}-${ing.unit}`"
            class="print-item"
            :class="{ 'print-item-checked': checkedIds.has(recipeIngKey(entry.recipe.id, ing)) }"
          >
            <span
              class="print-checkbox"
              :class="{
                'print-checkbox-checked': checkedIds.has(recipeIngKey(entry.recipe.id, ing)),
              }"
              aria-hidden="true"
              >{{ checkedIds.has(recipeIngKey(entry.recipe.id, ing)) ? '✓' : '' }}</span
            >
            <span class="print-name">{{ ing.name }}</span>
            <span class="print-qty">
              {{ ing.quantity % 1 === 0 ? ing.quantity : ing.quantity.toFixed(2)
              }}<span v-if="ing.unit">&nbsp;{{ ing.unit }}</span>
            </span>
          </li>
        </ul>
      </section>
    </div>
  </div>
</template>

<style scoped>
.recipes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1rem;
  animation: fadeIn 300ms var(--ease-ui-out) both;
}

.recipe-card {
  background: var(--color-bg);
  border: 1.5px solid var(--color-stroke);
  border-radius: 1rem;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.recipe-head {
  display: flex;
  gap: 0.75rem;
  padding: 0.75rem;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-stroke);
}

.recipe-thumb-link {
  flex-shrink: 0;
  width: 3.25rem;
  height: 3.25rem;
  border-radius: 0.625rem;
  overflow: hidden;
  display: block;
  transition: transform 150ms var(--ease-ui-out);
}
.recipe-thumb-link:active {
  transform: scale(0.95);
}

.recipe-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.recipe-thumb-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg);
  border: 1px solid var(--color-stroke);
  font-size: 1.25rem;
  border-radius: 0.625rem;
}

.recipe-meta {
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.recipe-title {
  font-size: 0.95rem;
  font-weight: 800;
  color: var(--color-text);
  text-decoration: none;
  line-height: 1.3;
  overflow-wrap: anywhere;
  word-break: break-word;
  transition: color 150ms ease;
}
.recipe-title:hover {
  color: var(--color-accent);
}

.recipe-plans {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}

.plan-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.7rem;
  font-weight: 600;
  padding: 0.15rem 0.5rem 0.15rem 0.375rem;
  border-radius: 999px;
  background: var(--color-bg);
  border: 1px solid var(--color-stroke);
  color: var(--color-muted);
}
.plan-chip::before {
  content: '';
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--dot, var(--color-accent));
  flex-shrink: 0;
}
.plan-serv {
  font-weight: 700;
  color: var(--color-text);
}

.ings-list {
  list-style: none;
  margin: 0;
  padding: 0.5rem 0.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

@media (max-width: 640px) {
  .recipes-grid {
    grid-template-columns: 1fr;
  }
  .recipe-thumb-link {
    width: 2.75rem;
    height: 2.75rem;
  }
  .recipe-title {
    font-size: 0.9rem;
  }
}
</style>
