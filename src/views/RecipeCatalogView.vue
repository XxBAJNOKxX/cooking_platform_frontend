<!-- Receptlista szűrőkkel, kereséssel és lapozással. -->

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter, isNavigationFailure } from 'vue-router'
import api from '@/services/api'
import RecipeCard from '@/components/recipe/RecipeCard.vue'
import RecipeSkeletonCard from '@/components/recipe/RecipeSkeletonCard.vue'
import FilterSidebar from '@/components/recipe/FilterSidebar.vue'
import Pagination from '@/components/Pagination.vue'

const route = useRoute()
const router = useRouter()

// State — receptek + meta + szűrők (URL-szinkronizált)
const recipes = ref([])
const meta = ref(null)
const loading = ref(false)
const error = ref('')
const categories = ref([])
const categoriesLoading = ref(true)

const filters = ref({
  search: '',
  category: '',
  difficulty: '',
  max_time: '',
})

function getQueryString(value) {
  if (Array.isArray(value)) return value[0] || ''
  return value || ''
}

function syncFromRoute() {
  const q = route.query
  filters.value = {
    search: getQueryString(q.search),
    category: getQueryString(q.category),
    difficulty: getQueryString(q.difficulty),
    max_time: q.max_time ? Number(getQueryString(q.max_time)) : '',
  }
}

// API params építése a szűrőkből
function buildParams(page = 1) {
  const p = { page, per_page: 18 }
  if (filters.value.search) p.search = filters.value.search
  if (filters.value.category) p.category = filters.value.category
  if (filters.value.difficulty) p.difficulty = filters.value.difficulty
  if (filters.value.max_time) p.max_time = filters.value.max_time
  return p
}

// Receptek lekérése
async function fetchRecipes(page = 1) {
  loading.value = true
  error.value = ''
  try {
    const { data } = await api.get('/recipes', { params: buildParams(page) })
    recipes.value = data.data
    meta.value = data.meta
  } catch (err) {
    if (import.meta.env.DEV) console.error('[fetchRecipes]', err)
    error.value = 'Nem sikerült betölteni a recepteket. Kérjük, próbáld újra.'
  } finally {
    loading.value = false
  }
}

// Kategóriák lekérése a szűrő sidebar-hoz; egyszer újrapróbál (cold-start hiba ellen)
async function fetchCategories({ retry = true } = {}) {
  categoriesLoading.value = true
  try {
    const { data } = await api.get('/categories')
    const list = data.data ?? []
    if (list.length === 0 && retry) {
      categoriesLoading.value = false
      await new Promise((r) => setTimeout(r, 400))
      return fetchCategories({ retry: false })
    }
    categories.value = list
  } catch (err) {
    if (import.meta.env.DEV) console.warn('[fetchCategories]', err)
    if (retry) {
      categoriesLoading.value = false
      await new Promise((r) => setTimeout(r, 600))
      return fetchCategories({ retry: false })
    }
    // hiba elnyelve — a dropdown így is használható "Összes kategória" opcióval
  } finally {
    categoriesLoading.value = false
  }
}

// Sidebar szűrő-változás → URL frissítés (deep link / vissza-előre navigáció)
function onFiltersUpdate(newFilters) {
  filters.value = { ...newFilters }

  const query = {}
  if (newFilters.search) query.search = newFilters.search
  if (newFilters.category) query.category = newFilters.category
  if (newFilters.difficulty) query.difficulty = newFilters.difficulty
  if (newFilters.max_time) query.max_time = String(newFilters.max_time)

  router.push({ name: 'recipes', query }).catch((err) => {
    if (!isNavigationFailure(err) && import.meta.env.DEV) console.error('[navigation]', err)
  })
}

// URL query változásra refetch
watch(
  () => route.query,
  () => {
    syncFromRoute()
    fetchRecipes(1)
    if (categories.value.length === 0 && !categoriesLoading.value) {
      fetchCategories()
    }
  },
  { deep: true },
)

// Lapozó callback
function onPageChange(page) {
  fetchRecipes(page)
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// Mount: állapot szinkronizálás URL-ből + kezdeti lekérések
onMounted(() => {
  syncFromRoute()
  Promise.all([fetchCategories(), fetchRecipes(1)])
})

// Computed segédek a chip-ek megjelenítéséhez és a "Találatok" feliratokhoz
const hasFilters = computed(() =>
  Object.values(filters.value).some((v) => v !== '' && v !== null && v !== undefined),
)

const resultLabel = computed(() => {
  if (!meta.value) return ''
  const t = meta.value.total
  return t === 0 ? 'Nincs találat' : `${t} recept`
})

function removeFilter(key) {
  onFiltersUpdate({ ...filters.value, [key]: '' })
}

const activeCategories = computed(() => {
  const raw = filters.value.category ?? ''
  if (!raw) return []
  return String(raw)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
})

function removeCategory(name) {
  const next = activeCategories.value.filter((c) => c !== name).join(',')
  onFiltersUpdate({ ...filters.value, category: next })
}

function onFavoriteToggled({ id, favorited }) {
  const recipe = recipes.value.find((r) => r.id === id)
  if (recipe) recipe.is_favorited = favorited
}
</script>

<template>
  <div class="cat-root">
    <!-- Page header -->
    <header class="cat-header">
      <div class="cat-header-content">
        <h1 class="cat-title">Receptek</h1>
        <p v-if="!loading && meta" class="cat-count">{{ resultLabel }}</p>
        <p v-else-if="loading" class="cat-count cat-count-loading">Betöltés…</p>
      </div>
    </header>

    <!-- Main two-column layout -->
    <div class="cat-layout">
      <!-- Filter sidebar -->
      <aside class="cat-sidebar-col">
        <FilterSidebar
          :model-value="filters"
          :categories="categories"
          :categories-loading="categoriesLoading"
          @update:model-value="onFiltersUpdate"
        />
      </aside>

      <!-- Results column -->
      <section class="cat-results-col">
        <!-- Active filter tags -->
        <div v-if="hasFilters" class="cat-active-tags">
          <span class="tags-label">Aktív szűrők:</span>

          <button v-if="filters.search" class="tag" @click="removeFilter('search')">
            "{{ filters.search }}"
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="3"
              class="tag-x"
              aria-hidden="true"
            >
              <path d="M18 6L6 18M6 6l12 12" stroke-linecap="round" />
            </svg>
          </button>

          <button
            v-for="cat in activeCategories"
            :key="`cat-${cat}`"
            class="tag"
            @click="removeCategory(cat)"
          >
            {{ cat }}
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="3"
              class="tag-x"
              aria-hidden="true"
            >
              <path d="M18 6L6 18M6 6l12 12" stroke-linecap="round" />
            </svg>
          </button>

          <button v-if="filters.difficulty" class="tag" @click="removeFilter('difficulty')">
            {{ filters.difficulty }}
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="3"
              class="tag-x"
              aria-hidden="true"
            >
              <path d="M18 6L6 18M6 6l12 12" stroke-linecap="round" />
            </svg>
          </button>

          <button v-if="filters.max_time" class="tag" @click="removeFilter('max_time')">
            Max. {{ filters.max_time }} perc
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="3"
              class="tag-x"
              aria-hidden="true"
            >
              <path d="M18 6L6 18M6 6l12 12" stroke-linecap="round" />
            </svg>
          </button>
        </div>

        <!-- Loading: skeleton grid -->
        <div v-if="loading" class="recipe-grid" aria-busy="true" aria-label="Receptek betöltése">
          <RecipeSkeletonCard v-for="i in 9" :key="i" :index="i" />
        </div>

        <!-- Error state -->
        <div v-else-if="error" class="cat-state">
          <div class="state-ico state-ico-err">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" stroke-linecap="round" />
              <line x1="12" y1="16" x2="12.01" y2="16" stroke-linecap="round" />
            </svg>
          </div>
          <p class="state-title">{{ error }}</p>
          <button class="state-btn" @click="fetchRecipes(1)">Újra próbálom</button>
        </div>

        <!-- Empty state -->
        <div v-else-if="recipes.length === 0" class="cat-state">
          <div class="state-ico">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" stroke-linecap="round" />
            </svg>
          </div>
          <p class="state-title">Nincs találat</p>
          <p class="state-desc">Próbálj más szűrőfeltételekkel keresni.</p>
          <button
            v-if="hasFilters"
            class="state-btn"
            @click="onFiltersUpdate({ search: '', category: '', difficulty: '', max_time: '' })"
          >
            Szűrők törlése
          </button>
        </div>

        <!-- Recipe grid -->
        <div v-else class="recipe-grid">
          <RecipeCard
            v-for="(recipe, i) in recipes"
            :key="recipe.id"
            :recipe="recipe"
            :index="i"
            @favorite-toggled="onFavoriteToggled"
          />
        </div>

        <!-- Pagination -->
        <Pagination
          v-if="!loading && meta && meta.last_page > 1"
          :meta="meta"
          @page-change="onPageChange"
        />
      </section>
    </div>
  </div>
</template>

<style scoped>
.cat-root {
  padding-bottom: 72px;
}

/* ---- Header ---- */
.cat-header {
  padding-bottom: 22px;
  border-bottom: 1.5px solid var(--color-stroke);
  margin-bottom: 30px;
}

.cat-header-content {
  display: flex;
  align-items: baseline;
  gap: 12px;
  flex-wrap: wrap;
}

.cat-title {
  margin: 0;
  font-size: clamp(1.6rem, 4vw, 2.2rem);
  font-weight: 800;
  letter-spacing: -0.025em;
  color: var(--color-text);
}

.cat-count {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-muted);
  margin: 0;
}

.cat-count-loading {
  animation: blink 1.4s ease-in-out infinite;
}

@keyframes blink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.45;
  }
}

/* ---- Layout ---- */
.cat-layout {
  display: grid;
  grid-template-columns: 264px 1fr;
  gap: 28px;
}

@media (max-width: 767px) {
  .cat-layout {
    grid-template-columns: 1fr;
    gap: 14px;
  }
}

/* ---- Sidebar ---- */
@media (min-width: 768px) {
  .cat-sidebar-col {
    position: sticky;
    top: 88px;
    align-self: start;
    padding: 20px;
    border: 1.5px solid var(--color-stroke);
    border-radius: 18px;
    background: var(--color-bg);
  }
}

/* ---- Active filter tags ---- */
.cat-active-tags {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  margin-bottom: 18px;
}

.tags-label {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--color-muted);
  flex-shrink: 0;
}

.tag {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 11px;
  border-radius: 20px;
  font-size: 0.78rem;
  font-weight: 600;
  border: 1.5px solid var(--color-accent-soft);
  background: color-mix(in srgb, var(--color-accent) 8%, transparent);
  color: var(--color-accent);
  cursor: pointer;
  transition:
    background 130ms var(--ease-ui-out),
    transform 130ms var(--ease-ui-out);
}
.tag:hover {
  background: color-mix(in srgb, var(--color-accent) 15%, transparent);
}
.tag:active {
  transform: scale(0.94);
}

.tag-x {
  width: 10px;
  height: 10px;
  flex-shrink: 0;
}

/* ---- Recipe grid ---- */
.recipe-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

@media (max-width: 1199px) {
  .recipe-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media (max-width: 479px) {
  .recipe-grid {
    grid-template-columns: 1fr;
  }
}

/* ---- States (empty / error) ---- */
.cat-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-height: 340px;
  text-align: center;
  animation: fadeIn 250ms var(--ease-ui-out) both;
}

.state-ico {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--color-surface);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-muted);
}
.state-ico svg {
  width: 26px;
  height: 26px;
}

.state-ico-err {
  background: color-mix(in srgb, var(--color-danger) 10%, transparent);
  color: var(--color-danger);
}

.state-title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-text);
  margin: 0;
}

.state-desc {
  font-size: 0.875rem;
  color: var(--color-muted);
  margin: 0;
}

.state-btn {
  margin-top: 4px;
  padding: 8px 22px;
  border-radius: 10px;
  border: 1.5px solid var(--color-stroke);
  background: var(--color-bg);
  color: var(--color-text);
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition:
    background 150ms var(--ease-ui-out),
    transform 150ms var(--ease-ui-out);
}
.state-btn:hover {
  background: var(--color-surface);
}
.state-btn:active {
  transform: scale(0.97);
}
</style>
