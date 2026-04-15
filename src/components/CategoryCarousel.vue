<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const categories = [
  {
    id: 'ho-vegi-tulelo',
    label: 'Hó végi túlélő',
    icon: '❄️',
    description: 'Alacsony költségű, kamra alapú receptek'
  },
  {
    id: '20-perces-vacsora',
    label: '20 perces vacsorák',
    icon: '⚡',
    description: 'Gyors és könnyű ételek'
  },
  {
    id: 'vasarnapi-klasszikus',
    label: 'Vasárnapi klasszikusok',
    icon: '☀️',
    description: 'Családi kedvencek'
  },
  {
    id: 'egytepsis-mentootlet',
    label: 'Egytepsis mentőötletek',
    icon: '🍳',
    description: 'Egy edényben nyájasság'
  },

]

const goToCategory = (categoryId) => {
  router.push({
    name: 'recipes',
    query: { category: categoryId }
  })
}
</script>

<template>
  <section class="category-carousel w-full px-4 py-8 sm:px-6 lg:px-8">
    <div class="mx-auto max-w-7xl">
      <h2 class="mb-6 text-2xl font-bold text-text sm:text-3xl">
        Böngéssz kategóriák szerint
      </h2>

      <div class="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
        <button
          v-for="category in categories"
          :key="category.id"
          @click="goToCategory(category.id)"
          class="group relative overflow-hidden rounded-2xl border border-stroke/40 bg-gradient-to-br from-surface/60 to-surface/30 p-4 sm:p-5 transition-all duration-300 hover:border-accent/60 hover:shadow-lg hover:from-surface/80 hover:to-surface/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
        >
          <div class="relative z-10 flex flex-col items-center justify-center gap-3 text-center">
            <div class="text-3xl sm:text-4xl transition-transform group-hover:scale-110">
              {{ category.icon }}
            </div>
            <div>
              <h3 class="font-bold text-sm sm:text-base text-text leading-snug">
                {{ category.label }}
              </h3>
              <p class="mt-1 text-xs text-muted line-clamp-2">
                {{ category.description }}
              </p>
            </div>
          </div>

          <div class="absolute inset-0 -z-10 bg-gradient-to-br from-accent/0 to-accent/10 opacity-0 transition-opacity group-hover:opacity-100" />
        </button>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* smooth transitions */
</style>
