<!-- Recept-részletező hero (háttérkép, cím, meta chipek, owner akciók). -->

<script setup>
import { computed, ref, watch } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import StarRating from '@/components/recipe/StarRating.vue'

const CAT_VISIBLE_LIMIT = 3

const props = defineProps({
  recipe: { type: Object, required: true },
  isOwner: { type: Boolean, default: false },
  isAuthenticated: { type: Boolean, default: false },
  favorited: { type: Boolean, default: false },
  favLoading: { type: Boolean, default: false },
  averageRating: { type: Number, default: 0 },
})

const emit = defineEmits(['toggle-favorite', 'delete', 'add-to-calendar'])

const router = useRouter()
const showAllCats = ref(false)

const FALLBACK_IMAGE =
  import.meta.env.VITE_RECIPES_FALLBACK_IMAGE_URL ??
  'https://images.unsplash.com/photo-1495195134817-aeb325a55b65?auto=format&fit=crop&w=1600&q=70'

const effectiveImageUrl = ref(null)

watch(
  () => props.recipe?.image_url,
  (url) => {
    if (!url) {
      effectiveImageUrl.value = null
      return
    }
    effectiveImageUrl.value = url
    const probe = new Image()
    probe.onerror = () => {
      if (props.recipe?.image_url === url) effectiveImageUrl.value = FALLBACK_IMAGE
    }
    probe.src = url
  },
  { immediate: true },
)

const heroImageStyle = computed(() => {
  const url = effectiveImageUrl.value
  if (!url) return null
  const safeUrl = String(url).replace(/"/g, '%22')
  return { backgroundImage: `url("${safeUrl}")` }
})

const difficultyLabel = computed(() => {
  const map = {
    Könnyű: 'Könnyű',
    Közepes: 'Közepes',
    Nehéz: 'Nehéz',
    easy: 'Könnyű',
    medium: 'Közepes',
    hard: 'Nehéz',
  }
  return map[props.recipe?.difficulty] ?? props.recipe?.difficulty
})

const visibleCats = computed(() => (props.recipe?.categories ?? []).slice(0, CAT_VISIBLE_LIMIT))
const hiddenCats = computed(() => (props.recipe?.categories ?? []).slice(CAT_VISIBLE_LIMIT))
const hiddenCatsCount = computed(() => hiddenCats.value.length)
</script>

<template>
  <section class="hero" :class="{ 'hero-no-img': !effectiveImageUrl }">
    <div v-if="effectiveImageUrl" class="hero-img" :style="heroImageStyle" aria-hidden="true" />
    <div class="hero-overlay">
      <div class="hero-top">
        <button class="btn-back" @click="router.back()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M19 12H5M5 12l7-7M5 12l7 7" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          Vissza
        </button>

        <div class="owner-actions">
          <button
            v-if="isAuthenticated && !isOwner"
            class="btn-owner btn-fav"
            :class="{ 'btn-fav--on': favorited }"
            :disabled="favLoading"
            @click="emit('toggle-favorite')"
            :aria-label="favorited ? 'Eltávolítás a kedvencek közül' : 'Hozzáadás a kedvencekhez'"
            :aria-pressed="favorited"
          >
            <svg
              viewBox="0 0 24 24"
              :fill="favorited ? 'currentColor' : 'none'"
              stroke="currentColor"
              stroke-width="2"
              aria-hidden="true"
            >
              <path
                d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            {{ favorited ? 'Kedvenc' : 'Kedvencekhez' }}
          </button>
          <template v-if="isOwner">
            <RouterLink :to="{ name: 'recipe-edit', params: { id: recipe.id } }" class="btn-owner">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path
                  d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"
                  stroke-linecap="round"
                />
                <path
                  d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"
                  stroke-linecap="round"
                />
              </svg>
              Szerkesztés
            </RouterLink>
            <button class="btn-owner btn-danger-owner" @click="emit('delete')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3,6 5,6 21,6" />
                <path d="M19,6l-1,14H6L5,6" />
                <path d="M10 11v6M14 11v6M9 6V4h6v2" stroke-linecap="round" />
              </svg>
              Törlés
            </button>
          </template>
        </div>
      </div>

      <div class="hero-body">
        <h1 class="hero-title">{{ recipe.title }}</h1>
        <div class="hero-meta">
          <RouterLink
            :to="{ name: 'recipes', query: { max_time: recipe.prep_time } }"
            class="meta-chip meta-link"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              class="chip-icon"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12,6 12,12 16,14" />
            </svg>
            {{ recipe.prep_time }} perc
          </RouterLink>
          <RouterLink
            :to="{ name: 'recipes', query: { difficulty: recipe.difficulty } }"
            class="meta-chip meta-link"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              class="chip-icon"
            >
              <path d="M3 3h18v4H3zM3 10h18v4H3zM3 17h18v4H3z" />
            </svg>
            {{ difficultyLabel }}
          </RouterLink>
          <span v-if="recipe.servings" class="meta-chip">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              class="chip-icon"
            >
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke-linecap="round" />
            </svg>
            {{ recipe.servings }} fő
          </span>
          <RouterLink
            v-if="recipe.author"
            :to="{ name: 'user-profile', params: { id: recipe.author.id } }"
            class="meta-chip meta-link"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              class="chip-icon"
            >
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            {{ recipe.author.username }}
          </RouterLink>
          <span v-if="averageRating" class="meta-chip meta-stars">
            <StarRating
              :model-value="averageRating"
              :show-count="true"
              :count="recipe.reviews.length"
            />
          </span>
        </div>

        <div class="hero-cta-row">
          <div class="hero-cats">
            <RouterLink
              v-for="cat in visibleCats"
              :key="cat.id"
              :to="{ name: 'recipes', query: { category: cat.name } }"
              class="badge badge-link"
              >{{ cat.name }}</RouterLink
            >
            <button
              v-if="hiddenCatsCount > 0 && !showAllCats"
              type="button"
              class="badge badge-more"
              @click="showAllCats = true"
            >
              +{{ hiddenCatsCount }}
            </button>
            <template v-if="showAllCats">
              <RouterLink
                v-for="cat in hiddenCats"
                :key="`h-${cat.id}`"
                :to="{ name: 'recipes', query: { category: cat.name } }"
                class="badge badge-link"
                >{{ cat.name }}</RouterLink
              >
            </template>
          </div>
          <button v-if="isAuthenticated" class="btn-add-cal" @click="emit('add-to-calendar')">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              aria-hidden="true"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
              <line x1="8" y1="14" x2="8" y2="14" stroke-linecap="round" stroke-width="3" />
              <line x1="12" y1="14" x2="12" y2="14" stroke-linecap="round" stroke-width="3" />
            </svg>
            Naptárhoz adás
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.hero {
  position: relative;
  min-height: 420px;
  overflow: hidden;
  border-radius: 40px;
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
  .hero:hover .hero-img {
    transform: scale(1.05);
  }
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
    rgba(0, 0, 0, 0.15) 0%,
    rgba(0, 0, 0, 0) 35%,
    rgba(0, 0, 0, 0.72) 100%
  );
  border-radius: 40px;
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
  border: 1.5px solid rgba(255, 255, 255, 0.55);
  background: rgba(255, 255, 255, 0.24);
  color: #fff;
  cursor: pointer;
  backdrop-filter: blur(8px);
  transition:
    background 150ms var(--ease-ui-out),
    transform 150ms var(--ease-ui-out);
  animation: fadeSlideDown 350ms var(--ease-ui-out) both;
}

.hero-no-img .btn-back {
  border-color: var(--color-stroke);
  background: var(--color-bg);
  color: var(--color-text);
  margin-bottom: 2rem;
}

.btn-back svg {
  width: 16px;
  height: 16px;
}
.btn-back:hover {
  background: rgba(255, 255, 255, 0.36);
}
.btn-back:active {
  transform: scale(0.96);
}

@keyframes fadeSlideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
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
  backdrop-filter: blur(8px);
  text-decoration: none;
  transition:
    background 150ms var(--ease-ui-out),
    transform 150ms var(--ease-ui-out);
  border: 1.5px solid rgba(255, 255, 255, 0.55);
  background: rgba(255, 255, 255, 0.28);
  color: #fff;
}
.btn-owner svg {
  width: 14px;
  height: 14px;
}
.btn-owner:hover {
  background: rgba(255, 255, 255, 0.42);
}
.btn-owner:active {
  transform: scale(0.96);
}

.btn-danger-owner {
  border-color: rgba(255, 100, 100, 0.5);
  background: rgba(255, 100, 100, 0.18);
}
.btn-danger-owner:hover {
  background: rgba(255, 100, 100, 0.32);
}

.btn-fav {
  border-color: rgba(255, 255, 255, 0.55);
  background: rgba(255, 255, 255, 0.24);
}
.btn-fav:hover {
  background: rgba(255, 255, 255, 0.36);
}
.btn-fav svg {
  width: 14px;
  height: 14px;
}
.btn-fav--on {
  background: var(--color-danger);
  border-color: var(--color-danger);
  color: #fff;
}
.btn-fav--on:hover {
  background: var(--color-danger-hover, var(--color-danger));
}
.btn-fav:disabled {
  opacity: 0.7;
  cursor: wait;
}

.hero-no-img .btn-fav {
  border-color: var(--color-stroke);
  background: var(--color-bg);
  color: var(--color-text);
}
.hero-no-img .btn-fav--on {
  background: var(--color-danger);
  border-color: var(--color-danger);
  color: #fff;
}

.hero-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
  animation: fadeSlideUp 300ms var(--ease-ui-out) 80ms both;
}

@keyframes fadeSlideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.badge {
  padding: 3px 12px;
  border-radius: 20px;
  font-size: 0.775rem;
  font-weight: 600;
  border: 1px solid rgba(255, 255, 255, 0.6);
  background: rgba(255, 255, 255, 0.3);
  color: #fff;
  backdrop-filter: blur(6px);
  letter-spacing: 0.02em;
  text-decoration: none;
}

.badge-link {
  transition:
    background 150ms,
    border-color 150ms;
  cursor: pointer;
}
.badge-link:hover {
  background: rgba(255, 255, 255, 0.45);
  border-color: rgba(255, 255, 255, 0.8);
}

.badge-more {
  border: 1px dashed rgba(255, 255, 255, 0.55);
  background: rgba(255, 255, 255, 0.1);
  cursor: pointer;
  transition: background 150ms;
}
.badge-more:hover {
  background: rgba(255, 255, 255, 0.25);
}

.hero-title {
  margin: 0;
  font-size: clamp(1.6rem, 4vw, 2.4rem);
  font-weight: 800;
  color: #fff;
  line-height: 1.2;
  text-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
}

.hero-no-img .hero-title {
  color: var(--color-text);
  text-shadow: none;
}

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
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
  backdrop-filter: blur(6px);
}

.hero-no-img .meta-chip {
  background: var(--color-surface);
  color: var(--color-text);
}

.chip-icon {
  width: 13px;
  height: 13px;
  flex-shrink: 0;
}

.meta-stars {
  background: rgba(233, 105, 44, 0.4);
}

.meta-stars :deep(.count) {
  color: #fff;
}

.meta-link {
  text-decoration: none;
  transition: background 150ms var(--ease-ui-out);
}
.meta-link:hover {
  background: rgba(0, 0, 0, 0.72);
}
.hero-no-img .meta-link:hover {
  background: var(--color-surface-hover, var(--color-surface));
}

.hero-cta-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  margin-top: 4px;
  animation: fadeSlideUp 320ms var(--ease-ui-out) 140ms both;
}

.hero-cats {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  flex: 1;
  min-width: 0;
}

@media (max-width: 767px) {
  .hero-cats {
    max-height: calc(2 * (1.6em + 10px));
    overflow: hidden;
  }
}

.btn-add-cal {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 8px 18px;
  border-radius: 10px;
  font-size: 0.875rem;
  font-weight: 700;
  cursor: pointer;
  backdrop-filter: blur(6px);
  border: 1.5px solid rgba(255, 255, 255, 0.45);
  background: rgba(233, 105, 44, 0.28);
  color: #fff;
  transition:
    background 160ms var(--ease-ui-out),
    border-color 160ms ease,
    transform 160ms var(--ease-ui-out);
}

.btn-add-cal svg {
  width: 15px;
  height: 15px;
  flex-shrink: 0;
}

@media (hover: hover) and (pointer: fine) {
  .btn-add-cal:hover {
    background: rgba(233, 105, 44, 0.5);
    border-color: rgba(255, 255, 255, 0.65);
  }
}

.btn-add-cal:active {
  transform: scale(0.96);
}

.hero-no-img .btn-add-cal {
  border-color: var(--color-accent);
  background: color-mix(in srgb, var(--color-accent) 12%, transparent);
  color: var(--color-accent);
}

.hero-no-img .badge {
  border-color: var(--color-stroke);
  background: var(--color-surface);
  color: var(--color-text);
  backdrop-filter: none;
}

.hero-no-img .badge-link:hover {
  background: color-mix(in srgb, var(--color-accent) 10%, transparent);
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.hero-no-img .badge-more {
  border-color: var(--color-stroke);
  background: transparent;
  color: var(--color-muted);
}

@media (max-width: 768px) {
  .hero-overlay {
    padding: 16px 16px 22px;
  }
}
</style>
