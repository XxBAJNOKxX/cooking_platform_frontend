<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import api from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import RecipeCard from '@/components/RecipeCard.vue'
import RecipeSkeletonCard from '@/components/RecipeSkeletonCard.vue'
import ToolCard from '@/components/tools/ToolCard.vue'
import ToolSkeletonCard from '@/components/tools/ToolSkeletonCard.vue'
import SettingsModal from '@/components/SettingsModal.vue'
import BaseModal from '@/components/BaseModal.vue'
import BaseButton from '@/components/BaseButton.vue'

const authStore = useAuthStore()

// ─── Profile ──────────────────────────────────────────────────────────────────

const profile = computed(() => authStore.user)
const initials = computed(() => {
  const name = profile.value?.username ?? '?'
  return name.slice(0, 2).toUpperCase()
})

const joinedLabel = computed(() => {
  if (!profile.value?.joined_at) return ''
  return new Date(profile.value.joined_at).toLocaleDateString('hu-HU', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
})

const showSettings = ref(false)

// ─── Tabs ─────────────────────────────────────────────────────────────────────

const activeTab = ref('recipes')

// ─── My Recipes ───────────────────────────────────────────────────────────────

const recipes = ref([])
const recipesLoading = ref(true)
const recipesError = ref(null)
const recipesPage = ref(1)
const recipesLastPage = ref(1)
const recipesTotal = ref(0)
const recipesLoaded = ref(false)

async function fetchMyRecipes(page = 1) {
  if (!profile.value?.id) return
  recipesLoading.value = true
  recipesError.value = null
  try {
    const res = await api.get('/recipes', {
      params: { user_id: profile.value.id, per_page: 12, page },
    })
    recipes.value = res.data.data ?? []
    recipesPage.value = res.data.meta?.current_page ?? 1
    recipesLastPage.value = res.data.meta?.last_page ?? 1
    recipesTotal.value = res.data.meta?.total ?? recipes.value.length
    recipesLoaded.value = true
  } catch {
    recipesError.value = 'Nem sikerült betölteni a recepteket.'
  } finally {
    recipesLoading.value = false
  }
}

// ─── My Tools ─────────────────────────────────────────────────────────────────

const tools = ref([])
const toolsLoading = ref(false)
const toolsError = ref(null)
const toolsPage = ref(1)
const toolsLastPage = ref(1)
const toolsTotal = ref(0)
const toolsLoaded = ref(false)

async function fetchMyTools(page = 1) {
  if (!profile.value?.id) return
  toolsLoading.value = true
  toolsError.value = null
  try {
    const res = await api.get('/kitchen-tools', {
      params: { user_id: profile.value.id, per_page: 12, page },
    })
    tools.value = res.data.data ?? []
    toolsPage.value = res.data.meta?.current_page ?? 1
    toolsLastPage.value = res.data.meta?.last_page ?? 1
    toolsTotal.value = res.data.meta?.total ?? tools.value.length
    toolsLoaded.value = true
  } catch {
    toolsError.value = 'Nem sikerült betölteni az eszközöket.'
  } finally {
    toolsLoading.value = false
  }
}

watch(activeTab, (tab) => {
  if (tab === 'tools' && !toolsLoaded.value && !toolsLoading.value) {
    fetchMyTools(1)
  }
})

// ─── Delete (shared modal) ────────────────────────────────────────────────────

const deleteTarget = ref(null)
const deleteKind = ref(null) // 'recipe' | 'tool'
const deleting = ref(false)
const deleteError = ref('')

function confirmDeleteRecipe(recipe) {
  deleteTarget.value = recipe
  deleteKind.value = 'recipe'
  deleteError.value = ''
}

function confirmDeleteTool(tool) {
  deleteTarget.value = tool
  deleteKind.value = 'tool'
  deleteError.value = ''
}

function closeDelete() {
  deleteTarget.value = null
  deleteKind.value = null
  deleteError.value = ''
}

async function doDelete() {
  if (!deleteTarget.value) return
  deleting.value = true
  deleteError.value = ''
  try {
    if (deleteKind.value === 'recipe') {
      await api.delete(`/recipes/${deleteTarget.value.id}`)
      recipes.value = recipes.value.filter(r => r.id !== deleteTarget.value.id)
      recipesTotal.value = Math.max(0, recipesTotal.value - 1)
    } else if (deleteKind.value === 'tool') {
      await api.delete(`/kitchen-tools/${deleteTarget.value.id}`)
      tools.value = tools.value.filter(t => t.id !== deleteTarget.value.id)
      toolsTotal.value = Math.max(0, toolsTotal.value - 1)
    }
    closeDelete()
  } catch {
    deleteError.value = 'Törlés sikertelen. Próbáld újra.'
  } finally {
    deleting.value = false
  }
}

const deleteTitle = computed(() =>
  deleteKind.value === 'tool' ? 'Eszköz törlése' : 'Recept törlése'
)

onMounted(() => {
  fetchMyRecipes()
  fetchMyTools()
})
</script>

<template>
  <div class="profile-page">

    <!-- ── Header card ──────────────────────────────────────────── -->
    <div class="profile-card">
      <div class="avatar-wrap">
        <img v-if="profile?.avatar_url" :src="profile.avatar_url" :alt="profile.username" class="avatar-img" />
        <div v-else class="avatar-initials">{{ initials }}</div>
      </div>

      <div class="profile-info">
        <div class="profile-name-row">
          <h1 class="profile-name">{{ profile?.username }}</h1>
          <button class="edit-btn" @click="showSettings = true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke-linecap="round"/>
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke-linecap="round"/>
            </svg>
            Szerkesztés
          </button>
        </div>

        <p class="profile-email">{{ profile?.email }}</p>

        <p v-if="profile?.phone" class="profile-meta">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true" class="meta-icon">
            <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 11a19.79 19.79 0 01-3.07-8.67A2 2 0 012 .84h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
          </svg>
          {{ profile.phone }}
        </p>

        <p v-if="profile?.bio" class="profile-bio">{{ profile.bio }}</p>

        <p v-if="joinedLabel" class="profile-joined">Csatlakozott: {{ joinedLabel }}</p>
      </div>
    </div>

    <!-- ── Stats row ────────────────────────────────────────────── -->
    <div class="stats-row">
      <div class="stat-chip">
        <span class="stat-num">{{ recipesTotal }}</span>
        <span class="stat-lbl">recept</span>
      </div>
      <div class="stat-chip">
        <span class="stat-num">{{ toolsTotal }}</span>
        <span class="stat-lbl">eszköz</span>
      </div>
      <RouterLink to="/messages" class="stat-chip stat-link">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="stat-icon" aria-hidden="true">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
        </svg>
        Üzenetek
      </RouterLink>
    </div>

    <!-- ── Tabs ─────────────────────────────────────────────────── -->
    <div class="tabs-row" role="tablist">
      <button
        class="tab"
        :class="{ 'tab-active': activeTab === 'recipes' }"
        role="tab"
        :aria-selected="activeTab === 'recipes'"
        @click="activeTab = 'recipes'"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path d="M18 3a3 3 0 00-3 3v11H3V6a3 3 0 016 0v2" stroke-linecap="round"/>
          <path d="M21 6v12a3 3 0 01-3 3H6" stroke-linecap="round"/>
        </svg>
        Receptek
        <span class="tab-count">{{ recipesTotal }}</span>
      </button>
      <button
        class="tab"
        :class="{ 'tab-active': activeTab === 'tools' }"
        role="tab"
        :aria-selected="activeTab === 'tools'"
        @click="activeTab = 'tools'"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        Eszközök
        <span class="tab-count">{{ toolsTotal }}</span>
      </button>
    </div>

    <!-- ── Recipes panel ────────────────────────────────────────── -->
    <section v-if="activeTab === 'recipes'" class="panel" role="tabpanel">
      <div class="section-header">
        <h2 class="section-title">Receptjeim</h2>
        <RouterLink :to="{ name: 'recipe-create' }" class="new-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
            <path d="M12 5v14M5 12h14" stroke-linecap="round"/>
          </svg>
          Új recept
        </RouterLink>
      </div>

      <div v-if="recipesLoading" class="items-grid" aria-busy="true" aria-label="Receptek betöltése">
        <RecipeSkeletonCard
          v-for="i in 6"
          :key="i"
          :index="i"
        />
      </div>

      <p v-else-if="recipesError" class="error-text">{{ recipesError }}</p>

      <div v-else-if="recipes.length === 0" class="empty-state">
        <p class="empty-text">Még nincs recepted.</p>
        <RouterLink :to="{ name: 'recipe-create' }" class="empty-cta">Hozz létre egyet →</RouterLink>
      </div>

      <div v-else class="items-grid">
        <div v-for="(recipe, i) in recipes" :key="recipe.id" class="item-wrap">
          <RecipeCard :recipe="recipe" :index="i" />
          <div class="item-actions">
            <RouterLink :to="{ name: 'recipe-edit', params: { id: recipe.id } }" class="action-btn action-edit" title="Szerkesztés" aria-label="Szerkesztés">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke-linecap="round"/>
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke-linecap="round"/>
              </svg>
            </RouterLink>
            <button class="action-btn action-delete" title="Törlés" aria-label="Törlés" @click="confirmDeleteRecipe(recipe)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
                <polyline points="3,6 5,6 21,6"/><path d="M19,6l-1,14H6L5,6"/>
                <path d="M10 11v6M14 11v6M9 6V4h6v2" stroke-linecap="round"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div v-if="recipesLastPage > 1" class="pagination">
        <button
          class="page-btn"
          :disabled="recipesPage === 1"
          @click="fetchMyRecipes(recipesPage - 1)"
          aria-label="Előző oldal"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
            <polyline points="15,18 9,12 15,6"/>
          </svg>
        </button>
        <span class="page-info">{{ recipesPage }} / {{ recipesLastPage }}</span>
        <button
          class="page-btn"
          :disabled="recipesPage === recipesLastPage"
          @click="fetchMyRecipes(recipesPage + 1)"
          aria-label="Következő oldal"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
            <polyline points="9,18 15,12 9,6"/>
          </svg>
        </button>
      </div>
    </section>

    <!-- ── Tools panel ──────────────────────────────────────────── -->
    <section v-else-if="activeTab === 'tools'" class="panel" role="tabpanel">
      <div class="section-header">
        <h2 class="section-title">Eszközeim</h2>
        <RouterLink :to="{ name: 'tool-create' }" class="new-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
            <path d="M12 5v14M5 12h14" stroke-linecap="round"/>
          </svg>
          Új eszköz
        </RouterLink>
      </div>

      <div v-if="toolsLoading" class="items-grid" aria-busy="true" aria-label="Eszközök betöltése">
        <ToolSkeletonCard
          v-for="i in 6"
          :key="i"
          :index="i"
        />
      </div>

      <p v-else-if="toolsError" class="error-text">{{ toolsError }}</p>

      <div v-else-if="tools.length === 0" class="empty-state">
        <p class="empty-text">Még nincs eszközöd bérbeadásra.</p>
        <RouterLink :to="{ name: 'tool-create' }" class="empty-cta">Hozz létre egyet →</RouterLink>
      </div>

      <div v-else class="items-grid">
        <div v-for="(tool, i) in tools" :key="tool.id" class="item-wrap">
          <ToolCard :tool="tool" :index="i" />
          <div class="item-actions">
            <RouterLink :to="{ name: 'tool-edit', params: { id: tool.id } }" class="action-btn action-edit" title="Szerkesztés" aria-label="Szerkesztés">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke-linecap="round"/>
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke-linecap="round"/>
              </svg>
            </RouterLink>
            <button class="action-btn action-delete" title="Törlés" aria-label="Törlés" @click="confirmDeleteTool(tool)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
                <polyline points="3,6 5,6 21,6"/><path d="M19,6l-1,14H6L5,6"/>
                <path d="M10 11v6M14 11v6M9 6V4h6v2" stroke-linecap="round"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div v-if="toolsLastPage > 1" class="pagination">
        <button
          class="page-btn"
          :disabled="toolsPage === 1"
          @click="fetchMyTools(toolsPage - 1)"
          aria-label="Előző oldal"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
            <polyline points="15,18 9,12 15,6"/>
          </svg>
        </button>
        <span class="page-info">{{ toolsPage }} / {{ toolsLastPage }}</span>
        <button
          class="page-btn"
          :disabled="toolsPage === toolsLastPage"
          @click="fetchMyTools(toolsPage + 1)"
          aria-label="Következő oldal"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
            <polyline points="9,18 15,12 9,6"/>
          </svg>
        </button>
      </div>
    </section>

    <!-- ── Settings modal ───────────────────────────────────────── -->
    <SettingsModal v-model="showSettings" />

    <!-- ── Delete confirm modal ─────────────────────────────────── -->
    <BaseModal
      v-if="deleteTarget"
      :model-value="true"
      :title="deleteTitle"
      max-width="max-w-sm"
      @close="closeDelete"
    >
      <p class="del-text">
        Biztosan törölni szeretnéd a/az <strong>{{ deleteTarget?.name ?? deleteTarget?.title }}</strong>
        {{ deleteKind === 'tool' ? 'eszközt' : 'receptet' }}?
        Ez a művelet nem vonható vissza.
      </p>
      <p v-if="deleteError" class="del-error">{{ deleteError }}</p>
      <template #footer>
        <div class="del-footer">
          <BaseButton variant="outline" @click="closeDelete">Mégse</BaseButton>
          <BaseButton variant="danger" :loading="deleting" @click="doDelete">Törlés</BaseButton>
        </div>
      </template>
    </BaseModal>

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
}

/* ── Profile card ──────────────────────────────────────────────── */
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
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ── Avatar ── */
.avatar-wrap { flex-shrink: 0; }

.avatar-img,
.avatar-initials {
  width: 5rem; height: 5rem;
  border-radius: 999px;
  object-fit: cover;
  border: 3px solid var(--color-bg);
  box-shadow: 0 0 0 2px var(--color-accent);
}

.avatar-initials {
  display: flex; align-items: center; justify-content: center;
  background: var(--color-accent);
  color: var(--color-bg);
  font-size: 1.375rem;
  font-weight: 800;
  letter-spacing: -0.01em;
}

/* ── Info ── */
.profile-info { flex: 1; display: flex; flex-direction: column; gap: 0.4rem; min-width: 0; }

.profile-name-row { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; }

.profile-name {
  font-size: 1.375rem; font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--color-text);
  overflow-wrap: anywhere;
}

.edit-btn {
  display: inline-flex; align-items: center; gap: 0.35rem;
  padding: 0.35rem 0.875rem;
  border-radius: 999px;
  border: 1.5px solid var(--color-stroke);
  background: var(--color-bg);
  font-size: 0.78rem; font-weight: 700;
  color: var(--color-muted);
  cursor: pointer;
  transition: border-color 150ms ease, color 150ms ease, background 150ms ease, transform 150ms var(--ease-ui-out);
}
.edit-btn svg { width: 0.8125rem; height: 0.8125rem; }
@media (hover: hover) and (pointer: fine) {
  .edit-btn:hover { border-color: var(--color-accent); color: var(--color-accent); background: color-mix(in srgb, var(--color-accent) 8%, transparent); }
}
.edit-btn:active { transform: scale(0.95); }

.profile-email { font-size: 0.875rem; color: var(--color-muted); overflow-wrap: anywhere; }

.profile-meta {
  display: flex; align-items: center; gap: 0.3rem;
  font-size: 0.875rem; color: var(--color-muted);
}
.meta-icon { width: 0.875rem; height: 0.875rem; flex-shrink: 0; }

.profile-bio {
  font-size: 0.9rem; color: var(--color-text);
  line-height: 1.6; margin-top: 0.1rem;
  overflow-wrap: anywhere;
}

.profile-joined { font-size: 0.78rem; color: var(--color-muted); }

/* ── Stats ──────────────────────────────────────────────────────── */
.stats-row {
  display: flex; gap: 0.75rem; flex-wrap: wrap;
  animation: fadeUp 320ms var(--ease-ui-out) 60ms both;
}

.stat-chip {
  display: flex; align-items: center; gap: 0.4rem;
  padding: 0.5rem 1rem;
  border-radius: 999px;
  border: 1.5px solid var(--color-stroke);
  background: var(--color-surface);
  font-size: 0.875rem; font-weight: 600;
  color: var(--color-muted);
  text-decoration: none;
  transition: border-color 160ms ease, background 160ms ease, transform 160ms var(--ease-ui-out);
}
.stat-num { font-weight: 800; color: var(--color-text); }
.stat-icon { width: 1rem; height: 1rem; }
.stat-link { cursor: pointer; }
@media (hover: hover) and (pointer: fine) {
  .stat-link:hover { border-color: var(--color-accent); color: var(--color-accent); background: color-mix(in srgb, var(--color-accent) 8%, transparent); }
}
.stat-link:active { transform: scale(0.96); }

/* ── Tabs ──────────────────────────────────────────────────────── */
.tabs-row {
  display: flex;
  gap: 0.25rem;
  border-bottom: 1.5px solid var(--color-stroke);
  animation: fadeUp 320ms var(--ease-ui-out) 80ms both;
  overflow-x: auto;
  scrollbar-width: none;
}
.tabs-row::-webkit-scrollbar { display: none; }

.tab {
  display: inline-flex; align-items: center; gap: 0.4rem;
  padding: 0.625rem 1rem;
  border: none;
  border-bottom: 2.5px solid transparent;
  background: transparent;
  color: var(--color-muted);
  font-size: 0.875rem; font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  margin-bottom: -1.5px;
  transition: color 150ms ease, border-color 150ms ease;
}
.tab svg { width: 0.9rem; height: 0.9rem; }
.tab-count {
  display: inline-flex; align-items: center; justify-content: center;
  min-width: 1.25rem; height: 1.25rem;
  padding: 0 0.35rem;
  border-radius: 999px;
  background: var(--color-surface);
  border: 1.5px solid var(--color-stroke);
  font-size: 0.7rem; font-weight: 700;
  color: var(--color-muted);
}
@media (hover: hover) and (pointer: fine) {
  .tab:hover { color: var(--color-text); }
}
.tab-active {
  color: var(--color-accent);
  border-bottom-color: var(--color-accent);
}
.tab-active .tab-count {
  border-color: var(--color-accent-soft, var(--color-accent));
  color: var(--color-accent);
  background: color-mix(in srgb, var(--color-accent) 10%, transparent);
}

/* ── Panel ─────────────────────────────────────────────────────── */
.panel {
  display: flex; flex-direction: column; gap: 1rem;
  animation: fadeUp 320ms var(--ease-ui-out) 100ms both;
}

.section-header {
  display: flex; align-items: center; justify-content: space-between;
}

.section-title {
  font-size: 1.125rem; font-weight: 800;
  letter-spacing: -0.01em; color: var(--color-text);
}

.new-btn {
  display: inline-flex; align-items: center; gap: 0.35rem;
  padding: 0.4rem 0.875rem;
  border-radius: 999px;
  background: var(--color-accent);
  color: var(--color-bg);
  font-size: 0.8rem; font-weight: 700;
  text-decoration: none;
  transition: background 150ms ease, transform 150ms var(--ease-ui-out);
}
.new-btn svg { width: 0.875rem; height: 0.875rem; }
.new-btn:hover { background: var(--color-accent-hover); }
.new-btn:active { transform: scale(0.96); }

/* ── States ── */
.error-text { font-size: 0.875rem; color: var(--color-danger); text-align: center; }

.empty-state {
  display: flex; flex-direction: column; align-items: center; gap: 0.5rem;
  padding: 3rem; text-align: center;
  background: var(--color-surface);
  border: 1.5px dashed var(--color-stroke);
  border-radius: 1rem;
}
.empty-text { font-size: 0.9rem; color: var(--color-muted); }
.empty-cta  { font-size: 0.875rem; font-weight: 700; color: var(--color-accent); text-decoration: underline; text-underline-offset: 3px; }

/* ── Items grid (recipes + tools share) ── */
.items-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}
@media (max-width: 1023px) { .items-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 479px)  { .items-grid { grid-template-columns: 1fr; } }

.item-wrap { position: relative; }

.item-actions {
  position: absolute;
  top: 0.5rem; right: 0.5rem;
  display: flex; gap: 0.3rem;
  opacity: 0;
  transition: opacity 180ms var(--ease-ui-out);
  z-index: 2;
}

@media (hover: hover) and (pointer: fine) {
  .item-wrap:hover .item-actions,
  .item-wrap:focus-within .item-actions {
    opacity: 1;
  }
}

/* Touch devices: always visible */
@media (hover: none), (pointer: coarse) {
  .item-actions { opacity: 1; }
}

.action-btn {
  display: flex; align-items: center; justify-content: center;
  width: 2rem; height: 2rem;
  border-radius: 0.5rem;
  border: none;
  cursor: pointer;
  backdrop-filter: blur(6px);
  box-shadow: 0 1px 3px rgba(0,0,0,0.15);
  transition: transform 150ms var(--ease-ui-out), background 150ms ease;
}
.action-btn svg { width: 0.875rem; height: 0.875rem; }

.action-edit {
  background: rgba(255,255,255,0.92);
  color: var(--color-text);
  text-decoration: none;
}
.action-edit:hover { background: white; }

.action-delete {
  background: rgba(217, 75, 75, 0.92);
  color: white;
}
.action-delete:hover { background: var(--color-danger); }
.action-btn:active { transform: scale(0.90); }

/* ── Delete modal ── */
.del-text { font-size: 0.9375rem; color: var(--color-muted); line-height: 1.6; }
.del-error {
  margin-top: 0.75rem; font-size: 0.8125rem; color: var(--color-danger);
  padding: 0.5rem 0.75rem; border-radius: 0.5rem;
  background: color-mix(in srgb, var(--color-danger) 8%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-danger) 22%, transparent);
}
.del-footer { display: flex; justify-content: flex-end; gap: 0.5rem; }

/* ── Pagination ── */
.pagination {
  display: flex; align-items: center; justify-content: center; gap: 0.75rem;
  margin-top: 0.5rem;
}

.page-btn {
  display: flex; align-items: center; justify-content: center;
  width: 2.25rem; height: 2.25rem;
  border-radius: 0.625rem;
  border: 1.5px solid var(--color-stroke);
  background: var(--color-surface);
  color: var(--color-text);
  cursor: pointer;
  transition: background 150ms ease, transform 150ms var(--ease-ui-out);
}
.page-btn svg { width: 1rem; height: 1rem; }
.page-btn:hover:not(:disabled) { background: var(--color-bg); border-color: var(--color-accent); color: var(--color-accent); }
.page-btn:active:not(:disabled) { transform: scale(0.92); }
.page-btn:disabled { opacity: 0.35; cursor: not-allowed; }

.page-info {
  font-size: 0.8125rem; font-weight: 700;
  color: var(--color-muted);
  min-width: 3rem; text-align: center;
}

/* ── Responsive ── */
@media (max-width: 600px) {
  .profile-page { padding: 1.5rem 0.875rem 3rem; }
  .profile-card { flex-direction: column; align-items: center; text-align: center; padding: 1.25rem; }
  .profile-name-row { justify-content: center; }
  .profile-meta { justify-content: center; }
}
</style>
