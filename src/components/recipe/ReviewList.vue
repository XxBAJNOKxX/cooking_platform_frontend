<template>
  <div class="review-list">
    <p v-if="reviews.length === 0" class="empty">
      Még nincs értékelés — legyél az első!
    </p>

    <div v-else class="reviews">
      <article v-for="(review, i) in reviews" :key="review.id" class="review-card" :style="`--i: ${i}`">
        <div class="card-header">
          <RouterLink
            v-if="review.user?.id"
            :to="{ name: 'user-profile', params: { id: review.user.id } }"
            class="avatar-wrap avatar-link"
          >
            <img v-if="review.user.avatar_url" :src="review.user.avatar_url" :alt="review.user.username" class="avatar" />
            <div v-else class="avatar-placeholder">
              {{ review.user.username?.[0]?.toUpperCase() ?? '?' }}
            </div>
          </RouterLink>
          <div v-else class="avatar-wrap">
            <div class="avatar-placeholder">?</div>
          </div>

          <div class="meta">
            <RouterLink
              v-if="review.user?.id"
              :to="{ name: 'user-profile', params: { id: review.user.id } }"
              class="username username-link"
            >{{ review.user.username ?? 'Ismeretlen' }}</RouterLink>
            <span v-else class="username">Ismeretlen</span>
            <time class="date">{{ formatDate(review.created_at) }}</time>
          </div>

          <StarRating :model-value="review.rating" class="ml-auto" />
        </div>

        <p v-if="review.comment" class="comment">{{ review.comment }}</p>

        <img v-if="review.photo_url" :src="review.photo_url" class="review-photo" alt="Értékelés fotó" />
      </article>
    </div>
  </div>
</template>

<script setup>
import StarRating from './StarRating.vue'

defineProps({
  reviews: { type: Array, default: () => [] }
})

function formatDate(str) {
  if (!str) return ''
  return new Date(str).toLocaleDateString('hu-HU', {
    year: 'numeric', month: 'long', day: 'numeric'
  })
}
</script>

<style scoped>
.review-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.empty {
  text-align: center;
  color: var(--color-muted);
  padding: 32px 16px;
  font-size: 0.9rem;
  background: var(--color-surface);
  border-radius: 14px;
  border: 1.5px dashed var(--color-stroke);
}

.reviews {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.review-card {
  background: var(--color-bg);
  border: 1.5px solid var(--color-stroke);
  border-radius: 14px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  transition: border-color 180ms var(--ease-ui-out), box-shadow 180ms var(--ease-ui-out);
  animation: cardIn 280ms var(--ease-ui-out) both;
  animation-delay: calc(var(--i, 0) * 60ms);
}

@keyframes cardIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (hover: hover) and (pointer: fine) {
  .review-card:hover {
    border-color: var(--color-accent-soft);
    box-shadow: 0 4px 20px color-mix(in srgb, var(--color-accent) 10%, transparent);
  }
}

.card-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.avatar-wrap {
  flex-shrink: 0;
}

.avatar,
.avatar-placeholder {
  width: 38px;
  height: 38px;
  border-radius: 50%;
}

.avatar {
  object-fit: cover;
  border: 2px solid var(--color-stroke);
}

.avatar-placeholder {
  background: var(--color-accent);
  color: var(--color-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 0.9rem;
}

.meta {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.username {
  font-weight: 700;
  font-size: 0.9rem;
  color: var(--color-text);
}

.username-link { text-decoration: none; transition: color 150ms var(--ease-ui-out); }
.username-link:hover { color: var(--color-accent); }
.avatar-link { display: block; border-radius: 50%; }

.date {
  font-size: 0.775rem;
  color: var(--color-muted);
}

.ml-auto {
  margin-left: auto;
}

.comment {
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.65;
  color: var(--color-text);
  overflow-wrap: break-word;
  word-break: break-word;
}

.review-photo {
  width: 100%;
  max-height: 180px;
  object-fit: cover;
  border-radius: 10px;
  border: 1px solid var(--color-stroke);
}
</style>
