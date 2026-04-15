

<script>
import { computed, ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import FilterSidebar from './FilterSidebar.vue'
import RecipeCard from '@/components/RecipeCard.vue'

export default {
  components: {
    LoadingSpinner,
    FilterSidebar,
    RecipeCard
  },
  setup() {
    const route = useRoute()
    const router = useRouter()
    const recipes = ref([])
    const isLoading = ref(false)
    const error = ref('')
    const maxTime = ref(120)

    const searchQuery = computed(() => {
      const value = route.query.q

      return typeof value === 'string' ? value.trim() : ''
    })

    const categoryQuery = computed(() => {
      const value = route.query.category

      return typeof value === 'string' ? value.trim() : ''
    })

    const updateSearch = (value) => {
      router.push({
        name: 'recipes',
        query: {
          ...(value ? { q: value } : {}),
          ...(activeCategory.value ? { category: activeCategory.value } : {})
        }
      })
    }

    const updateCategory = (value) => {
      router.push({
        name: 'recipes',
        query: {
          ...(searchQuery.value ? { q: searchQuery.value } : {}),
          ...(value ? { category: value } : {})
        }
      })
    }

    const updateMaxTime = (value) => {
      maxTime.value = value
    }

    const resetFilters = () => {
      maxTime.value = 120
      router.push({ name: 'recipes' })
    }

    const activeCategory = computed(() => {
      return categoryQuery.value || null
    })

    const filteredRecipes = computed(() => {
      let result = recipes.value

      if (activeCategory.value) {
        result = result.filter((recipe) =>
          (recipe.category || '').toLowerCase() === activeCategory.value.toLowerCase()
        )
      }

      result = result.filter((recipe) => {
        const recipeTime = Number(recipe.maxMinutes ?? recipe.timeMinutes ?? 999)

        return recipeTime <= maxTime.value
      })


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
            category: 'ho-vegi-tulelo',
            maxMinutes: 35,
            difficulty: 'Könnyű'
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
      activeCategory,
      maxTime,
      updateSearch,
      updateCategory,
      updateMaxTime,
      resetFilters
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
      <FilterSidebar
        :search="searchQuery"
        :category="activeCategory || ''"
        :max-time="maxTime"
        @update:search="updateSearch"
        @update:category="updateCategory"
        @update:maxTime="updateMaxTime"
        @reset="resetFilters"
      />

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
          <RecipeCard
            v-for="recipe in filteredRecipes"
            :key="recipe.id"
            :recipe="recipe"
          />
        </div>


      </div>
    </div>
  </section>
</template>
