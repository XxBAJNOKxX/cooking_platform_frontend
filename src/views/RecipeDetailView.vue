<!-- Recept részletező — hero, hozzávalók, lépések, értékelések, naptárhoz adás. -->

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useRecipeDetail } from '@/composables/useRecipeDetail'

import LoadingSpinner from '@/components/LoadingSpinner.vue'
import PortionCalculator from '@/components/recipe/PortionCalculator.vue'
import IngredientList from '@/components/recipe/IngredientList.vue'
import StepList from '@/components/recipe/StepList.vue'
import RecipeHero from '@/components/recipe/RecipeHero.vue'
import RecipeReviewsSection from '@/components/recipe/RecipeReviewsSection.vue'
import AddToCalendarModal from '@/components/recipe/AddToCalendarModal.vue'
import DeleteConfirmModal from '@/components/recipe/DeleteConfirmModal.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const recipeId = computed(() => route.params.id)

const {
  recipe,
  loading,
  error,
  favorited,
  favLoading,
  isOwner,
  averageRating,
  hasReviewed,
  fetchRecipe,
  toggleFavorite,
  deleteRecipe,
  deleting,
  deleteError,
  addReview,
  updateReview,
  deleteReview,
} = useRecipeDetail(recipeId)

const portions = ref(4)
const defaultPortions = computed(() => recipe.value?.servings ?? 4)
watch(defaultPortions, (v) => {
  portions.value = v
})

const showCalendarModal = ref(false)
const showDeleteModal = ref(false)

async function onDeleteConfirm() {
  const ok = await deleteRecipe()
  if (ok) router.push({ name: 'home' })
}

onMounted(fetchRecipe)
</script>

<template>
  <div class="page">
    <div v-if="loading" class="state-center">
      <LoadingSpinner />
    </div>

    <div v-else-if="error" class="state-center">
      <p class="error-msg">{{ error }}</p>
      <button class="btn-ghost" @click="router.back()">← Vissza</button>
    </div>

    <template v-else-if="recipe">
      <RecipeHero
        :recipe="recipe"
        :is-owner="isOwner"
        :is-authenticated="authStore.isAuthenticated"
        :favorited="favorited"
        :fav-loading="favLoading"
        :average-rating="averageRating"
        @toggle-favorite="toggleFavorite"
        @delete="showDeleteModal = true"
        @add-to-calendar="showCalendarModal = true"
      />

      <div class="content-grid">
        <aside class="sidebar">
          <div class="card">
            <h2 class="card-title">Hozzávalók</h2>
            <PortionCalculator
              v-if="recipe.servings"
              :default="defaultPortions"
              @change="portions = $event"
            />
            <IngredientList
              :ingredients="recipe.ingredients"
              :base-portions="recipe.servings ? defaultPortions : 1"
              :current-portions="recipe.servings ? portions : 1"
            />
          </div>
        </aside>

        <main class="main">
          <section class="card">
            <h2 class="card-title">Leírás</h2>
            <p class="description">{{ recipe.description }}</p>
          </section>

          <section class="card">
            <h2 class="card-title">Elkészítés</h2>
            <StepList :steps="recipe.steps" />
          </section>

          <RecipeReviewsSection
            :recipe="recipe"
            :is-authenticated="authStore.isAuthenticated"
            :is-owner="isOwner"
            :has-reviewed="hasReviewed"
            :average-rating="averageRating"
            :update-review="updateReview"
            :delete-review="deleteReview"
            @review-submitted="addReview"
          />
        </main>
      </div>
    </template>

    <AddToCalendarModal v-model="showCalendarModal" :recipe="recipe" />

    <DeleteConfirmModal
      v-model="showDeleteModal"
      title="Recept törlése"
      :item-name="recipe?.title ?? ''"
      body-prefix="Biztosan törölni szeretnéd a"
      body-suffix="receptet? Ez a művelet nem vonható vissza."
      :deleting="deleting"
      :error-message="deleteError || ''"
      @confirm="onDeleteConfirm"
    />
  </div>
</template>

<style scoped>
.page {
  min-height: 100vh;
  background: var(--color-bg);
}

.state-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  min-height: 50vh;
}

.error-msg {
  color: var(--color-danger);
  font-weight: 600;
}

.content-grid {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 24px;
  max-width: 1120px;
  margin: 0 auto;
  padding: 28px 24px 60px;
}

@media (max-width: 768px) {
  .content-grid {
    grid-template-columns: 1fr;
    padding: 16px 14px 48px;
  }
}

@media (min-width: 1024px) {
  .sidebar {
    position: sticky;
    top: 80px;
    align-self: start;
  }
}

.card {
  background: var(--color-bg);
  border: 1.5px solid var(--color-stroke);
  border-radius: 18px;
  padding: 22px;
  margin-bottom: 20px;
  animation: cardFadeIn 300ms var(--ease-ui-out) both;
}

.card:last-child {
  margin-bottom: 0;
}

.card-title {
  font-size: 1rem;
  font-weight: 800;
  color: var(--color-text);
  margin: 0 0 16px;
  padding-bottom: 10px;
  border-bottom: 2px solid var(--color-surface);
  letter-spacing: -0.01em;
}

.description {
  margin: 0;
  color: var(--color-muted);
  line-height: 1.75;
  font-size: 0.95rem;
  overflow-wrap: break-word;
  word-break: break-word;
}
</style>
