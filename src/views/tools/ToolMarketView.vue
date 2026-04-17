<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/services/api'
import ToolCard from '@/components/tools/ToolCard.vue'
import ToolMap from '@/components/tools/ToolMap.vue'
import Pagination from '@/components/Pagination.vue'
import BaseButton from '@/components/BaseButton.vue'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const tools = ref([])
const meta  = ref(null)
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
  if (filters.value.search)    p.search = filters.value.search
  if (filters.value.city)      p.city = filters.value.city
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
    meta.value  = res.data.meta
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
    city:   q.city ?? '',
    max_price: q.max_price ?? '',
    available_only: q.available_only !== '0',
  }
}

function onSubmit() {
  const query = {}
  if (filters.value.search)    query.search = filters.value.search
  if (filters.value.city)      query.city = filters.value.city
  if (filters.value.max_price) query.max_price = String(filters.value.max_price)
  if (!filters.value.available_only) query.available_only = '0'
  router.push({ name: 'tools', query }).catch(() => {})
}

function resetFilters() {
  filters.value = { search: '', city: '', max_price: '', available_only: true }
  router.push({ name: 'tools' }).catch(() => {})
}

watch(() => route.query, () => { syncFromRoute(); fetchTools(1) }, { deep: true })

onMounted(() => {
  syncFromRoute()
  fetchTools(1)
})

function onPageChange(page) {
  fetchTools(page)
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// --- map overview ---
const mapTools = computed(() =>
  tools.value
    .filter(t => t.latitude && t.longitude)
    .map(t => ({
      id: t.id,
      lat: t.latitude,
      lng: t.longitude,
      radius_m: t.location_radius_m ?? 700,
      name: t.name,
    }))
)

const mapCentre = computed(() => {
  if (!mapTools.value.length) return { lat: 47.4979, lng: 19.0402 } // Budapest default
  const sumLat = mapTools.value.reduce((s, t) => s + t.lat, 0)
  const sumLng = mapTools.value.reduce((s, t) => s + t.lng, 0)
  return {
    lat: sumLat / mapTools.value.length,
    lng: sumLng / mapTools.value.length,
  }
})

function openFromMap(m) {
  router.push({ name: 'tool-detail', params: { id: m.id } })
}

const resultLabel = computed(() => {
  if (!meta.value) return ''
  const t = meta.value.total
  return t === 0 ? 'Nincs találat' : `${t} eszköz`
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

    <!-- Filters -->
    <form class="tm-filters" @submit.prevent="onSubmit">
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
        <input
          v-model="filters.city"
          type="text"
          placeholder="pl. Budapest"
          class="tm-input"
        />
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

    <!-- Split: grid + map -->
    <div class="tm-split">
      <section class="tm-grid-col">
        <div v-if="loading" class="tm-grid" aria-busy="true">
          <div v-for="i in 6" :key="i" class="tm-skel" :style="`--d: ${i * 40}ms`">
            <div class="tm-skel-img" />
            <div class="tm-skel-body">
              <div class="tm-skel-line tm-skel-1" />
              <div class="tm-skel-line tm-skel-2" />
              <div class="tm-skel-line tm-skel-3" />
            </div>
          </div>
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
          <ToolCard
            v-for="(t, i) in tools"
            :key="t.id"
            :tool="t"
            :index="i"
          />
        </div>

        <Pagination
          v-if="!loading && meta && meta.last_page > 1"
          :meta="meta"
          @page-change="onPageChange"
          class="mt-6"
        />
      </section>

      <aside class="tm-map-col">
        <div class="tm-map-frame">
          <ToolMap
            v-if="mapTools.length"
            :lat="mapCentre.lat"
            :lng="mapCentre.lng"
            :radius-m="0"
            :markers="mapTools"
            :zoom="7"
            @marker-click="openFromMap"
          />
          <div v-else class="tm-map-placeholder">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            <p>A találatok itt fognak megjelenni a térképen.</p>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.tm-root { padding-bottom: 4rem; }

.tm-header {
  display: flex; align-items: flex-end; justify-content: space-between;
  gap: 1rem; flex-wrap: wrap;
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
.tm-count { margin: 0.25rem 0 0; font-size: 0.9rem; font-weight: 600; color: var(--color-muted); }
.tm-count-loading { animation: tmBlink 1.4s ease-in-out infinite; }
@keyframes tmBlink { 0%,100%{opacity:1} 50%{opacity:0.45} }

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
  .tm-filters { grid-template-columns: 1fr 1fr; }
  .tm-actions { grid-column: 1 / -1; }
}

.tm-field {
  display: flex; flex-direction: column; gap: 0.25rem;
  font-size: 0.78rem; font-weight: 600; color: var(--color-muted);
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
  transition: border-color 150ms var(--ease-ui-out), box-shadow 150ms var(--ease-ui-out);
}
.tm-input:focus {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-accent) 30%, transparent);
}

.tm-check {
  display: inline-flex; align-items: center; gap: 0.45rem;
  font-size: 0.86rem; font-weight: 600; color: var(--color-text);
  padding-bottom: 0.55rem;
}
.tm-check input { accent-color: var(--color-accent); width: 1rem; height: 1rem; }

.tm-actions { display: flex; gap: 0.5rem; padding-bottom: 0; }

.tm-btn {
  padding: 0.55rem 1.1rem;
  border-radius: 0.55rem;
  border: 1.5px solid var(--color-stroke);
  background: var(--color-bg);
  color: var(--color-text);
  font-size: 0.86rem; font-weight: 700;
  cursor: pointer;
  transition: transform 150ms var(--ease-ui-out), background 150ms var(--ease-ui-out);
}
.tm-btn:hover { background: var(--color-surface); }
.tm-btn:active { transform: scale(0.97); }
.tm-btn-primary {
  border-color: var(--color-accent);
  background: var(--color-accent);
  color: var(--color-bg);
}
.tm-btn-primary:hover { background: var(--color-accent-hover); }

/* split layout */
.tm-split {
  display: grid;
  grid-template-columns: 1fr 360px;
  gap: 1.5rem;
}
@media (max-width: 1099px) {
  .tm-split { grid-template-columns: 1fr; }
  .tm-map-col { order: -1; }
}

.tm-grid-col { min-width: 0; }

.tm-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}
@media (max-width: 1199px) { .tm-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 479px)  { .tm-grid { grid-template-columns: 1fr; } }

/* skeleton */
.tm-skel {
  border-radius: 18px;
  border: 1.5px solid var(--color-stroke);
  overflow: hidden;
  background: var(--color-bg);
  animation: tmSkelIn 250ms var(--ease-ui-out) var(--d, 0ms) both;
}
@keyframes tmSkelIn { from { opacity: 0 } to { opacity: 1 } }
.tm-skel-img { aspect-ratio: 3/2; background: var(--color-surface); }
.tm-skel-body { padding: 0.875rem; display: flex; flex-direction: column; gap: 0.5rem; }
.tm-skel-line {
  height: 0.75rem; border-radius: 0.35rem;
  background: linear-gradient(90deg, var(--color-surface), var(--color-surface-hover), var(--color-surface));
  background-size: 400% 100%;
  animation: tmShimmer 1.6s ease-in-out infinite;
}
.tm-skel-1 { width: 70%; }
.tm-skel-2 { width: 100%; }
.tm-skel-3 { width: 45%; }
@keyframes tmShimmer { 0%{background-position:100% 0} 100%{background-position:-100% 0} }

.tm-empty {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; gap: 0.75rem;
  min-height: 16rem;
  color: var(--color-muted);
  font-size: 0.9rem;
  text-align: center;
}

/* map */
.tm-map-col {
  position: sticky;
  top: 5.5rem;
  align-self: start;
  height: calc(100vh - 7rem);
}
@media (max-width: 1099px) {
  .tm-map-col { position: static; height: auto; }
}

.tm-map-frame {
  height: 100%;
  display: flex; flex-direction: column;
}
.tm-map-frame :deep(.tmap-outer),
.tm-map-frame :deep(.tmap) {
  flex: 1;
  height: 100%;
  min-height: 28rem;
}

.tm-map-placeholder {
  height: 100%;
  min-height: 22rem;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 0.5rem;
  border: 1.5px dashed var(--color-stroke);
  border-radius: 1rem;
  color: var(--color-muted);
  font-size: 0.85rem;
  padding: 1.5rem;
  text-align: center;
}
.tm-map-placeholder svg { width: 2rem; height: 2rem; opacity: 0.5; }
</style>
