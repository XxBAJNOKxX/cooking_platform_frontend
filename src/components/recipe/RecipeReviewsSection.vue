<!-- Recept-részletező értékelés szekció (átlag + lista + új értékelés form). -->

<script setup>
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import StarRating from '@/components/recipe/StarRating.vue'
import ReviewList from '@/components/recipe/ReviewList.vue'
import ReviewForm from '@/components/recipe/ReviewForm.vue'

defineProps({
  recipe: { type: Object, required: true },
  isAuthenticated: { type: Boolean, default: false },
  isOwner: { type: Boolean, default: false },
  hasReviewed: { type: Boolean, default: false },
  averageRating: { type: Number, default: 0 },
  updateReview: { type: Function, default: null },
  deleteReview: { type: Function, default: null },
})

const emit = defineEmits(['review-submitted'])

const showReviewForm = ref(false)

function onSubmitted(review) {
  emit('review-submitted', review)
  showReviewForm.value = false
}
</script>

<template>
  <section class="card reviews-card">
    <div class="reviews-header">
      <h2 class="card-title no-border-bottom" style="margin-bottom: 0">Értékelések</h2>
      <div v-if="averageRating" class="avg-block">
        <StarRating :model-value="averageRating" />
        <span class="avg-num">{{ averageRating.toFixed(1) }}</span>
        <span class="avg-label">/ 5 · {{ recipe.reviews.length }} db</span>
      </div>
    </div>

    <template v-if="isAuthenticated">
      <p v-if="isOwner" class="owner-review-msg">Nem értékelheted a saját receptedet.</p>
      <template v-else>
        <button
          v-if="!showReviewForm && !hasReviewed"
          class="btn-write-review"
          @click="showReviewForm = true"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            class="btn-icon"
          >
            <path d="M12 5v14M5 12h14" stroke-linecap="round" />
          </svg>
          Értékelés írása
        </button>
        <p v-else-if="hasReviewed" class="already-msg">Már értékelted ezt a receptet.</p>
        <ReviewForm
          v-if="showReviewForm"
          :recipe-id="recipe.id"
          @submitted="onSubmitted"
          @cancel="showReviewForm = false"
        />
      </template>
    </template>
    <p v-else class="login-prompt">
      <RouterLink :to="{ name: 'login' }">Jelentkezz be</RouterLink>
      az értékeléshez.
    </p>

    <ReviewList
      v-if="!isOwner || (recipe.reviews && recipe.reviews.length > 0)"
      :reviews="recipe.reviews"
      :on-update="updateReview"
      :on-delete="deleteReview"
    />
  </section>
</template>

<style scoped>
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

.card-title.no-border-bottom {
  border-bottom: none;
  padding-bottom: 0;
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
  transition:
    background 150ms var(--ease-ui-out),
    transform 150ms var(--ease-ui-out);
}

.btn-write-review .btn-icon {
  width: 14px;
  height: 14px;
}
.btn-write-review:hover {
  background: var(--color-accent-hover);
}
.btn-write-review:active {
  transform: scale(0.97);
}

.already-msg,
.owner-review-msg {
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

.login-prompt a:hover {
  color: var(--color-accent-hover);
}
</style>
