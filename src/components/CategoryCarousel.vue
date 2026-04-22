<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/services/api'

const router = useRouter()

// Visuals keyed by a normalized key (lowercase, diacritic-preserving, trailing
// plural suffix stripped). Keep canonical keys singular; the matcher handles
// "Desszertek" → "desszert", "Húsételek" → "húsétel", etc.
const CATEGORY_VISUALS = {
  'főétel': { icon: '🍲', description: 'Laktató, teljes értékű fogások' },
  'desszert': { icon: '🍰', description: 'Édes finomságok' },
  'leves': { icon: '🥣', description: 'Meleg és hideg levesek' },
  'reggeli': { icon: '🥐', description: 'Energiadús reggelik' },
  'vacsora': { icon: '🍽️', description: 'Könnyű, laktató vacsorák' },
  'ebéd': { icon: '🍛', description: 'Családi ebédek' },
  'előétel': { icon: '🥗', description: 'Étvágygerjesztő kezdések' },
  'saláta': { icon: '🥗', description: 'Friss saláta receptek' },
  'köret': { icon: '🥔', description: 'Klasszikus köretek' },
  'sütemény': { icon: '🧁', description: 'Házi sütemények' },
  'torta': { icon: '🎂', description: 'Ünnepi torták' },
  'tészta': { icon: '🍝', description: 'Tészta ételek' },
  'pizza': { icon: '🍕', description: 'Pizza változatok' },
  'hús': { icon: '🍖', description: 'Húsos fogások' },
  'húsétel': { icon: '🍖', description: 'Klasszikus húsos fogások' },
  'csirke': { icon: '🍗', description: 'Csirkés receptek' },
  'hal': { icon: '🐟', description: 'Hal és tengeri herkentyűk' },
  'vegetáriánus': { icon: '🥬', description: 'Húsmentes fogások' },
  'vegán': { icon: '🌱', description: 'Növényi alapú receptek' },
  'ital': { icon: '🥤', description: 'Italok és koktélok' },
  'kenyér': { icon: '🍞', description: 'Kenyerek és péksütemények' },
  'szendvics': { icon: '🥪', description: 'Szendvicsek' },
  'snack': { icon: '🥨', description: 'Nasik és snackek' },
  'mártás': { icon: '🥫', description: 'Szószok és mártások' },
  'befőtt': { icon: '🫙', description: 'Eltett finomságok' },
  'gyors étel': { icon: '⚡', description: 'Gyors, egyszerű receptek' },
  'gyors': { icon: '⚡', description: 'Gyorsan elkészíthető fogások' },
  'egytálétel': { icon: '🥘', description: 'Egy edényben készülő fogások' },
  'grill': { icon: '🔥', description: 'Grillezett finomságok' },
  'sült': { icon: '🍳', description: 'Sült ételek' },
  'főzelék': { icon: '🥦', description: 'Hagyományos főzelékek' },
  'palacsinta': { icon: '🥞', description: 'Palacsinták, gofrik' },
  'édesség': { icon: '🍬', description: 'Édességek' },
  'fagylalt': { icon: '🍦', description: 'Fagylaltok, jeges finomságok' },
  'gyerek': { icon: '🧒', description: 'Gyerekkedvencek' },
  'ünnepi': { icon: '🎄', description: 'Ünnepi receptek' },
  'karácsony': { icon: '🎄', description: 'Karácsonyi fogások' },
  'húsvét': { icon: '🐰', description: 'Húsvéti receptek' },
}

const FALLBACK_VISUAL = { icon: '🍴', description: 'Böngészd ezt a kategóriát' }

// Strip common Hungarian plural suffixes so "desszertek" → "desszert".
function normalizeKey(name) {
  const base = (name ?? '').trim().toLowerCase()
  if (!base) return ''
  // Order matters: longer suffixes first.
  const suffixes = ['ek', 'ak', 'ok', 'ök', 'k']
  for (const s of suffixes) {
    if (base.length > s.length + 2 && base.endsWith(s)) {
      return base.slice(0, -s.length)
    }
  }
  return base
}

function lookupVisual(name) {
  const raw = (name ?? '').trim().toLowerCase()
  if (CATEGORY_VISUALS[raw]) return CATEGORY_VISUALS[raw]
  const stripped = normalizeKey(name)
  if (stripped && CATEGORY_VISUALS[stripped]) return CATEGORY_VISUALS[stripped]
  // Try partial: the first matching keyword token wins (e.g. "gyors ételek"
  // → "gyors"). Keeps the fallback for genuinely unknown names.
  for (const key of Object.keys(CATEGORY_VISUALS)) {
    if (raw.includes(key)) return CATEGORY_VISUALS[key]
  }
  return FALLBACK_VISUAL
}

const categories = ref([])
const loading = ref(true)

function decorate(cat) {
  const visual = lookupVisual(cat.name)
  return {
    id: cat.name,
    label: cat.name,
    icon: visual.icon,
    description: visual.description,
  }
}

onMounted(async () => {
  try {
    const res = await api.get('/categories', { params: { popular: 1, limit: 4 } })
    const list = Array.isArray(res.data?.data) ? res.data.data : []
    categories.value = list.map(decorate)
  } catch (e) {
    categories.value = []
  } finally {
    loading.value = false
  }
})

const goToCategory = (categoryId) => {
  router.push({
    name: 'recipes',
    query: { category: categoryId }
  })
}
</script>

<template>
  <section v-if="loading || categories.length > 0" class="category-carousel w-full px-4 py-8 sm:px-6 lg:px-8">
    <div class="mx-auto max-w-7xl">
      <h2 class="mb-6 text-2xl font-bold text-text sm:text-3xl">
        Böngéssz kategóriák szerint
      </h2>

      <div class="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <button
          v-for="category in categories"
          :key="category.id"
          @click="goToCategory(category.id)"
          class="group relative overflow-hidden rounded-2xl border border-stroke/40 bg-linear-to-br from-surface/60 to-surface/30 p-4 sm:p-5 transition-all duration-300 hover:border-accent/60 hover:shadow-lg hover:from-surface/80 hover:to-surface/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
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

          <div class="absolute inset-0 -z-10 bg-linear-to-br from-accent/0 to-accent/10 opacity-0 transition-opacity group-hover:opacity-100" />
        </button>
      </div>
    </div>
  </section>
</template>
