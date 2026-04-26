<!-- Eszköz-piac: lista + térkép + szűrés (város/ár/elérhetőség). -->

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/services/api'
import ToolCard from '@/components/tools/ToolCard.vue'
import ToolSkeletonCard from '@/components/tools/ToolSkeletonCard.vue'
import Pagination from '@/components/Pagination.vue'
import BaseButton from '@/components/BaseButton.vue'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const tools = ref([])
const meta = ref(null)
const loading = ref(false)
const error = ref('')

const filters = ref({
  search: '',
  city: '',
  max_price: '',
  available_only: true,
})

function buildParams(page = 1) {
  const p = { page, per_page: 18 }
  if (filters.value.search) p.search = filters.value.search
  if (filters.value.city) p.city = filters.value.city
  if (filters.value.max_price) p.max_price = filters.value.max_price
  if (filters.value.available_only) p.available_only = 1
  return p
}

async function fetchTools(page = 1) {
  loading.value = true
  error.value = ''
  try {
    const res = await api.get('/kitchen-tools', { params: buildParams(page) })
    tools.value = res.data.data ?? []
    meta.value = res.data.meta
  } catch (e) {
    if (import.meta.env.DEV) console.error('[fetchTools]', e)
    error.value = 'Nem sikerült betölteni az eszközöket.'
  } finally {
    loading.value = false
  }
}

function syncFromRoute() {
  const q = route.query
  filters.value = {
    search: q.search ?? '',
    city: q.city ?? '',
    max_price: q.max_price ?? '',
    available_only: q.available_only !== '0',
  }
}

function onSubmit() {
  const query = {}
  if (filters.value.search) query.search = filters.value.search
  if (filters.value.city) query.city = filters.value.city
  if (filters.value.max_price) query.max_price = String(filters.value.max_price)
  if (!filters.value.available_only) query.available_only = '0'
  router.push({ name: 'tools', query }).catch(() => {})
  if (isNarrow.value) filtersOpen.value = false
}

function resetFilters() {
  filters.value = { search: '', city: '', max_price: '', available_only: true }
  router.push({ name: 'tools' }).catch(() => {})
}

watch(
  () => route.query,
  () => {
    syncFromRoute()
    fetchTools(1)
  },
  { deep: true },
)

// Összecsukható szűrő mobilon/tableten
const isNarrow = ref(false)
const filtersOpen = ref(true)

const NARROW_BREAKPOINT = 900
function updateIsNarrow() {
  const narrow = window.innerWidth < NARROW_BREAKPOINT
  if (narrow !== isNarrow.value) {
    isNarrow.value = narrow
    filtersOpen.value = !narrow
  }
}

onMounted(() => {
  syncFromRoute()
  fetchTools(1)
  updateIsNarrow()
  window.addEventListener('resize', updateIsNarrow)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateIsNarrow)
})

function onPageChange(page) {
  fetchTools(page)
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const resultLabel = computed(() => {
  if (!meta.value) return ''
  const t = meta.value.total
  return t === 0 ? 'Nincs találat' : `${t} eszköz`
})

const activeFilterCount = computed(() => {
  let n = 0
  if (filters.value.search) n++
  if (filters.value.city) n++
  if (filters.value.max_price) n++
  if (!filters.value.available_only) n++
  return n
})
</script>

<template>
  <div class="tm-root">
    <header class="tm-header">
      <div>
        <h1 class="tm-title">Eszközbérlés</h1>
        <p v-if="!loading && meta" class="tm-count">{{ resultLabel }}</p>
        <p v-else-if="loading" class="tm-count tm-count-loading">Betöltés…</p>
      </div>

      <RouterLink v-if="authStore.isAuthenticated" :to="{ name: 'tool-create' }" tabindex="-1">
        <BaseButton variant="primary" rounded="full">+ Új eszköz</BaseButton>
      </RouterLink>
    </header>

    <!-- Filter toggle (mobile/tablet only) -->
    <button
      v-if="isNarrow"
      type="button"
      class="tm-toggle"
      :aria-expanded="filtersOpen"
      @click="filtersOpen = !filtersOpen"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        aria-hidden="true"
      >
        <line x1="4" y1="6" x2="20" y2="6" stroke-linecap="round" />
        <line x1="7" y1="12" x2="17" y2="12" stroke-linecap="round" />
        <line x1="10" y1="18" x2="14" y2="18" stroke-linecap="round" />
      </svg>
      <span>Szűrők</span>
      <span v-if="activeFilterCount" class="tm-toggle-badge">{{ activeFilterCount }}</span>
      <svg
        class="tm-toggle-chev"
        :class="{ 'tm-toggle-chev--open': filtersOpen }"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2.5"
        aria-hidden="true"
      >
        <polyline points="6,9 12,15 18,9" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </button>

    <!-- Filters -->
    <Transition name="tm-filters-fade">
      <form v-show="filtersOpen" class="tm-filters" @submit.prevent="onSubmit">
        <label class="tm-field">
          <span>Keresés</span>
          <input
            v-model="filters.search"
            type="text"
            placeholder="név, leírás, város…"
            class="tm-input"
          />
        </label>

        <label class="tm-field">
          <span>Város</span>
          <input v-model="filters.city" type="text" placeholder="pl. Budapest" class="tm-input" />
        </label>

        <label class="tm-field tm-field-sm">
          <span>Max ár / nap</span>
          <input
            v-model.number="filters.max_price"
            type="number"
            min="0"
            placeholder="Ft"
            class="tm-input"
          />
        </label>

        <label class="tm-check">
          <input type="checkbox" v-model="filters.available_only" />
          <span>Csak elérhető</span>
        </label>

        <div class="tm-actions">
          <button type="submit" class="tm-btn tm-btn-primary">Szűrés</button>
          <button type="button" class="tm-btn" @click="resetFilters">Törlés</button>
        </div>
      </form>
    </Transition>

    <!-- Tools grid -->
    <section class="tm-grid-col">
      <div v-if="loading" class="tm-grid" aria-busy="true" aria-label="Eszközök betöltése">
        <ToolSkeletonCard v-for="i in 6" :key="i" :index="i" />
      </div>

      <div v-else-if="error" class="tm-empty">
        <p>{{ error }}</p>
        <button class="tm-btn" @click="fetchTools(1)">Újra próbálom</button>
      </div>

      <div v-else-if="tools.length === 0" class="tm-empty">
        <p>Nincs az adott szűrőknek megfelelő eszköz.</p>
        <button class="tm-btn" @click="resetFilters">Szűrők törlése</button>
      </div>

      <div v-else class="tm-grid">
        <ToolCard v-for="(t, i) in tools" :key="t.id" :tool="t" :index="i" />
      </div>

      <Pagination
        v-if="!loading && meta && meta.last_page > 1"
        :meta="meta"
        item-label="eszköz"
        @page-change="onPageChange"
        class="mt-6"
      />
    </section>
  </div>
</template>

<style scoped>
.tm-root {
  padding-bottom: 4rem;
}

.tm-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  padding-bottom: 1.25rem;
  border-bottom: 1.5px solid var(--color-stroke);
  margin-bottom: 1.25rem;
}

.tm-title {
  margin: 0;
  font-size: clamp(1.6rem, 4vw, 2.2rem);
  font-weight: 800;
  letter-spacing: -0.025em;
  color: var(--color-text);
}
.tm-count {
  margin: 0.25rem 0 0;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-muted);
}
.tm-count-loading {
  animation: tmBlink 1.4s ease-in-out infinite;
}
@keyframes tmBlink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.45;
  }
}

/* ── Filter toggle (mobile/tablet only) ── */
.tm-toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.65rem 0.9rem;
  border-radius: 0.75rem;
  border: 1.5px solid var(--color-stroke);
  background: var(--color-bg);
  color: var(--color-text);
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  margin-bottom: 0.75rem;
  transition:
    background 150ms ease,
    border-color 150ms ease;
}
.tm-toggle:hover {
  background: var(--color-surface);
  border-color: var(--color-accent);
}
.tm-toggle:active {
  transform: scale(0.99);
}
.tm-toggle svg {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
}
.tm-toggle-chev {
  margin-left: auto;
  transition: transform 200ms var(--ease-ui-out);
}
.tm-toggle-chev--open {
  transform: rotate(180deg);
}
.tm-toggle-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.25rem;
  height: 1.25rem;
  padding: 0 0.4rem;
  border-radius: 999px;
  background: var(--color-accent);
  color: var(--color-bg);
  font-size: 0.7rem;
  font-weight: 800;
}

/* filters */
.tm-filters {
  display: grid;
  grid-template-columns: 1.8fr 1fr 0.8fr auto auto;
  gap: 0.6rem 0.75rem;
  align-items: end;
  padding: 0.875rem;
  border: 1.5px solid var(--color-stroke);
  border-radius: 1rem;
  background: var(--color-bg);
  margin-bottom: 1.25rem;
}
@media (max-width: 900px) {
  .tm-filters {
    grid-template-columns: 1fr 1fr;
  }
  .tm-actions {
    grid-column: 1 / -1;
  }
}
@media (max-width: 520px) {
  .tm-filters {
    grid-template-columns: 1fr;
  }
}

.tm-filters-fade-enter-active,
.tm-filters-fade-leave-active {
  transition:
    opacity 200ms var(--ease-ui-out),
    transform 200ms var(--ease-ui-out);
}
.tm-filters-fade-enter-from,
.tm-filters-fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

.tm-field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--color-muted);
}

.tm-input {
  width: 100%;
  padding: 0.55rem 0.75rem;
  border-radius: 0.55rem;
  border: 1px solid var(--color-stroke);
  background: var(--color-bg);
  color: var(--color-text);
  font-size: 0.9rem;
  outline: none;
  transition:
    border-color 150ms var(--ease-ui-out),
    box-shadow 150ms var(--ease-ui-out);
}
.tm-input:focus {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-accent) 30%, transparent);
}

.tm-check {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.86rem;
  font-weight: 600;
  color: var(--color-text);
  padding-bottom: 0.55rem;
}
.tm-check input {
  accent-color: var(--color-accent);
  width: 1rem;
  height: 1rem;
}

.tm-actions {
  display: flex;
  gap: 0.5rem;
  padding-bottom: 0;
}

.tm-btn {
  padding: 0.55rem 1.1rem;
  border-radius: 0.55rem;
  border: 1.5px solid var(--color-stroke);
  background: var(--color-bg);
  color: var(--color-text);
  font-size: 0.86rem;
  font-weight: 700;
  cursor: pointer;
  transition:
    transform 150ms var(--ease-ui-out),
    background 150ms var(--ease-ui-out);
}
.tm-btn:hover {
  background: var(--color-surface);
}
.tm-btn:active {
  transform: scale(0.97);
}
.tm-btn-primary {
  border-color: var(--color-accent);
  background: var(--color-accent);
  color: var(--color-bg);
}
.tm-btn-primary:hover {
  background: var(--color-accent-hover);
}

.tm-grid-col {
  min-width: 0;
}

.tm-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}
@media (max-width: 1199px) {
  .tm-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media (max-width: 479px) {
  .tm-grid {
    grid-template-columns: 1fr;
  }
}

.tm-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  min-height: 16rem;
  color: var(--color-muted);
  font-size: 0.9rem;
  text-align: center;
}
</style>
