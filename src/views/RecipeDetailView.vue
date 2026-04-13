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

      <section class="hero" :class="{ 'hero-no-img': !recipe.image_url }">
        <div
          v-if="recipe.image_url"
          class="hero-img"
          :style="`background-image: url('${recipe.image_url}')`"
          aria-hidden="true"
        />
        <div class="hero-overlay">
          <div class="hero-top">
            <button class="btn-back" @click="router.back()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M19 12H5M5 12l7-7M5 12l7 7" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              Vissza
            </button>

            <div v-if="isOwner" class="owner-actions">
              <router-link :to="{ name: 'recipe-edit', params: { id: recipe.id } }" class="btn-owner">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke-linecap="round"/>
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke-linecap="round"/>
                </svg>
                Szerkesztés
              </router-link>
              <button class="btn-owner btn-danger-owner" @click="showDeleteModal = true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3,6 5,6 21,6"/><path d="M19,6l-1,14H6L5,6"/>
                  <path d="M10 11v6M14 11v6M9 6V4h6v2" stroke-linecap="round"/>
                </svg>
                Törlés
              </button>
            </div>
          </div>

          <div class="hero-body">
            <div class="badge-row">
              <span v-for="cat in recipe.categories" :key="cat.id" class="badge">{{ cat.name }}</span>
            </div>
            <h1 class="hero-title">{{ recipe.title }}</h1>
            <div class="hero-meta">
              <span class="meta-chip">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="chip-icon">
                  <circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/>
                </svg>
                {{ recipe.prep_time }} perc
              </span>
              <span class="meta-chip">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="chip-icon">
                  <path d="M3 3h18v4H3zM3 10h18v4H3zM3 17h18v4H3z"/>
                </svg>
                {{ difficultyLabel }}
              </span>
              <span v-if="recipe.author" class="meta-chip">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="chip-icon">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
                </svg>
                {{ recipe.author.username }}
              </span>
              <span v-if="averageRating" class="meta-chip meta-stars">
                <StarRating :model-value="averageRating" :show-count="true" :count="recipe.reviews.length" />
              </span>
            </div>
          </div>
        </div>
      </section>

      <div class="content-grid">

        <aside class="sidebar">
          <div class="card">
            <h2 class="card-title">Hozzávalók</h2>
            <PortionCalculator :default="DEFAULT_PORTIONS" @change="portions = $event" />
            <IngredientList
              :ingredients="recipe.ingredients"
              :base-portions="DEFAULT_PORTIONS"
              :current-portions="portions"
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

          <section class="card reviews-card">
            <div class="reviews-header">
              <h2 class="card-title no-border-bottom" style="margin-bottom:0">Értékelések</h2>
              <div v-if="averageRating" class="avg-block">
                <StarRating :model-value="averageRating" />
                <span class="avg-num">{{ averageRating.toFixed(1) }}</span>
                <span class="avg-label">/ 5 · {{ recipe.reviews.length }} db</span>
              </div>
            </div>

            <template v-if="authStore.isAuthenticated">
              <button
                v-if="!showReviewForm && !hasReviewed"
                class="btn-write-review"
                @click="showReviewForm = true"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="btn-icon">
                  <path d="M12 5v14M5 12h14" stroke-linecap="round"/>
                </svg>
                Értékelés írása
              </button>
              <p v-else-if="hasReviewed" class="already-msg">Már értékelted ezt a receptet.</p>
              <ReviewForm
                v-if="showReviewForm"
                :recipe-id="recipe.id"
                @submitted="onReviewSubmitted"
                @cancel="showReviewForm = false"
              />
            </template>
            <p v-else class="login-prompt">
              <router-link :to="{ name: 'login' }">Jelentkezz be</router-link>
              az értékeléshez.
            </p>

            <ReviewList :reviews="recipe.reviews" />
          </section>

        </main>
      </div>
    </template>

    <BaseModal v-if="showDeleteModal" :model-value="true" title="Recept törlése" @close="showDeleteModal = false; deleteError = ''">
      <p class="modal-body-text">
        Biztosan törölni szeretnéd a <strong>{{ recipe?.title }}</strong> receptet?
        Ez a művelet nem vonható vissza.
      </p>
      <p v-if="deleteError" class="delete-error">{{ deleteError }}</p>
      <template #footer>
        <div class="modal-footer-actions">
          <button class="btn-ghost" @click="showDeleteModal = false; deleteError = ''">Mégse</button>
          <button class="btn-danger" :disabled="deleting" @click="deleteRecipe">
            {{ deleting ? 'Törlés...' : 'Törlés' }}
          </button>
        </div>
      </template>
    </BaseModal>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import BaseModal from '@/components/BaseModal.vue'
import StarRating from '@/components/recipe/StarRating.vue'
import PortionCalculator from '@/components/recipe/PortionCalculator.vue'
import IngredientList from '@/components/recipe/IngredientList.vue'
import StepList from '@/components/recipe/StepList.vue'
import ReviewList from '@/components/recipe/ReviewList.vue'
import ReviewForm from '@/components/recipe/ReviewForm.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const DEFAULT_PORTIONS = 4
const recipe = ref(null)
const loading = ref(true)
const error = ref('')
const portions = ref(DEFAULT_PORTIONS)
const showReviewForm = ref(false)
const showDeleteModal = ref(false)
const deleting = ref(false)
const deleteError = ref('')

const difficultyLabel = computed(() => ({
  easy: 'Könnyű', medium: 'Közepes', hard: 'Nehéz'
})[recipe.value?.difficulty] ?? recipe.value?.difficulty)

const averageRating = computed(() => {
  const rs = recipe.value?.reviews
  if (!rs?.length) return 0
  return rs.reduce((s, r) => s + r.rating, 0) / rs.length
})

const isOwner = computed(() =>
  authStore.isAuthenticated && authStore.user?.id === recipe.value?.author?.id
)

const hasReviewed = computed(() =>
  authStore.isAuthenticated &&
  recipe.value?.reviews?.some(r => r.user?.id === authStore.user?.id)
)

async function fetchRecipe() {
  loading.value = true
  error.value = ''
  try {
    const { data } = await api.get(`/recipes/${route.params.id}`)
    recipe.value = data.data
  } catch (err) {
    error.value = err.response?.status === 404
      ? 'A recept nem található.'
      : 'Hiba történt a recept betöltésekor.'
  } finally {
    loading.value = false
  }
}

function onReviewSubmitted(review) {
  recipe.value.reviews.unshift(review)
  showReviewForm.value = false
}

async function deleteRecipe() {
  deleting.value = true
  deleteError.value = ''
  try {
    await api.delete(`/recipes/${recipe.value.id}`)
    router.push({ name: 'home' })
  } catch (err) {
    deleteError.value = err.response?.data?.message ?? 'Törlés sikertelen. Próbáld újra.'
  } finally {
    deleting.value = false
  }
}

onMounted(fetchRecipe)
</script>

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

.hero {
  position: relative;
  min-height: 420px;
  overflow: hidden;
}

.hero-no-img {
  min-height: 240px;
  background: var(--color-surface);
}

.hero-img {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  transform: scale(1.02);
  transition: transform 600ms var(--ease-ui-out);
}

@media (hover: hover) and (pointer: fine) {
  .hero:hover .hero-img { transform: scale(1.05); }
}

.hero-overlay {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 420px;
  padding: 20px 28px 28px;
  background: linear-gradient(
    to bottom,
    rgba(0,0,0,0.15) 0%,
    rgba(0,0,0,0.0) 35%,
    rgba(0,0,0,0.72) 100%
  );
}

.hero-no-img .hero-overlay {
  background: none;
  min-height: 240px;
}

.hero-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
}

.btn-back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border-radius: 10px;
  font-size: 0.875rem;
  font-weight: 600;
  border: 1.5px solid rgba(255,255,255,0.35);
  background: rgba(255,255,255,0.12);
  color: #fff;
  cursor: pointer;
  backdrop-filter: blur(6px);
  transition: background 150ms var(--ease-ui-out), transform 150ms var(--ease-ui-out);
  animation: fadeSlideDown 350ms var(--ease-ui-out) both;
}

.hero-no-img .btn-back {
  border-color: var(--color-stroke);
  background: var(--color-bg);
  color: var(--color-text);
}

.btn-back svg { width: 16px; height: 16px; }
.btn-back:hover { background: rgba(255,255,255,0.22); }
.btn-back:active { transform: scale(0.96); }

@keyframes fadeSlideDown {
  from { opacity: 0; transform: translateY(-10px); }
  to   { opacity: 1; transform: translateY(0); }
}

.owner-actions {
  display: flex;
  gap: 8px;
  animation: fadeSlideDown 350ms var(--ease-ui-out) 60ms both;
}

.btn-owner {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border-radius: 10px;
  font-size: 0.825rem;
  font-weight: 600;
  cursor: pointer;
  backdrop-filter: blur(6px);
  text-decoration: none;
  transition: background 150ms var(--ease-ui-out), transform 150ms var(--ease-ui-out);
  border: 1.5px solid rgba(255,255,255,0.35);
  background: rgba(255,255,255,0.15);
  color: #fff;
}
.btn-owner svg { width: 14px; height: 14px; }
.btn-owner:hover { background: rgba(255,255,255,0.28); }
.btn-owner:active { transform: scale(0.96); }

.btn-danger-owner {
  border-color: rgba(255,100,100,0.5);
  background: rgba(255,100,100,0.18);
}
.btn-danger-owner:hover { background: rgba(255,100,100,0.32); }

.hero-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
  animation: fadeSlideUp 300ms var(--ease-ui-out) 80ms both;
}

@keyframes fadeSlideUp {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}

.badge-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.badge {
  padding: 3px 12px;
  border-radius: 20px;
  font-size: 0.775rem;
  font-weight: 600;
  border: 1px solid rgba(255,255,255,0.35);
  background: rgba(255,255,255,0.15);
  color: #fff;
  backdrop-filter: blur(4px);
  letter-spacing: 0.02em;
}

.hero-title {
  margin: 0;
  font-size: clamp(1.6rem, 4vw, 2.4rem);
  font-weight: 800;
  color: #fff;
  line-height: 1.2;
  text-shadow: 0 2px 12px rgba(0,0,0,0.3);
}

.hero-no-img .hero-title { color: var(--color-text); text-shadow: none; }

.hero-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.meta-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 12px;
  border-radius: 8px;
  font-size: 0.825rem;
  font-weight: 600;
  background: rgba(0,0,0,0.3);
  color: rgba(255,255,255,0.92);
  backdrop-filter: blur(4px);
}

.hero-no-img .meta-chip {
  background: var(--color-surface);
  color: var(--color-text);
}

.chip-icon { width: 13px; height: 13px; flex-shrink: 0; }

.meta-stars { background: rgba(233,105,44,0.4); }

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
  .hero-overlay { padding: 16px 16px 22px; }
}

.sidebar {
  position: sticky;
  top: 80px;
  align-self: start;
}

.card {
  background: var(--color-bg);
  border: 1.5px solid var(--color-stroke);
  border-radius: 18px;
  padding: 22px;
  margin-bottom: 20px;
  animation: cardFadeIn 300ms var(--ease-ui-out) both;
}

.card:last-child { margin-bottom: 0; }

@keyframes cardFadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
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

.card-title.no-border-bottom {
  border-bottom: none;
  padding-bottom: 0;
}

.description {
  margin: 0;
  color: var(--color-muted);
  line-height: 1.75;
  font-size: 0.95rem;
}

.reviews-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
  padding-bottom: 10px;
  border-bottom: 2px solid var(--color-surface);
}

.avg-block {
  display: flex;
  align-items: center;
  gap: 5px;
}

.avg-num {
  font-weight: 800;
  font-size: 1rem;
  color: var(--color-text);
}

.avg-label {
  font-size: 0.825rem;
  color: var(--color-muted);
}

.btn-write-review {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 18px;
  background: var(--color-accent);
  color: var(--color-bg);
  border: none;
  border-radius: 10px;
  font-size: 0.875rem;
  font-weight: 700;
  cursor: pointer;
  margin-bottom: 14px;
  transition: background 150ms var(--ease-ui-out), transform 150ms var(--ease-ui-out);
}

.btn-write-review .btn-icon { width: 14px; height: 14px; }
.btn-write-review:hover { background: var(--color-accent-hover); }
.btn-write-review:active { transform: scale(0.97); }

.already-msg {
  font-size: 0.875rem;
  color: var(--color-muted);
  margin-bottom: 14px;
}

.login-prompt {
  font-size: 0.9rem;
  color: var(--color-muted);
  margin-bottom: 14px;
}

.login-prompt a {
  color: var(--color-accent);
  font-weight: 600;
  text-decoration: underline;
  text-decoration-color: color-mix(in srgb, var(--color-accent) 40%, transparent);
  text-underline-offset: 3px;
  transition: color 150ms;
}

.login-prompt a:hover { color: var(--color-accent-hover); }

.modal-body-text {
  color: var(--color-muted);
  line-height: 1.6;
  font-size: 0.95rem;
  margin: 0;
}

.delete-error {
  margin: 12px 0 0;
  font-size: 0.875rem;
  color: var(--color-danger);
  background: color-mix(in srgb, var(--color-danger) 8%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-danger) 20%, transparent);
  border-radius: 8px;
  padding: 8px 12px;
}

.modal-footer-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.btn-ghost {
  padding: 8px 18px;
  border: 1.5px solid var(--color-stroke);
  border-radius: 10px;
  background: transparent;
  color: var(--color-muted);
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 150ms var(--ease-ui-out), transform 150ms var(--ease-ui-out);
}

.btn-ghost:hover { background: var(--color-surface); color: var(--color-text); }
.btn-ghost:active { transform: scale(0.97); }

.btn-danger {
  padding: 8px 20px;
  border: none;
  border-radius: 10px;
  background: var(--color-danger);
  color: #fff;
  font-size: 0.875rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 150ms var(--ease-ui-out), transform 150ms var(--ease-ui-out);
}

.btn-danger:hover:not(:disabled) { background: var(--color-danger-hover); }
.btn-danger:active:not(:disabled) { transform: scale(0.97); }
.btn-danger:disabled { opacity: 0.55; cursor: not-allowed; }
</style>
