<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import RecipeCard from '@/components/RecipeCard.vue'
import RecipeSkeletonCard from '@/components/RecipeSkeletonCard.vue'
import ToolCard from '@/components/tools/ToolCard.vue'
import ToolSkeletonCard from '@/components/tools/ToolSkeletonCard.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const profile = ref(null)
const profileLoading = ref(true)
const profileError = ref('')

const recipeCount = ref(0)
const toolCount = ref(0)

const initials = computed(() => (profile.value?.username ?? '?').slice(0, 1).toUpperCase())

const joinedLabel = computed(() => {
  if (!profile.value?.joined_at) return ''
  return new Date(profile.value.joined_at).toLocaleDateString('hu-HU', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
})

const isSelf = computed(() =>
  authStore.user?.id && profile.value?.id && authStore.user.id === profile.value.id,
)

// ── Tabs ──
const activeTab = ref('recipes')

// ── Recipes ──
const recipes = ref([])
const recipesLoading = ref(true)
const recipesError = ref(null)
const recipesPage = ref(1)
const recipesLastPage = ref(1)

async function fetchRecipes(page = 1) {
  recipesLoading.value = true
  recipesError.value = null
  try {
    const res = await api.get(`/users/${route.params.id}/recipes`, {
      params: { per_page: 12, page },
    })
    recipes.value = res.data.data ?? []
    recipesPage.value = res.data.meta?.current_page ?? 1
    recipesLastPage.value = res.data.meta?.last_page ?? 1
  } catch {
    recipesError.value = 'Nem sikerült betölteni a recepteket.'
  } finally {
    recipesLoading.value = false
  }
}

// ── Tools ──
const tools = ref([])
const toolsLoading = ref(false)
const toolsError = ref(null)
const toolsPage = ref(1)
const toolsLastPage = ref(1)
const toolsLoaded = ref(false)

async function fetchTools(page = 1) {
  toolsLoading.value = true
  toolsError.value = null
  try {
    const res = await api.get(`/users/${route.params.id}/kitchen-tools`, {
      params: { per_page: 12, page },
    })
    tools.value = res.data.data ?? []
    toolsPage.value = res.data.meta?.current_page ?? 1
    toolsLastPage.value = res.data.meta?.last_page ?? 1
    toolsLoaded.value = true
  } catch {
    toolsError.value = 'Nem sikerült betölteni az eszközöket.'
  } finally {
    toolsLoading.value = false
  }
}

watch(activeTab, (tab) => {
  if (tab === 'tools' && !toolsLoaded.value && !toolsLoading.value) fetchTools(1)
})

async function fetchProfile() {
  profileLoading.value = true
  profileError.value = ''
  try {
    const { data } = await api.get(`/users/${route.params.id}`)
    profile.value = data.data.user
    recipeCount.value = data.data.recipe_count ?? 0
    toolCount.value = data.data.tool_count ?? 0
  } catch (err) {
    profileError.value = err.response?.status === 404
      ? 'A felhasználó nem található.'
      : 'Hiba történt a profil betöltésekor.'
  } finally {
    profileLoading.value = false
  }
}

function sendMessage() {
  if (!authStore.isAuthenticated) {
    router.push({ name: 'login' })
    return
  }
  router.push({
    name: 'messages',
    query: {
      to: route.params.id,
      username: profile.value.username
    }
  })
}

onMounted(() => {
  fetchProfile()
  fetchRecipes()
})

watch(() => route.params.id, (id) => {
  if (!id) return
  toolsLoaded.value = false
  tools.value = []
  recipes.value = []
  activeTab.value = 'recipes'
  fetchProfile()
  fetchRecipes()
})
</script>

<template>
  <div class="profile-page">

    <div v-if="profileLoading" class="profile-card pc-skel" aria-busy="true">
      <div class="avatar-wrap">
        <div class="avatar-initials skel-av" />
      </div>
      <div class="profile-info">
        <div class="skel-bar skel-bar-wide" />
        <div class="skel-bar" />
      </div>
    </div>

    <div v-else-if="profileError" class="error-card">
      <p class="error-text">{{ profileError }}</p>
      <button class="btn-ghost" @click="router.back()">← Vissza</button>
    </div>

    <template v-else-if="profile">
      <!-- Header -->
      <div class="profile-card">
        <div class="avatar-wrap">
          <img v-if="profile.avatar_url" :src="profile.avatar_url" :alt="profile.username" class="avatar-img" />
          <div v-else class="avatar-initials">{{ initials }}</div>
        </div>

        <div class="profile-info">
          <div class="profile-name-row">
            <h1 class="profile-name">{{ profile.username }}</h1>
            <button v-if="!isSelf && authStore.isAuthenticated" class="msg-btn" @click="sendMessage">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              </svg>
              Üzenet
            </button>
          </div>

          <p v-if="profile.bio" class="profile-bio">{{ profile.bio }}</p>
          <p v-if="joinedLabel" class="profile-joined">Csatlakozott: {{ joinedLabel }}</p>
        </div>
      </div>

      <!-- Stats -->
      <div class="stats-row">
        <div class="stat-chip"><span class="stat-num">{{ recipeCount }}</span><span class="stat-lbl">recept</span></div>
        <div class="stat-chip"><span class="stat-num">{{ toolCount }}</span><span class="stat-lbl">eszköz</span></div>
      </div>

      <!-- Tabs -->
      <div class="tabs-row" role="tablist">
        <button class="tab" :class="{ 'tab-active': activeTab === 'recipes' }" role="tab"
          :aria-selected="activeTab === 'recipes'" @click="activeTab = 'recipes'">
          Receptek
          <span class="tab-count">{{ recipeCount }}</span>
        </button>
        <button class="tab" :class="{ 'tab-active': activeTab === 'tools' }" role="tab"
          :aria-selected="activeTab === 'tools'" @click="activeTab = 'tools'">
          Eszközök
          <span class="tab-count">{{ toolCount }}</span>
        </button>
      </div>

      <!-- Recipes panel -->
      <section v-if="activeTab === 'recipes'" class="panel" role="tabpanel">
        <div v-if="recipesLoading" class="items-grid" aria-busy="true">
          <RecipeSkeletonCard v-for="i in 6" :key="i" :index="i" />
        </div>
        <p v-else-if="recipesError" class="error-text">{{ recipesError }}</p>
        <div v-else-if="recipes.length === 0" class="empty-state">
          <p class="empty-text">Nincs nyilvános recept.</p>
        </div>
        <div v-else class="items-grid">
          <RecipeCard v-for="(r, i) in recipes" :key="r.id" :recipe="r" :index="i" />
        </div>
        <div v-if="recipesLastPage > 1" class="pagination">
          <button class="page-btn" :disabled="recipesPage === 1" @click="fetchRecipes(recipesPage - 1)">‹</button>
          <span class="page-info">{{ recipesPage }} / {{ recipesLastPage }}</span>
          <button class="page-btn" :disabled="recipesPage === recipesLastPage"
            @click="fetchRecipes(recipesPage + 1)">›</button>
        </div>
      </section>

      <!-- Tools panel -->
      <section v-else class="panel" role="tabpanel">
        <div v-if="toolsLoading" class="items-grid" aria-busy="true">
          <ToolSkeletonCard v-for="i in 6" :key="i" :index="i" />
        </div>
        <p v-else-if="toolsError" class="error-text">{{ toolsError }}</p>
        <div v-else-if="tools.length === 0" class="empty-state">
          <p class="empty-text">Nincs bérelhető eszköz.</p>
        </div>
        <div v-else class="items-grid">
          <ToolCard v-for="(t, i) in tools" :key="t.id" :tool="t" :index="i" />
        </div>
        <div v-if="toolsLastPage > 1" class="pagination">
          <button class="page-btn" :disabled="toolsPage === 1" @click="fetchTools(toolsPage - 1)">‹</button>
          <span class="page-info">{{ toolsPage }} / {{ toolsLastPage }}</span>
          <button class="page-btn" :disabled="toolsPage === toolsLastPage" @click="fetchTools(toolsPage + 1)">›</button>
        </div>
      </section>
    </template>

  </div>
</template>

<style scoped>
.profile-page {
  max-width: 1100px;
  margin: 0 auto;
  padding: 2rem 1.25rem 4rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  width: 100%;
}

.profile-card {
  display: flex;
  gap: 1.5rem;
  align-items: flex-start;
  background: var(--color-surface);
  border: 1.5px solid var(--color-stroke);
  border-radius: 1.25rem;
  padding: 1.75rem;
  animation: fadeUp 320ms var(--ease-ui-out) both;
}

@keyframes fadeUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.avatar-wrap {
  flex-shrink: 0;
}

.avatar-img,
.avatar-initials {
  width: 5rem;
  height: 5rem;
  border-radius: 999px;
  object-fit: cover;
  border: 3px solid var(--color-bg);
  box-shadow: 0 0 0 2px var(--color-accent);
}

.avatar-initials {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-accent);
  color: var(--color-bg);
  font-size: 1.375rem;
  font-weight: 800;
}

.profile-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  min-width: 0;
}

.profile-name-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.profile-name {
  font-size: 1.375rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--color-text);
  overflow-wrap: anywhere;
  margin: 0;
}

.msg-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 1rem;
  border-radius: 999px;
  border: 1.5px solid var(--color-accent);
  background: color-mix(in srgb, var(--color-accent) 8%, transparent);
  color: var(--color-accent);
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 150ms ease, transform 150ms var(--ease-ui-out);
}

.msg-btn svg {
  width: 0.875rem;
  height: 0.875rem;
}

.msg-btn:hover {
  background: color-mix(in srgb, var(--color-accent) 18%, transparent);
}

.msg-btn:active {
  transform: scale(0.95);
}

.profile-bio {
  margin: 0.25rem 0 0;
  font-size: 0.9rem;
  color: var(--color-text);
  line-height: 1.5;
  overflow-wrap: anywhere;
}

.profile-joined {
  margin: 0.25rem 0 0;
  font-size: 0.8rem;
  color: var(--color-muted);
}

/* Stats */
.stats-row {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.stat-chip {
  display: inline-flex;
  align-items: baseline;
  gap: 0.35rem;
  padding: 0.5rem 0.875rem;
  border-radius: 0.75rem;
  background: var(--color-surface);
  border: 1.5px solid var(--color-stroke);
}

.stat-num {
  font-weight: 800;
  font-size: 1.05rem;
  color: var(--color-text);
}

.stat-lbl {
  font-size: 0.78rem;
  color: var(--color-muted);
  font-weight: 600;
}

/* Tabs */
.tabs-row {
  display: flex;
  gap: 0.25rem;
  border-bottom: 1.5px solid var(--color-stroke);
}

.tab {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.65rem 1.1rem;
  border: none;
  background: transparent;
  color: var(--color-muted);
  font-size: 0.875rem;
  font-weight: 700;
  cursor: pointer;
  border-bottom: 2.5px solid transparent;
  margin-bottom: -1.5px;
  transition: color 150ms ease, border-color 150ms ease;
}

.tab:hover {
  color: var(--color-text);
}

.tab-active {
  color: var(--color-accent);
  border-bottom-color: var(--color-accent);
}

.tab-count {
  font-size: 0.72rem;
  font-weight: 700;
  background: var(--color-surface);
  color: var(--color-muted);
  padding: 0.1rem 0.45rem;
  border-radius: 999px;
}

.tab-active .tab-count {
  background: color-mix(in srgb, var(--color-accent) 12%, transparent);
  color: var(--color-accent);
}

.panel {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.items-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

@media (max-width: 1023px) {
  .items-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 479px) {
  .items-grid {
    grid-template-columns: 1fr;
  }
}

.empty-state,
.error-card {
  text-align: center;
  padding: 3rem 1rem;
  background: var(--color-surface);
  border: 1.5px dashed var(--color-stroke);
  border-radius: 1rem;
}

.empty-text {
  color: var(--color-muted);
  margin: 0;
}

.error-text {
  color: var(--color-danger);
  font-weight: 600;
  margin: 0 0 1rem;
}

.btn-ghost {
  padding: 0.5rem 1rem;
  border-radius: 0.625rem;
  border: 1.5px solid var(--color-stroke);
  background: transparent;
  color: var(--color-muted);
  font-weight: 600;
  cursor: pointer;
}

.pagination {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  margin: 1rem auto 0;
}

.page-btn {
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 0.625rem;
  border: 1.5px solid var(--color-stroke);
  background: var(--color-bg);
  color: var(--color-text);
  font-weight: 700;
  cursor: pointer;
}

.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.page-info {
  font-size: 0.875rem;
  color: var(--color-muted);
  font-weight: 700;
}

/* Loading skeleton */
.pc-skel .skel-av {
  background: var(--color-stroke);
}

.skel-bar {
  height: 14px;
  border-radius: 6px;
  background: linear-gradient(90deg, var(--color-stroke) 0%, var(--color-surface) 50%, var(--color-stroke) 100%);
  background-size: 200% 100%;
  animation: shimmerUp 1.4s infinite;
}

.skel-bar-wide {
  width: 60%;
}

@keyframes shimmerUp {
  0% {
    background-position: 100% 0;
  }

  100% {
    background-position: -100% 0;
  }
}
</style>
