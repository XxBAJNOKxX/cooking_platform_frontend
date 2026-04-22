<script setup>
import { computed } from 'vue'

const props = defineProps({
  meta: {
    type: Object,
    required: true,
  },
  itemLabel: {
    type: String,
    default: 'recept',
  },
})

const emit = defineEmits(['page-change'])

const pages = computed(() => {
  const cur  = props.meta.current_page
  const last = props.meta.last_page

  if (last <= 7) return Array.from({ length: last }, (_, i) => i + 1)

  const result = [1]

  if (cur > 3) result.push('...')

  const start = Math.max(2, cur - 1)
  const end   = Math.min(last - 1, cur + 1)
  for (let i = start; i <= end; i++) result.push(i)

  if (cur < last - 2) result.push('...')

  result.push(last)
  return result
})

const canPrev = computed(() => props.meta.current_page > 1)
const canNext = computed(() => props.meta.current_page < props.meta.last_page)

function go(page) {
  if (page < 1 || page > props.meta.last_page || page === props.meta.current_page) return
  emit('page-change', page)
}
</script>

<template>
  <nav
    v-if="meta.last_page > 1"
    class="pg-nav"
    aria-label="Lapozás"
  >
    <p class="pg-info">
      {{ meta.from }}–{{ meta.to }}
      <span class="pg-info-total">/ {{ meta.total }} {{ itemLabel }}</span>
    </p>

    <div class="pg-buttons" role="list">
      <!-- Prev -->
      <button
        class="pg-btn pg-arrow"
        :class="{ disabled: !canPrev }"
        :disabled="!canPrev"
        @click="go(meta.current_page - 1)"
        aria-label="Előző oldal"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="pg-ico" aria-hidden="true">
          <polyline points="15,18 9,12 15,6"/>
        </svg>
      </button>

      <!-- Pages -->
      <template v-for="(page, i) in pages" :key="i">
        <button
          v-if="page !== '...'"
          class="pg-btn"
          :class="{ current: page === meta.current_page }"
          @click="go(page)"
          :aria-current="page === meta.current_page ? 'page' : undefined"
          role="listitem"
        >
          {{ page }}
        </button>
        <span v-else class="pg-ellipsis" role="listitem" aria-hidden="true">…</span>
      </template>

      <!-- Next -->
      <button
        class="pg-btn pg-arrow"
        :class="{ disabled: !canNext }"
        :disabled="!canNext"
        @click="go(meta.current_page + 1)"
        aria-label="Következő oldal"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="pg-ico" aria-hidden="true">
          <polyline points="9,18 15,12 9,6"/>
        </svg>
      </button>
    </div>
  </nav>
</template>

<style scoped>
.pg-nav {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  padding-top: 36px;
}

.pg-info {
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--color-muted);
  margin: 0;
}

.pg-info-total { opacity: 0.75; }

.pg-buttons {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
  justify-content: center;
}

.pg-btn {
  min-width: 38px; height: 38px; padding: 0 6px;
  display: inline-flex; align-items: center; justify-content: center;
  border-radius: 10px;
  border: 1.5px solid var(--color-stroke);
  background: var(--color-bg);
  color: var(--color-muted);
  font-size: 0.875rem; font-weight: 600;
  cursor: pointer;
  transition:
    background    150ms var(--ease-ui-out),
    color         150ms var(--ease-ui-out),
    border-color  150ms var(--ease-ui-out),
    transform     150ms var(--ease-ui-out);
}

.pg-btn:hover:not(.disabled):not(.current) {
  background: var(--color-surface);
  color: var(--color-text);
  border-color: var(--color-accent-soft);
}

.pg-btn:active:not(.disabled) { transform: scale(0.92); }

.pg-btn.current {
  background: var(--color-accent);
  color: #fff;
  border-color: var(--color-accent);
  font-weight: 700;
}

.pg-btn.disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.pg-ico { width: 14px; height: 14px; }

.pg-ellipsis {
  display: inline-flex; align-items: center; justify-content: center;
  min-width: 28px; height: 38px;
  font-size: 0.875rem;
  color: var(--color-muted);
  user-select: none;
}
</style>
