<!-- Nyitóoldal hero — kereső, CTA, kategóriák. -->

<script setup>
import { computed, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'
import BaseButton from './BaseButton.vue'
import CategoryCarousel from './CategoryCarousel.vue'

const router = useRouter()
const authStore = useAuthStore()

const searchTerm = ref('')
const dailyRecipe = ref(null)
const loadingDaily = ref(true)

// A háttérkép a hero szekcióhoz
const heroImage =
  'https://images.unsplash.com/photo-1495195134817-aeb325a55b65?auto=format&fit=crop&w=1600&q=80'
const fallbackImage =
  import.meta.env.VITE_FALLBACK_IMAGE_URL ||
  'https://images.unsplash.com/photo-1495195134817-aeb325a55b65?auto=format&fit=crop&w=800&q=60'

const heroStyle = computed(() => ({
  backgroundImage: `linear-gradient(115deg, rgba(47, 30, 23, 0.88) 0%, rgba(47, 30, 23, 0.65) 45%, rgba(47, 30, 23, 0.3) 100%), url('${heroImage}')`,
}))

// Keresés indítása
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
  <section class="w-full px-4 pb-10 pt-6 sm:px-6 lg:px-8 lg:pb-14 lg:pt-8">
    <div
      class="relative mx-auto max-w-7xl overflow-hidden rounded-[2.5rem] border border-stroke/40 shadow-[0_30px_90px_-20px_rgba(47,30,23,0.45)]"
      :style="heroStyle"
    >
      <!-- Díszítő effektek a háttérben -->
      <div
        class="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.12),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(233,105,44,0.3),transparent_40%)]"
      />

      <div
        class="relative grid gap-12 px-6 py-16 sm:px-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)] lg:px-14 lg:py-24 items-center"
      >
        <!-- Bal oldal: Szövegek és Kereső -->
        <div class="flex flex-col justify-center max-w-2xl text-white">
          <p
            class="inline-flex w-fit items-center rounded-full border border-white/20 bg-white/10 px-4 py-1 text-xs font-bold uppercase tracking-[0.25em] text-white backdrop-blur-md shadow-sm"
          >
            <span class="mr-2 text-accent">🔥</span> Friss inspiráció a konyhához
          </p>

          <h1 class="mt-6 text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl leading-[1.1]">
            Találd meg a következő kedvenc <span class="text-accent-soft">recepted!</span>
          </h1>

          <p class="mt-6 max-w-xl text-base leading-relaxed text-white/80 sm:text-lg">
            Gasztronómiai közösségünkben több ezer recept, heti menütervező és egy egyedi
            eszközbérlési felület vár rád. Mit főznél ma?
          </p>

          <!-- Új, kapszula formájú keresőmező -->
          <form
            class="mt-8 flex flex-col gap-3 sm:flex-row items-center bg-white/10 p-2 rounded-3xl sm:rounded-full border border-white/20 backdrop-blur-md shadow-lg transition-all focus-within:bg-white/15 focus-within:border-white/40"
            @submit.prevent="handleSearch"
          >
            <div class="flex-1 w-full relative flex items-center">
              <svg
                class="absolute left-4 w-5 h-5 text-white/60"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                ></path>
              </svg>
              <input
                v-model="searchTerm"
                type="search"
                class="w-full bg-transparent text-white placeholder-white/60 focus:outline-none pl-12 pr-4 py-2 sm:py-3 text-base"
                placeholder="pl. lasagne, csirke, desszert..."
              />
            </div>
            <button
              type="submit"
              class="w-full sm:w-auto bg-accent hover:bg-accent-hover text-white rounded-2xl sm:rounded-full px-8 py-3 font-bold transition-all transform active:scale-95 shadow-md"
            >
              Keresés
            </button>
          </form>

          <!-- Dinamikus Gombok -->
          <div class="mt-8 flex flex-wrap gap-4">
            <BaseButton
              variant="primary"
              size="lg"
              rounded="full"
              @click="router.push({ name: 'recipes' })"
            >
              Receptek böngészése
            </BaseButton>

            <!-- Ha nincs bejelentkezve -->
            <button
              v-if="!authStore.isAuthenticated"
              @click="router.push({ name: 'login' })"
              class="inline-flex items-center justify-center px-6 py-3 border-2 border-white/30 hover:border-white text-white rounded-full font-bold transition-all hover:bg-white/10"
            >
              Bejelentkezés
            </button>

            <!-- Ha be van jelentkezve -->
            <button
              v-else
              @click="router.push({ name: 'calendar' })"
              class="inline-flex items-center justify-center px-6 py-3 border-2 border-white/30 hover:border-white text-white rounded-full font-bold transition-all hover:bg-white/10"
            >
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                ></path>
              </svg>
              Heti menüm
            </button>
          </div>
        </div>

        <!-- Jobb oldal: Mai Ajánló Kártya -->
        <aside class="flex items-center lg:justify-end">
          <!-- Skeleton (Töltés közben) -->
          <div
            v-if="loadingDaily"
            class="w-full max-w-md rounded-4xl border border-white/15 bg-white/5 p-5 shadow-2xl backdrop-blur-xl animate-pulse"
          >
            <div class="flex justify-between items-center mb-4">
              <div class="h-4 w-24 bg-white/20 rounded-full"></div>
              <div class="h-6 w-16 bg-white/20 rounded-full"></div>
            </div>
            <div class="h-70 sm:h-80 bg-white/10 rounded-3xl mb-4"></div>
            <div class="h-6 w-3/4 bg-white/20 rounded-lg mb-2"></div>
            <div class="h-4 w-1/2 bg-white/20 rounded-lg"></div>
          </div>

          <!-- Valós Recept Kártya -->
          <RouterLink
            v-else-if="dailyRecipe"
            :to="{ name: 'recipe-detail', params: { id: dailyRecipe.id } }"
            class="group block w-full max-w-md rounded-4xl border border-white/20 bg-white/10 p-4 text-white shadow-[0_20px_50px_-20px_rgba(0,0,0,0.7)] backdrop-blur-lg sm:p-5 transition-all duration-300 hover:bg-white/15 hover:-translate-y-2 hover:shadow-[0_30px_60px_-20px_rgba(0,0,0,0.8)] hover:border-accent-soft/50 cursor-pointer relative overflow-hidden"
          >
            <!-- Fény effekt hoverkor -->
            <div
              class="absolute inset-0 bg-linear-to-tr from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
            ></div>

            <div class="flex justify-between items-center mb-3 relative z-10">
              <p
                class="text-xs font-extrabold uppercase tracking-[0.2em] text-yellow-300 drop-shadow-md flex items-center gap-1.5"
              >
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                  ></path>
                </svg>
                Mai ajánlónk
              </p>
              <span
                class="text-xs font-bold bg-black/50 border border-white/10 px-3 py-1 rounded-full backdrop-blur-md flex items-center gap-1"
              >
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  ></path>
                </svg>
                {{ dailyRecipe.prep_time }} perc
              </span>
            </div>

            <div
              class="overflow-hidden rounded-[1.35rem] border border-white/10 bg-black/40 relative z-10"
            >
              <img
                :src="dailyRecipe.image_url || fallbackImage"
                :alt="dailyRecipe.title"
                class="h-65 sm:h-75 w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              />
              <div
                class="absolute inset-0 bg-linear-to-t from-black/90 via-black/30 to-transparent"
              ></div>

              <div class="absolute bottom-0 left-0 p-5 w-full">
                <div class="flex items-center gap-2 mb-2">
                  <span
                    class="text-xs font-bold bg-accent text-white px-2 py-0.5 rounded shadow-sm"
                  >
                    {{ dailyRecipe.difficulty }}
                  </span>
                </div>
                <h3
                  class="text-xl sm:text-2xl font-black text-white shadow-sm leading-tight group-hover:text-accent-soft transition-colors drop-shadow-lg"
                >
                  {{ dailyRecipe.title }}
                </h3>
                <p
                  v-if="dailyRecipe.author"
                  class="text-sm font-medium text-white/80 mt-1.5 flex items-center gap-1.5"
                >
                  <svg
                    class="w-4 h-4 opacity-70"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    ></path>
                  </svg>
                  {{ dailyRecipe.author.username }}
                </p>
              </div>
            </div>
          </RouterLink>

          <!-- Ha valamiért nincs egyáltalán recept az adatbázisban -->
          <div
            v-else
            class="w-full max-w-md rounded-[1.75rem] border border-white/15 bg-white/10 p-5 shadow-2xl backdrop-blur-md text-center text-white/70"
          >
            Még nincsenek receptek feltöltve az oldalra.
          </div>
        </aside>
      </div>
    </div>
  </section>

  <!-- Kategória csúszka -->
  <CategoryCarousel />
</template>
