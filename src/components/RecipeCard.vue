<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'

defineProps({
  recipe: {
    type: Object,
    required: true
  }
})

const router = useRouter()

const getDifficultyColor = (difficulty) => {
  switch (difficulty) {
    case 'Könnyű':
      return 'bg-green-100 text-green-800'
    case 'Közepes':
      return 'bg-yellow-100 text-yellow-800'
    case 'Nehéz':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const goToRecipe = () => {
  router.push({ name: 'recipe-detail', params: { id: recipe.id } })
}
</script>

<template>
  <article class="rounded-3xl border border-stroke bg-bg overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer" @click="goToRecipe">
    <div v-if="recipe.image_url" class="h-56 overflow-hidden bg-surface">
      <img
        :src="recipe.image_url"
        :alt="recipe.title"
        class="h-full w-full object-cover object-center hover:scale-105 transition-transform duration-300"
      />
    </div>

    <div class="p-5">
      <div class="flex items-center justify-between mb-2 gap-2">
        <h3 class="text-lg font-bold text-text flex-1 line-clamp-2">
          {{ recipe.title }}
        </h3>
        <span v-if="recipe.difficulty" :class="getDifficultyColor(recipe.difficulty)" class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap">
          {{ recipe.difficulty }}
        </span>
      </div>

      <p class="text-sm text-muted line-clamp-2 mb-3">
        {{ recipe.description }}
      </p>

      <div class="flex items-center gap-4 text-xs text-muted">
        <div v-if="recipe.maxMinutes || recipe.timeMinutes" class="flex items-center gap-1">
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00-.447.894l1.341 1.341a1 1 0 001.414-1.414L10 9.414V6z" clip-rule="evenodd" />
          </svg>
          <span>{{ recipe.maxMinutes || recipe.timeMinutes }} perc</span>
        </div>

        <div v-if="recipe.category" class="flex items-center gap-1">
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06m0 0a1 1 0 001.047.26l4.423-1.529a1 1 0 00.766-1.052L7.60 3.591a1 1 0 00-.986-.837H4a1 1 0 00-1 1v2m6.892 13c-1.473 0-2.745-.922-3.517-2.205a2.457 2.457 0 00-.946-.482 2.458 2.458 0 01-.946-.482A3.482 3.482 0 003.5 17.207V18a1 1 0 001 1h12a1 1 0 001-1v-.793a3.482 3.482 0 00-2.917-3.453 2.458 2.458 0 01-.946-.482 2.457 2.457 0 00-.946.482c-.772 1.283-2.044 2.205-3.517 2.205z" />
          </svg>
          <span class="capitalize">{{ recipe.category }} kategóriában található.</span>
        </div>
      </div>
    </div>
  </article>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
