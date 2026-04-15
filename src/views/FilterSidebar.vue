<script setup>
import { computed } from 'vue'
import BaseInput from '@/components/BaseInput.vue'
import BaseButton from '@/components/BaseButton.vue'

const props = defineProps({
  search: {
    type: String,
    default: ''
  },
  category: {
    type: String,
    default: ''
  },
  maxTime: {
    type: Number,
    default: 120
  }
})

const emit = defineEmits(['update:search', 'update:category', 'update:maxTime', 'reset'])

const categories = [
  { value: '', label: '🍽️ Összes kategória' },
  { value: 'ho-vegi-tulelo', label: '❄️ Hó végi túlélő' },
  { value: '20-perces-vacsora', label: '⚡ 20 perces vacsora' },
  { value: 'vasarnapi-klasszikus', label: '☀️ Vasárnapi klasszikus' },
  { value: 'egytepsis-mentootlet', label: '🍳 Egytepsis mentőötlet' }
]

const maxTimeLabel = computed(() => {
  if (props.maxTime >= 120) return '120+ perc'
  return `${props.maxTime} perc`
})

const updateSearch = (value) => emit('update:search', value)
const updateCategory = (event) => emit('update:category', event.target.value)
const updateMaxTime = (event) => emit('update:maxTime', Number(event.target.value))
</script>

<template>
  <aside class="rounded-3xl border border-stroke bg-surface/40 p-5 shadow-sm">
    <div class="flex items-start justify-between gap-3">
      <div>
        <h2 class="text-lg font-bold text-text">Szűrés</h2>
        <p class="mt-1 text-sm text-muted">Találd meg gyorsabban, amit ma főznél.</p>
      </div>

      <BaseButton type="button" variant="outline" size="sm" rounded="full" @click="emit('reset')">
        Törlés
      </BaseButton>
    </div>

    <div class="mt-5 space-y-5">
      <BaseInput
        :model-value="search"
        label="Keresés"
        placeholder="Recept neve"
        @update:model-value="updateSearch"
      />

      <div>
        <label class="mb-2 block text-sm font-medium text-muted">Kategória</label>
        <select
          :value="category"
          @change="updateCategory"
          class="block w-full rounded-lg border border-stroke bg-bg px-4 py-2.5 text-sm text-text shadow-sm outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
        >
          <option v-for="item in categories" :key="item.value || 'all'" :value="item.value">
            {{ item.label }}
          </option>
        </select>
      </div>

      <div>
        <div class="mb-2 flex items-center justify-between gap-3">
          <label class="text-sm font-medium text-muted">Max idő</label>
          <span class="text-sm font-semibold text-text">{{ maxTimeLabel }}</span>
        </div>

        <input
          :value="maxTime"
          type="range"
          min="10"
          max="120"
          step="5"
          @input="updateMaxTime"
          class="w-full accent-[color:var(--color-accent)]"
        />

        <div class="mt-2 flex justify-between text-xs text-muted">
          <span>10 perc</span>
          <span>120+ perc</span>
        </div>
      </div>
    </div>
  </aside>
</template>
