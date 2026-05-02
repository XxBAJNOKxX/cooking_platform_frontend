<!-- Nyitóoldal hero — mobile-first, kép-dominált, daily-card mobilon is. -->

<script setup>
import { computed, ref, onMounted, watch } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'
import BaseButton from './BaseButton.vue'

const router = useRouter()
const authStore = useAuthStore()

const searchTerm = ref('')
const dailyRecipe = ref(null)
const loadingDaily = ref(true)

const heroImages = [
  'https://images.unsplash.com/photo-1495195134817-aeb325a55b65?auto=format&fit=crop&w=1800&q=80',
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1800&q=80',
  'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=1800&q=80',
  'https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&w=1800&q=80',
  'https://images.unsplash.com/photo-1543353071-10c8ba85a904?auto=format&fit=crop&w=1800&q=80',
]

const heroImage = heroImages[Math.floor(Math.random() * heroImages.length)]

const fallbackImage =
  import.meta.env.VITE_RECIPES_FALLBACK_IMAGE_URL ||
  'https://images.unsplash.com/photo-1495195134817-aeb325a55b65?auto=format&fit=crop&w=800&q=60'

const heroStyle = computed(() => ({
  backgroundImage: `linear-gradient(180deg, rgba(47,30,23,0.55) 0%, rgba(47,30,23,0.40) 35%, rgba(47,30,23,0.85) 100%), url('${heroImage}')`,
}))

const dailyImgSrc = ref(fallbackImage)
watch(
  () => dailyRecipe.value?.image_url,
  (v) => {
    dailyImgSrc.value = v || fallbackImage
  },
)
function onDailyImgError() {
  if (dailyImgSrc.value !== fallbackImage) dailyImgSrc.value = fallbackImage
}

const handleSearch = () => {
  const trimmedQuery = searchTerm.value.trim()
  router.push({
    name: 'recipes',
    query: trimmedQuery ? { search: trimmedQuery } : {},
  })
}

onMounted(async () => {
  try {
    const { data } = await api.get('/recipes/daily')
    dailyRecipe.value = data.data ?? null
  } catch (error) {
    if (import.meta.env.DEV) console.error('[dailyRecipe]', error)
  } finally {
    loadingDaily.value = false
  }
})
</script>

<template>
  <section class="hero-shell">
    <div class="hero-frame" :style="heroStyle">
      <div class="hero-grain" aria-hidden="true"></div>
      <div class="hero-glow" aria-hidden="true"></div>

      <div class="hero-content">
        <div class="hero-text">
          <p class="hero-badge">
            <span class="hero-badge-dot">🔥</span>
            <span>Friss inspiráció a konyhához</span>
          </p>

          <h1 class="hero-title">
            Találd meg a következő<br />
            kedvenc <span class="hero-title-accent">recepted!</span>
          </h1>

          <p class="hero-subtitle">
            Több ezer recept, heti étrend-tervező, közös bevásárlólista, és most már
            saját <strong>receptkönyvet</strong> is összeállíthatsz.
          </p>

          <form class="hero-search" @submit.prevent="handleSearch">
            <div class="hero-search-input-wrap">
              <svg class="hero-search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
              <input
                v-model="searchTerm"
                type="search"
                class="hero-search-input"
                placeholder="pl. lasagne, csirke, desszert..."
                aria-label="Recept keresése"
              />
            </div>
            <button type="submit" class="hero-search-btn">Keresés</button>
          </form>

          <div class="hero-ctas">
            <BaseButton
              variant="primary"
              size="lg"
              rounded="full"
              block
              @click="router.push({ name: 'recipes' })"
            >
              Receptek böngészése
            </BaseButton>

            <button
              v-if="!authStore.isAuthenticated"
              type="button"
              class="hero-cta-secondary"
              @click="router.push({ name: 'login' })"
            >
              Bejelentkezés
            </button>

            <button
              v-else
              type="button"
              class="hero-cta-secondary"
              @click="router.push({ name: 'calendar' })"
            >
              <svg class="hero-cta-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
              </svg>
              Heti menüm
            </button>
          </div>
        </div>

        <aside class="hero-daily">
          <div v-if="loadingDaily" class="daily-card daily-card-skeleton">
            <div class="daily-skel-header"></div>
            <div class="daily-skel-image"></div>
            <div class="daily-skel-line daily-skel-line-w-3-4"></div>
            <div class="daily-skel-line daily-skel-line-w-1-2"></div>
          </div>

          <RouterLink
            v-else-if="dailyRecipe"
            :to="{ name: 'recipe-detail', params: { id: dailyRecipe.id } }"
            class="daily-card daily-card-link"
          >
            <div class="daily-header">
              <p class="daily-tag">
                <svg class="daily-tag-icon" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                </svg>
                Mai ajánlónk
              </p>
              <span class="daily-time">
                <svg class="daily-time-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                {{ dailyRecipe.prep_time }} perc
              </span>
            </div>

            <div class="daily-image-wrap">
              <img
                :src="dailyImgSrc"
                :alt="dailyRecipe.title"
                class="daily-image"
                @error="onDailyImgError"
              />
              <div class="daily-image-overlay"></div>
              <div class="daily-image-content">
                <span class="daily-difficulty">{{ dailyRecipe.difficulty }}</span>
                <h3 class="daily-title">{{ dailyRecipe.title }}</h3>
                <p v-if="dailyRecipe.author" class="daily-author">
                  <svg class="daily-author-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                  </svg>
                  {{ dailyRecipe.author.username }}
                </p>
              </div>
            </div>
          </RouterLink>

          <div v-else class="daily-card daily-card-empty">
            Még nincsenek receptek feltöltve az oldalra.
          </div>
        </aside>
      </div>
    </div>
  </section>
</template>

<style scoped>
.hero-shell {
  position: relative;
  width: 100%;
  padding: 0;
}

.hero-frame {
  position: relative;
  min-height: 78vh;
  width: 100%;
  background-size: cover;
  background-position: center 30%;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  overflow: hidden;
}

.hero-grain {
  position: absolute;
  inset: 0;
  background-image: radial-gradient(circle at 30% 20%, rgba(255, 255, 255, 0.06), transparent 50%);
  pointer-events: none;
  z-index: 1;
}

.hero-glow {
  position: absolute;
  inset: 0;
  background-image: radial-gradient(circle at 80% 110%, rgba(233, 105, 44, 0.32), transparent 55%);
  pointer-events: none;
  z-index: 1;
}

.hero-content {
  position: relative;
  z-index: 2;
  width: 100%;
  padding: 4rem 1.25rem 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.4rem;
  color: white;
}

.hero-text {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
  max-width: 36rem;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  width: fit-content;
  padding: 0.32rem 0.85rem;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.22);
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  font-size: 0.66rem;
  font-weight: 800;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.hero-badge-dot {
  font-size: 0.85rem;
}

.hero-title {
  font-size: clamp(2rem, 7vw, 3.5rem);
  font-weight: 900;
  line-height: 1.05;
  letter-spacing: -0.02em;
  margin: 0;
}

.hero-title-accent {
  color: var(--color-accent-soft);
}

.hero-subtitle {
  font-size: 0.98rem;
  line-height: 1.55;
  color: rgba(255, 255, 255, 0.85);
  margin: 0;
}

.hero-subtitle strong {
  color: var(--color-accent-soft);
}

.hero-search {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(14px);
  border: 1px solid rgba(255, 255, 255, 0.22);
  border-radius: 1.25rem;
  padding: 0.4rem;
  margin-top: 0.4rem;
}

.hero-search-input-wrap {
  position: relative;
  display: flex;
  align-items: center;
  flex: 1;
}

.hero-search-icon {
  position: absolute;
  left: 0.85rem;
  width: 1.15rem;
  height: 1.15rem;
  color: rgba(255, 255, 255, 0.7);
}

.hero-search-input {
  flex: 1;
  width: 100%;
  background: transparent;
  border: none;
  padding: 0.85rem 0.85rem 0.85rem 2.6rem;
  color: white;
  font-size: 1rem;
  outline: none;
}

.hero-search-input::placeholder {
  color: rgba(255, 255, 255, 0.6);
}

.hero-search-btn {
  border: none;
  border-radius: 0.85rem;
  background: var(--color-accent);
  color: white;
  font-weight: 800;
  font-size: 0.95rem;
  padding: 0.85rem 1.4rem;
  cursor: pointer;
  transition:
    background 160ms ease,
    transform 160ms var(--ease-ui-out);
  box-shadow: 0 6px 18px -6px rgba(233, 105, 44, 0.7);
}

.hero-search-btn:hover {
  background: var(--color-accent-hover);
}

.hero-search-btn:active {
  transform: scale(0.96);
}

.hero-ctas {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  margin-top: 0.4rem;
}

.hero-cta-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.85rem 1.5rem;
  border-radius: 999px;
  border: 2px solid rgba(255, 255, 255, 0.36);
  background: transparent;
  color: white;
  font-weight: 700;
  font-size: 0.95rem;
  cursor: pointer;
  transition:
    background 180ms ease,
    border-color 180ms ease,
    transform 160ms var(--ease-ui-out);
}

.hero-cta-secondary:hover {
  background: rgba(255, 255, 255, 0.12);
  border-color: white;
}

.hero-cta-secondary:active {
  transform: scale(0.97);
}

.hero-cta-icon {
  width: 1.1rem;
  height: 1.1rem;
}

/* Daily card — alapból mobilon a hero ALATT, full-width */
.hero-daily {
  display: flex;
  margin-top: 0;
}

.daily-card {
  width: 100%;
  border-radius: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(14px);
  padding: 0.85rem;
  color: white;
  box-shadow: 0 18px 38px -16px rgba(0, 0, 0, 0.55);
}

.daily-card-link {
  display: block;
  text-decoration: none;
  cursor: pointer;
  transition:
    transform 240ms var(--ease-ui-out),
    background 240ms ease;
}

.daily-card-link:hover {
  background: rgba(255, 255, 255, 0.15);
  transform: translateY(-3px);
}

.daily-card-empty {
  text-align: center;
  color: rgba(255, 255, 255, 0.7);
  padding: 1.5rem;
  font-size: 0.9rem;
}

.daily-card-skeleton {
  animation: pulse 1.6s ease-in-out infinite;
}

.daily-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.7rem;
}

.daily-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.65rem;
  font-weight: 800;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #fcd34d;
  margin: 0;
}

.daily-tag-icon {
  width: 0.95rem;
  height: 0.95rem;
}

.daily-time {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.72rem;
  font-weight: 700;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 999px;
  padding: 0.2rem 0.6rem;
  backdrop-filter: blur(8px);
}

.daily-time-icon {
  width: 0.85rem;
  height: 0.85rem;
}

.daily-image-wrap {
  position: relative;
  border-radius: 1.15rem;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(0, 0, 0, 0.4);
}

.daily-image {
  display: block;
  width: 100%;
  height: 14.5rem;
  object-fit: cover;
  transition: transform 600ms var(--ease-ui-out);
}

.daily-card-link:hover .daily-image {
  transform: scale(1.04);
}

.daily-image-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, transparent 30%, rgba(0, 0, 0, 0.92) 100%);
  pointer-events: none;
}

.daily-image-content {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.daily-difficulty {
  display: inline-block;
  width: fit-content;
  font-size: 0.66rem;
  font-weight: 800;
  letter-spacing: 0.05em;
  background: var(--color-accent);
  color: white;
  padding: 0.18rem 0.55rem;
  border-radius: 0.35rem;
}

.daily-title {
  font-size: 1.25rem;
  font-weight: 900;
  margin: 0;
  line-height: 1.2;
  text-shadow: 0 1px 6px rgba(0, 0, 0, 0.6);
}

.daily-author {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.78rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.85);
  margin: 0;
}

.daily-author-icon {
  width: 0.95rem;
  height: 0.95rem;
  opacity: 0.7;
}

/* skeleton */
.daily-skel-header {
  height: 1.1rem;
  background: rgba(255, 255, 255, 0.18);
  border-radius: 999px;
  margin-bottom: 0.7rem;
}

.daily-skel-image {
  height: 14.5rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 1.15rem;
  margin-bottom: 0.7rem;
}

.daily-skel-line {
  height: 0.95rem;
  background: rgba(255, 255, 255, 0.18);
  border-radius: 0.4rem;
  margin-bottom: 0.4rem;
}

.daily-skel-line-w-3-4 {
  width: 75%;
}

.daily-skel-line-w-1-2 {
  width: 50%;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

/* ────── DESKTOP (≥768px) — visszatér a 2-oszlopos hero, daily a jobb-alsó sarokban ────── */
@media (min-width: 768px) {
  .hero-shell {
    padding: 1.5rem 1.5rem 2.5rem;
  }

  .hero-frame {
    border-radius: 2.5rem;
    border: 1px solid color-mix(in srgb, var(--color-stroke) 40%, transparent);
    min-height: 32rem;
    box-shadow: 0 30px 70px -28px rgba(47, 30, 23, 0.45);
    max-width: 80rem;
    margin: 0 auto;
  }

  .hero-content {
    display: grid;
    grid-template-columns: minmax(0, 1.2fr) minmax(20rem, 0.85fr);
    gap: 3rem;
    padding: 4rem 3rem;
    align-items: center;
  }

  .hero-text {
    max-width: 36rem;
  }

  .hero-search {
    flex-direction: row;
    border-radius: 999px;
    padding: 0.4rem 0.4rem 0.4rem 0.6rem;
  }

  .hero-search-input {
    padding: 0.7rem 0.85rem 0.7rem 2.6rem;
  }

  .hero-search-btn {
    border-radius: 999px;
    padding: 0.7rem 1.6rem;
  }

  .hero-ctas {
    flex-direction: row;
    flex-wrap: wrap;
    gap: 0.85rem;
  }

  .hero-ctas > :first-child {
    width: auto;
  }

  .hero-cta-secondary {
    width: auto;
  }

  .hero-daily {
    justify-content: flex-end;
  }

  .daily-card {
    max-width: 26rem;
  }

  .daily-image {
    height: 18rem;
  }

  .daily-skel-image {
    height: 18rem;
  }
}
</style>
