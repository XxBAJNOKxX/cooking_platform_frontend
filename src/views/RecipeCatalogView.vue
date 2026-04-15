

<script>
import { computed, ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import LoadingSpinner from '@/components/LoadingSpinner.vue'

export default {
  components: {
    LoadingSpinner
  },
  setup() {
    const route = useRoute()
    const recipes = ref([])
    const isLoading = ref(false)
    const error = ref('')

    const searchQuery = computed(() => {
      const value = route.query.q

      return typeof value === 'string' ? value.trim() : ''
    })

    const activeCategory = computed(() => {
      return route.query.category || null
    })

    const filteredRecipes = computed(() => {
      let result = recipes.value

      if (activeCategory.value) {
        result = result.filter((recipe) =>
          (recipe.category || '').toLowerCase() === activeCategory.value.toLowerCase()
        )
      }


      if (searchQuery.value) {
        const q = searchQuery.value.toLowerCase()
        result = result.filter((recipe) =>
          (recipe.title || '').toLowerCase().includes(q)
        )
      }

      return result
    })

    const fetchRecipes = async () => {
      isLoading.value = true
      error.value = ''

      try {
        recipes.value = [
          {
            id: 999,
            title: 'Rizibizi Husival',
            description: 'Teszt recept kereséshez',
            image_url: '/RizibiziHusival.jpg',
            category: 'ho-vegi-tulelo'
          }
        ]
      } finally {
        isLoading.value = false
      }
    }

    onMounted(() => {
      fetchRecipes()
    })

    return {
      recipes,
      filteredRecipes,
      isLoading,
      error,
      fetchRecipes,
      searchQuery,
      activeCategory
    }
  }
}
</script>

<template>
  <section class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
    <div class="mb-8 flex flex-col gap-3">

      <h1 class="text-4xl font-black tracking-tight text-text sm:text-5xl">
        Recept katalógus
      </h1>
      <p class="max-w-2xl text-sm text-muted sm:text-base">
    Böngéssz a legjobb ételreceptek között és találd meg a számodra tökéletes receptet.
      </p>
      <p v-if="searchQuery" class="max-w-2xl rounded-2xl border border-accent/20 bg-accent/10 px-4 py-3 text-sm font-medium text-text">
        Keresés erre: "{{ searchQuery }}"
      </p>
      <p v-if="activeCategory" class="max-w-2xl rounded-2xl border border-accent/20 bg-accent/10 px-4 py-3 text-sm font-medium text-text">
        Kategória: <strong>{{ activeCategory }}</strong>
      </p>
    </div>

    <div class="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
      <aside class="rounded-3xl border border-stroke bg-surface/40 p-5 shadow-sm">
        <h2 class="mb-4 text-lg font-bold text-text">Szűrés</h2>
        <div class="space-y-3">
          <div>
            <p class="text-xs font-semibold text-muted/70 uppercase tracking-wide">Kategóriák</p>
            <div class="mt-3 flex flex-wrap gap-2">
              <button
                @click="$router.push({ name: 'recipes', query: searchQuery ? { q: searchQuery } : {} })"
                :class="[
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                  !activeCategory
                    ? 'bg-accent text-white'
                    : 'bg-surface/60 text-text hover:bg-surface/80 border border-stroke'
                ]"
              >
                Összes
              </button>

              <button
                v-for="cat in ['ho-vegi-tulelo', '20-perces-vacsora', 'vasarnapi-klasszikus', 'egytepsis-mentootlet']"
                :key="cat"
                @click="$router.push({
                  name: 'recipes',
                  query: { category: cat, ...(searchQuery ? { q: searchQuery } : {}) }
                })"
                :class="[
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                  activeCategory === cat
                    ? 'bg-accent text-white'
                    : 'bg-surface/60 text-text hover:bg-surface/80 border border-stroke'
                ]"
              >
                {{ cat === 'ho-vegi-tulelo' ? '❄️ Hó végi túlélő' : cat === '20-perces-vacsora' ? '⚡ 20 perces ételek' : cat === 'vasarnapi-klasszikus' ? '☀️ Vasárnapi ételek' : '🍳 Egytepsis ételek' }}
              </button>
            </div>
          </div>
          <div>
            <p class="text-xs font-semibold text-muted/70 uppercase tracking-wide mt-4">Nehézség</p>
            <p class="text-sm text-muted mt-2">Könnyű, Közepes, Nehéz</p>
          </div>
        </div>
      </aside>

      <div class="space-y-6">
        <div
          v-if="isLoading"
          class="flex min-h-[300px] items-center justify-center rounded-3xl border border-stroke bg-surface/30"
        >
          <LoadingSpinner size="w-8 h-8" />
        </div>

        <div
          v-else-if="error"
          class="rounded-3xl border border-danger/30 bg-danger/10 p-5 text-danger"
        >
          {{ error }}
        </div>

        <div
          v-else-if="filteredRecipes.length === 0"
          class="rounded-3xl border border-stroke bg-surface/30 p-8 text-center"
        >
          <p class="text-lg font-semibold text-text">Nincs találat</p>
          <p class="mt-2 text-sm text-muted">
            Próbálj meg más keresőszót, vagy böngéssz a kategóriák között.
          </p>
        </div>

        <div v-else class="grid gap-4">
          <article
            v-for="recipe in filteredRecipes"
            :key="recipe.id"
            class="rounded-3xl border border-stroke bg-bg overflow-hidden shadow-sm"
          >
            <div v-if="recipe.image_url" class="h-56 overflow-hidden bg-surface">
              <img
                :src="recipe.image_url"
                :alt="recipe.title"
                class="h-full w-full object-cover object-center"
              />
            </div>
            <div class="p-5">
              <h3 class="text-lg font-bold text-text">
                {{ recipe.title }}
              </h3>
              <p class="mt-2 text-sm text-muted">
                {{ recipe.description }}
              </p>
            </div>
          </article>
        </div>


      </div>
    </div>
  </section>
</template>
