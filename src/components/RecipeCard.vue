<script setup>
import { computed, ref, watch } from 'vue'
import api from '@/services/api'
import { useAuthStore } from '@/stores/auth'

const props = defineProps({
  recipe:       { type: Object,  required: true },
  index:        { type: Number,  default: 0 },
  showFavorite: { type: Boolean, default: true },
})

const emit = defineEmits(['favorite-toggled'])
const authStore = useAuthStore()

const favorited = ref(Boolean(props.recipe.is_favorited))
const favLoading = ref(false)

watch(() => props.recipe.is_favorited, v => { favorited.value = Boolean(v) })

async function toggleFavorite(e) {
  e.preventDefault()
  e.stopPropagation()
  if (!authStore.isAuthenticated || favLoading.value) return
  favLoading.value = true
  const prev = favorited.value
  favorited.value = !prev
  try {
    const { data } = await api.post(`/favorites/${props.recipe.id}/toggle`)
    favorited.value = Boolean(data.favorited)
    emit('favorite-toggled', { id: props.recipe.id, favorited: favorited.value })
  } catch {
    favorited.value = prev
  } finally {
    favLoading.value = false
  }
}

const FALLBACK = import.meta.env.VITE_FALLBACK_IMAGE_URL
  ?? 'https://images.unsplash.com/photo-1495195134817-aeb325a55b65?auto=format&fit=crop&w=800&q=60'

const diffInfo = computed(() => ({
  'Könnyű': { cls: 'diff-easy',   label: 'Könnyű' },
  'Közepes': { cls: 'diff-medium', label: 'Közepes' },
  'Nehéz':   { cls: 'diff-hard',   label: 'Nehéz'  },
}[props.recipe.difficulty] ?? { cls: '', label: props.recipe.difficulty ?? '' }))

const visibleCats = computed(() => (props.recipe.categories ?? []).slice(0, 3))
</script>

<template>
  <RouterLink
    :to="{ name: 'recipe-detail', params: { id: recipe.id } }"
    class="rcard"
    :style="{ '--delay': `${Math.min(index, 8) * 50}ms` }"
    :aria-label="recipe.title"
  >
    <div class="rcard-img-wrap">
      <img
        :src="recipe.image_url || FALLBACK"
        :alt="recipe.title"
        class="rcard-img"
        loading="lazy"
        decoding="async"
      />
      <div class="rcard-overlay" aria-hidden="true" />
      <div v-if="visibleCats.length" class="rcard-cats" aria-hidden="true">
        <span v-for="cat in visibleCats" :key="cat.id" class="rcard-cat">{{ cat.name }}</span>
      </div>
      <button
        v-if="showFavorite && authStore.isAuthenticated"
        type="button"
        class="rcard-fav"
        :class="{ 'rcard-fav--on': favorited }"
        :disabled="favLoading"
        :aria-label="favorited ? 'Eltávolítás a kedvencek közül' : 'Hozzáadás a kedvencekhez'"
        :aria-pressed="favorited"
        @click="toggleFavorite"
      >
        <svg viewBox="0 0 24 24" :fill="favorited ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2.2" aria-hidden="true">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </div>

    <div class="rcard-body">
      <h3 class="rcard-title">{{ recipe.title }}</h3>
      <p v-if="recipe.description" class="rcard-desc">{{ recipe.description }}</p>

      <div class="rcard-meta">
        <span class="rcard-chip">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" class="chip-ico" aria-hidden="true">
            <circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/>
          </svg>
          {{ recipe.prep_time }}&nbsp;perc
        </span>
        <span v-if="recipe.difficulty" class="rcard-diff" :class="diffInfo.cls">{{ diffInfo.label }}</span>
        <RouterLink
          v-if="recipe.author"
          :to="{ name: 'user-profile', params: { id: recipe.author.id } }"
          class="rcard-author"
          @click.stop
        >{{ recipe.author.username }}</RouterLink>
      </div>
    </div>
  </RouterLink>
</template>

<style scoped>
.rcard {
  display: flex;
  flex-direction: column;
  border-radius: 18px;
  border: 1.5px solid var(--color-stroke);
  background: var(--color-bg);
  overflow: hidden;
  text-decoration: none;
  will-change: transform;
  animation: rcardIn 300ms var(--ease-ui-out) var(--delay, 0ms) both;
  transition:
    transform 220ms var(--ease-ui-out),
    box-shadow 220ms var(--ease-ui-out),
    border-color 220ms var(--ease-ui-out);
}

@keyframes rcardIn {
  from { opacity: 0; transform: translateY(10px) scale(0.97); }
  to   { opacity: 1; transform: none; }
}

@media (hover: hover) and (pointer: fine) {
  .rcard:hover {
    transform: translateY(-3px);
    box-shadow: 0 18px 40px -14px rgba(47, 30, 23, 0.20);
    border-color: var(--color-accent-soft);
  }
  .rcard:hover .rcard-img { transform: scale(1.05); }
}

.rcard:active { transform: scale(0.985); }

/* --- Image --- */
.rcard-img-wrap {
  position: relative;
  aspect-ratio: 3 / 2;
  overflow: hidden;
  background: var(--color-surface);
  flex-shrink: 0;
}

.rcard-img {
  width: 100%; height: 100%;
  object-fit: cover;
  transition: transform 480ms var(--ease-ui-out);
}

.rcard-overlay {
  position: absolute; inset: 0;
  background: linear-gradient(to top, rgba(47, 30, 23, 0.58) 0%, transparent 55%);
  pointer-events: none;
}

.rcard-cats {
  position: absolute; bottom: 10px; left: 10px;
  display: flex; gap: 5px; flex-wrap: wrap;
}

.rcard-cat {
  padding: 2px 9px;
  border-radius: 20px;
  font-size: 0.67rem;
  font-weight: 700;
  letter-spacing: 0.025em;
  border: 1px solid rgba(255, 255, 255, 0.3);
  background: rgba(255, 255, 255, 0.14);
  color: #fff;
  backdrop-filter: blur(4px);
}

/* --- Body --- */
.rcard-body {
  display: flex; flex-direction: column; gap: 6px;
  padding: 14px 15px 15px;
  flex: 1;
}

.rcard-title {
  margin: 0;
  font-size: 0.93rem;
  font-weight: 800;
  color: var(--color-text);
  line-height: 1.35;
  letter-spacing: -0.01em;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.rcard-desc {
  margin: 0;
  font-size: 0.79rem;
  color: var(--color-muted);
  line-height: 1.5;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.rcard-meta {
  display: flex; flex-wrap: wrap; gap: 5px;
  align-items: center;
  margin-top: auto; padding-top: 8px;
}

.rcard-chip {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 3px 9px; border-radius: 7px;
  font-size: 0.74rem; font-weight: 600;
  background: var(--color-surface);
  color: var(--color-muted);
}

.chip-ico { width: 11px; height: 11px; flex-shrink: 0; }

.rcard-diff {
  display: inline-flex; align-items: center;
  padding: 3px 9px; border-radius: 7px;
  font-size: 0.74rem; font-weight: 700;
}

.diff-easy   { background: color-mix(in srgb, #5b7f43 14%, transparent); color: #3b5c28; }
.diff-medium { background: color-mix(in srgb, #d97706 14%, transparent); color: #7c4f08; }
.diff-hard   { background: color-mix(in srgb, #d94b4b 14%, transparent); color: #8b1f1f; }

.rcard-author {
  margin-left: auto;
  font-size: 0.72rem; font-weight: 600;
  color: var(--color-muted);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  max-width: 110px;
  text-decoration: none;
  transition: color 150ms var(--ease-ui-out);
}
.rcard-author:hover { color: var(--color-accent); }

/* --- Favorite button --- */
.rcard-fav {
  position: absolute;
  top: 10px; right: 10px;
  width: 34px; height: 34px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  border: 1.5px solid rgba(255, 255, 255, 0.4);
  background: rgba(0, 0, 0, 0.28);
  color: #fff;
  cursor: pointer;
  backdrop-filter: blur(6px);
  transition:
    background 160ms var(--ease-ui-out),
    color 160ms var(--ease-ui-out),
    border-color 160ms var(--ease-ui-out),
    transform 160ms var(--ease-ui-out);
}
.rcard-fav svg { width: 16px; height: 16px; }
.rcard-fav:hover:not(:disabled) { background: rgba(0, 0, 0, 0.45); transform: scale(1.08); }
.rcard-fav:active:not(:disabled) { transform: scale(0.9); }
.rcard-fav:disabled { opacity: 0.7; cursor: wait; }

.rcard-fav--on {
  background: var(--color-danger, #d94b4b);
  border-color: rgba(255, 255, 255, 0.6);
  color: #fff;
  animation: favPop 260ms var(--ease-ui-out);
}

@keyframes favPop {
  0%   { transform: scale(1); }
  40%  { transform: scale(1.22); }
  100% { transform: scale(1); }
}
</style>
