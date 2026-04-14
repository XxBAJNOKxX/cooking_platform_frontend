

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

const fetchRecipes = async () => {
  isLoading.value = true
  error.value = ''

  try {
    recipes.value = []
  } catch (error) {
    error.value = 'Nem sikerült betölteni a recepteket.'
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchRecipes()
})

    return {
      recipes,
      isLoading,
      error,
      fetchRecipes,
      searchQuery
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
    </div>

    <div class="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
      <aside class="rounded-3xl border border-stroke bg-surface/40 p-5 shadow-sm">
        <h2 class="mb-4 text-lg font-bold text-text">Szűrők</h2>
        <p class="text-sm text-muted">
          Ide jön majd a FilterSidebar komponens.
        </p>
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
          v-else-if="recipes.length === 0"
          class="rounded-3xl border border-stroke bg-surface/30 p-8 text-center"
        >
          <p class="text-lg font-semibold text-text">Nincs még megjeleníthető recept.</p>
          <p class="mt-2 text-sm text-muted">
            Később itt fog megjelenni a lista a szűrési feltételek alapján.
          </p>
        </div>

        <div v-else class="grid gap-4">
          <article
            v-for="recipe in recipes"
            :key="recipe.id"
            class="rounded-3xl border border-stroke bg-bg p-5 shadow-sm"
          >
            <h3 class="text-lg font-bold text-text">
              {{ recipe.title }}
            </h3>
            <p class="mt-2 text-sm text-muted">
              {{ recipe.description }}
            </p>
          </article>
        </div>

        <div class="rounded-3xl border border-stroke bg-surface/30 p-4 text-sm text-muted">
          Vélemények: ...
        </div>
      </div>
    </div>
  </section>
</template>
