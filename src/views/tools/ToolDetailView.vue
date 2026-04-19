<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/services/api'
import ToolMap from '@/components/tools/ToolMap.vue'
import BaseButton from '@/components/BaseButton.vue'
import BaseModal from '@/components/BaseModal.vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const tool = ref(null)
const loading = ref(true)
const error = ref('')
const acting = ref(false)
const actionMsg = ref('')
const showDeleteModal = ref(false)
const deleteError = ref('')

async function fetchTool() {
  loading.value = true
  error.value = ''
  try {
    const res = await api.get(`/kitchen-tools/${route.params.id}`)
    tool.value = res.data.data
  } catch (e) {
    if (e.response?.status === 404) error.value = 'Ez az eszköz már nem elérhető.'
    else error.value = 'Nem sikerült betölteni az eszközt.'
  } finally {
    loading.value = false
  }
}

onMounted(fetchTool)

const FALLBACK = 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=1200&q=70'

const priceLabel = computed(() => {
  if (!tool.value) return ''
  const p = Number(tool.value.price_per_day ?? 0)
  return p.toLocaleString('hu-HU', { maximumFractionDigits: 0 }) + ' Ft / nap'
})

const addressLines = computed(() => {
  const t = tool.value
  if (!t) return []
  const lines = []
  const cityLine = [t.postal_code, t.city].filter(Boolean).join(' ')
  if (cityLine) lines.push(cityLine)
  const streetLine = [t.street, t.house_number].filter(Boolean).join(' ')
  if (streetLine) lines.push(streetLine)
  if (t.county) lines.push(t.county)
  return lines
})

async function startChat() {
  if (!authStore.isAuthenticated) {
    router.push({ name: 'login' })
    return
  }
  if (!tool.value?.owner?.id) return

  // Send an initial message from the renter tying the conversation to this tool.
  try {
    acting.value = true
    await api.post('/messages', {
      receiver_id: tool.value.owner.id,
      content: `Szia! Érdeklődnék a(z) "${tool.value.name}" iránt.`,
      tool_id: tool.value.id,
    })
    router.push({
      name: 'messages',
      query: {
        userId: tool.value.owner.id,
        username: tool.value.owner.username,
        toolId: tool.value.id,
      },
    })
  } catch (e) {
    console.error('[startChat]', e)
    actionMsg.value = 'Nem sikerült elküldeni az üzenetet.'
  } finally {
    acting.value = false
  }
}

async function toggleAvailability() {
  if (!tool.value?.is_owner) return
  try {
    acting.value = true
    actionMsg.value = ''
    await api.put(`/kitchen-tools/${tool.value.id}/toggle-availability`, {
      is_available: !tool.value.is_available,
    })
    await fetchTool()
    actionMsg.value = tool.value.is_available ? 'Az eszköz elérhető.' : 'Az eszköz jelenleg nem elérhető.'
  } catch (e) {
    console.error('[toggleAvailability]', e)
    actionMsg.value = 'A művelet nem sikerült.'
  } finally {
    acting.value = false
  }
}

async function confirmDelete() {
  if (!tool.value?.is_owner) return
  deleteError.value = ''
  try {
    acting.value = true
    await api.delete(`/kitchen-tools/${tool.value.id}`)
    router.push({ name: 'tools' })
  } catch (e) {
    console.error('[deleteTool]', e)
    deleteError.value = e.response?.data?.message ?? 'A törlés nem sikerült.'
  } finally {
    acting.value = false
  }
}
</script>

<template>
  <div class="td-root">
    <div v-if="loading" class="td-loading">
      <LoadingSpinner size="h-7 w-7" />
    </div>

    <div v-else-if="error" class="td-empty">
      <p>{{ error }}</p>
      <BaseButton variant="outline" @click="router.back()">Vissza</BaseButton>
    </div>

    <template v-else-if="tool">
      <button class="td-back" @click="router.back()" aria-label="Vissza">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true">
          <path d="M15 18l-6-6 6-6" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        Vissza
      </button>

      <div class="td-layout">
        <div class="td-main">
          <div class="td-hero">
            <img :src="tool.image_url || FALLBACK" :alt="tool.name" class="td-hero-img" />
            <span class="td-badge" :class="tool.is_available ? 'td-badge-free' : 'td-badge-rented'">
              {{ tool.is_available ? 'Elérhető' : 'Jelenleg bérbe adva' }}
            </span>
          </div>

          <h1 class="td-title">{{ tool.name }}</h1>

          <div class="td-meta">
            <span class="td-price">{{ priceLabel }}</span>
            <span class="td-loc" v-if="tool.city">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              {{ tool.city }}<span v-if="tool.county">, {{ tool.county }}</span>
            </span>
          </div>

          <p v-if="tool.description" class="td-desc">{{ tool.description }}</p>

          <div v-if="tool.is_owner && addressLines.length" class="td-address">
            <h3>Pontos cím <span>(csak neked látszik)</span></h3>
            <p v-for="(line, i) in addressLines" :key="i">{{ line }}</p>
          </div>
        </div>

        <aside class="td-side">
          <div class="td-owner-card">
            <div class="td-owner-row">
              <div class="td-avatar">
                <img v-if="tool.owner?.avatar_url" :src="tool.owner.avatar_url" :alt="tool.owner.username" />
                <span v-else>{{ (tool.owner?.username ?? '?').slice(0, 2).toUpperCase() }}</span>
              </div>
              <div>
                <p class="td-owner-label">Tulajdonos</p>
                <RouterLink
                  v-if="tool.owner?.id"
                  :to="{ name: 'user-profile', params: { id: tool.owner.id } }"
                  class="td-owner-name td-owner-link"
                >{{ tool.owner.username }}</RouterLink>
                <p v-else class="td-owner-name">—</p>
              </div>
            </div>

            <template v-if="tool.is_owner">
              <div class="td-owner-actions">
                <RouterLink :to="{ name: 'tool-edit', params: { id: tool.id } }" tabindex="-1">
                  <BaseButton variant="outline" block>Szerkesztés</BaseButton>
                </RouterLink>

                <BaseButton
                  :variant="tool.is_available ? 'outline' : 'primary'"
                  block
                  :disabled="acting"
                  @click="toggleAvailability"
                >
                  {{ tool.is_available ? 'Elérhetetlenné tétel' : 'Újra elérhetővé tétel' }}
                </BaseButton>

                <button class="td-danger-btn" @click="showDeleteModal = true">Törlés</button>
              </div>
            </template>

            <template v-else>
              <BaseButton
                variant="primary"
                block
                :disabled="acting || !tool.owner?.id"
                @click="startChat"
              >
                {{ tool.is_available ? 'Érdeklődöm' : 'Üzenet a tulajnak' }}
              </BaseButton>
              <p class="td-note">
                A pontos címet és bérlés részleteit a chaten beszélitek meg.
              </p>
            </template>

            <p v-if="actionMsg" class="td-action-msg">{{ actionMsg }}</p>
          </div>

          <div class="td-map-card">
            <h3 class="td-map-title">Helyszín</h3>
            <p class="td-map-sub">
              <template v-if="tool.is_owner">Pontos helyzet (csak neked látszik).</template>
              <template v-else>Közelítő helyszín — kb. {{ Math.round((tool.location_radius_m ?? 700) / 100) * 100 }} m-es körben.</template>
            </p>
            <div class="td-map">
              <ToolMap
                v-if="tool.latitude && tool.longitude"
                :lat="tool.latitude"
                :lng="tool.longitude"
                :radius-m="tool.location_radius_m ?? (tool.is_owner ? 0 : 700)"
                :label="tool.city"
                :zoom="tool.is_owner ? 16 : 13"
                :interactive="true"
              />
              <div v-else class="td-map-missing">Nincs elérhető helymeghatározás.</div>
            </div>
          </div>
        </aside>
      </div>
    </template>

    <BaseModal v-if="showDeleteModal" :model-value="true" title="Eszköz törlése" @close="showDeleteModal = false; deleteError = ''">
      <p class="td-modal-text">
        Biztosan törölni szeretnéd a(z) <strong>{{ tool?.name }}</strong> eszközt?
        Ez a művelet nem vonható vissza.
      </p>
      <p v-if="deleteError" class="td-modal-error">{{ deleteError }}</p>
      <template #footer>
        <div class="td-modal-actions">
          <button class="td-ghost" @click="showDeleteModal = false; deleteError = ''">Mégse</button>
          <button class="td-danger-btn td-danger-solid" :disabled="acting" @click="confirmDelete">
            {{ acting ? 'Törlés...' : 'Törlés' }}
          </button>
        </div>
      </template>
    </BaseModal>
  </div>
</template>

<style scoped>
.td-root { padding-bottom: 4rem; }

.td-loading,
.td-empty {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 0.75rem;
  min-height: 24rem;
  color: var(--color-muted);
}

.td-back {
  display: inline-flex; align-items: center; gap: 0.3rem;
  margin-bottom: 1rem;
  padding: 0.4rem 0.75rem 0.4rem 0.55rem;
  border: 1.5px solid var(--color-stroke);
  border-radius: 999px;
  background: transparent;
  font-size: 0.82rem; font-weight: 600;
  color: var(--color-muted);
  cursor: pointer;
  transition: background 150ms var(--ease-ui-out), transform 150ms var(--ease-ui-out), color 150ms var(--ease-ui-out);
}
.td-back:hover  { background: var(--color-surface); color: var(--color-text); }
.td-back:active { transform: scale(0.96); }
.td-back svg { width: 0.95rem; height: 0.95rem; }

.td-layout {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 1.5rem;
  align-items: start;
  animation: tdIn 260ms var(--ease-ui-out) both;
}
@keyframes tdIn {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: none; }
}
@media (max-width: 959px) {
  .td-layout { grid-template-columns: 1fr; }
}

/* main column */
.td-hero {
  position: relative;
  aspect-ratio: 16/9;
  border-radius: 1.125rem;
  overflow: hidden;
  background: var(--color-surface);
  border: 1.5px solid var(--color-stroke);
}
.td-hero-img { width: 100%; height: 100%; object-fit: cover; }

.td-badge {
  position: absolute; top: 0.875rem; left: 0.875rem;
  padding: 0.3rem 0.7rem; border-radius: 999px;
  font-size: 0.75rem; font-weight: 700; letter-spacing: 0.02em;
  backdrop-filter: blur(6px);
}
.td-badge-free   { background: color-mix(in srgb, #5b7f43 88%, transparent); color: #fff; }
.td-badge-rented { background: color-mix(in srgb, #2f1e17 80%, transparent); color: #fff; }

.td-title {
  margin: 1.1rem 0 0.5rem;
  font-size: clamp(1.5rem, 3vw, 2rem);
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--color-text);
}

.td-meta {
  display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;
  margin-bottom: 0.75rem;
}
.td-price {
  font-size: 1rem; font-weight: 800;
  color: var(--color-accent);
  background: color-mix(in srgb, var(--color-accent) 10%, transparent);
  padding: 0.35rem 0.75rem;
  border-radius: 0.55rem;
}
.td-loc {
  display: inline-flex; align-items: center; gap: 0.3rem;
  color: var(--color-muted);
  font-size: 0.88rem;
}
.td-loc svg { width: 0.95rem; height: 0.95rem; color: var(--color-accent); }

.td-desc {
  margin: 0.25rem 0 0;
  font-size: 0.95rem;
  line-height: 1.65;
  color: var(--color-text);
  white-space: pre-wrap;
}

.td-address {
  margin-top: 1.25rem;
  padding: 0.875rem 1rem;
  border-radius: 0.875rem;
  background: color-mix(in srgb, var(--color-accent) 7%, transparent);
  border: 1px dashed var(--color-accent-soft);
}
.td-address h3 {
  margin: 0 0 0.35rem; font-size: 0.85rem; font-weight: 700; color: var(--color-text);
}
.td-address h3 span { font-weight: 500; color: var(--color-muted); font-size: 0.75rem; }
.td-address p { margin: 0.15rem 0; font-size: 0.88rem; color: var(--color-text); }

/* side column */
.td-side { display: flex; flex-direction: column; gap: 1rem; }

.td-owner-card,
.td-map-card {
  padding: 1rem 1.1rem;
  border: 1.5px solid var(--color-stroke);
  border-radius: 1rem;
  background: var(--color-bg);
}

.td-owner-row { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.875rem; }

.td-avatar {
  width: 2.5rem; height: 2.5rem; border-radius: 999px;
  background: var(--color-accent); color: var(--color-bg);
  display: flex; align-items: center; justify-content: center;
  font-size: 0.78rem; font-weight: 800;
  overflow: hidden;
}
.td-avatar img { width: 100%; height: 100%; object-fit: cover; }

.td-owner-label { margin: 0; font-size: 0.72rem; color: var(--color-muted); }
.td-owner-name  { margin: 0; font-size: 0.95rem; font-weight: 700; color: var(--color-text); }
.td-owner-link  { text-decoration: none; transition: color 150ms var(--ease-ui-out); }
.td-owner-link:hover { color: var(--color-accent); }

.td-owner-actions { display: flex; flex-direction: column; gap: 0.5rem; }

.td-danger-btn {
  padding: 0.55rem 1rem;
  border-radius: 0.55rem;
  border: 1.5px solid color-mix(in srgb, var(--color-danger) 35%, transparent);
  background: transparent;
  color: var(--color-danger);
  font-size: 0.85rem; font-weight: 700;
  cursor: pointer;
  transition: background 150ms var(--ease-ui-out), transform 150ms var(--ease-ui-out);
}
.td-danger-btn:hover  { background: color-mix(in srgb, var(--color-danger) 8%, transparent); }
.td-danger-btn:active { transform: scale(0.97); }

.td-note {
  margin: 0.6rem 0 0;
  font-size: 0.75rem;
  color: var(--color-muted);
  line-height: 1.45;
}

.td-action-msg {
  margin: 0.5rem 0 0;
  font-size: 0.78rem;
  color: var(--color-accent);
}

.td-map-title { margin: 0 0 0.25rem; font-size: 0.92rem; font-weight: 700; color: var(--color-text); }
.td-map-sub   { margin: 0 0 0.55rem; font-size: 0.75rem; color: var(--color-muted); }

.td-map {
  min-height: 18rem;
  display: flex;
}
.td-map :deep(.tmap-outer) { flex: 1; }
.td-map :deep(.tmap)       { flex: 1; min-height: 16rem; }

.td-map-missing {
  display: flex; align-items: center; justify-content: center;
  min-height: 16rem; width: 100%;
  border: 1.5px dashed var(--color-stroke);
  border-radius: 1rem;
  font-size: 0.82rem; color: var(--color-muted);
}

.td-modal-text { margin: 0; color: var(--color-muted); line-height: 1.6; font-size: 0.95rem; }
.td-modal-error {
  margin: 0.75rem 0 0; font-size: 0.875rem; color: var(--color-danger);
  background: color-mix(in srgb, var(--color-danger) 8%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-danger) 20%, transparent);
  border-radius: 0.5rem; padding: 0.5rem 0.75rem;
}
.td-modal-actions { display: flex; justify-content: flex-end; gap: 0.5rem; }
.td-ghost {
  padding: 0.5rem 1.125rem;
  border: 1.5px solid var(--color-stroke);
  border-radius: 0.625rem;
  background: transparent;
  color: var(--color-muted);
  font-size: 0.875rem; font-weight: 600;
  cursor: pointer;
  transition: background 150ms var(--ease-ui-out), transform 150ms var(--ease-ui-out);
}
.td-ghost:hover { background: var(--color-surface); color: var(--color-text); }
.td-ghost:active { transform: scale(0.97); }
.td-danger-solid {
  padding: 0.5rem 1.25rem;
  border: none;
  border-radius: 0.625rem;
  background: var(--color-danger);
  color: #fff;
  font-weight: 700; font-size: 0.875rem;
}
.td-danger-solid:hover:not(:disabled) { background: var(--color-danger-hover); }
.td-danger-solid:disabled { opacity: 0.55; cursor: not-allowed; }
</style>
