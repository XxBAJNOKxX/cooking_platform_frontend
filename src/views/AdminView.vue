<!-- Admin konzol: felhasználók, kategóriák, egységek, hozzávalók kezelése. -->

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import api from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import Pagination from '@/components/Pagination.vue'
import BaseModal from '@/components/BaseModal.vue'
import BaseButton from '@/components/BaseButton.vue'
import BaseInput from '@/components/BaseInput.vue'

const authStore = useAuthStore()

const TABS = [
  { key: 'users', label: 'Felhasználók', item: 'felhasználó', itemPlural: 'felhasználók' },
  { key: 'recipes', label: 'Receptek', item: 'recept', itemPlural: 'receptek' },
  { key: 'tools', label: 'Eszközök', item: 'eszköz', itemPlural: 'eszközök' },
  { key: 'reviews', label: 'Értékelések', item: 'értékelés', itemPlural: 'értékelések' },
  { key: 'categories', label: 'Kategóriák', item: 'kategória', itemPlural: 'kategóriák' },
  { key: 'ingredients', label: 'Hozzávalók', item: 'hozzávaló', itemPlural: 'hozzávalók' },
  { key: 'units', label: 'Egységek', item: 'egység', itemPlural: 'egységek' },
]

const activeTab = ref('users')
const rows = ref([])
const meta = ref(null)
const loading = ref(false)
const errorMsg = ref('')
const search = ref('')
let searchTimer = null

// Edit modal — generic shape per entity
const editing = ref(null) // { entity, form }
const saving = ref(false)
const editErrors = ref({})

// Delete modal
const pendingDelete = ref(null) // { entity, id, label }
const deleting = ref(false)
const deleteError = ref('')

const activeItemLabel = computed(() => TABS.find((t) => t.key === activeTab.value)?.item ?? '')
const activeItemPlural = computed(
  () => TABS.find((t) => t.key === activeTab.value)?.itemPlural ?? '',
)

function endpointFor(tab, page = 1) {
  const params = { page, per_page: 20 }
  if (search.value.trim()) params.search = search.value.trim()
  switch (tab) {
    case 'users':
      return ['/admin/users', params]
    case 'recipes':
      return ['/recipes', params]
    case 'tools':
      return ['/kitchen-tools', params]
    case 'reviews':
      return ['/reviews', params]
    case 'categories':
      return ['/categories', { ...params, paginate: 1 }]
    case 'ingredients':
      return ['/ingredients', params]
    case 'units':
      return ['/units', { ...params, paginate: 1 }]
  }
}

function normalizeMeta(body) {
  // Resource::collection wraps meta under `meta`; Laravel's raw paginate()
  // puts it at the top level. Normalize so the Pagination component gets
  // the same shape everywhere.
  if (body?.meta) return body.meta
  if (body?.current_page != null) {
    return {
      current_page: body.current_page,
      last_page: body.last_page,
      total: body.total,
      from: body.from,
      to: body.to,
    }
  }
  return null
}

async function loadTab(page = 1) {
  loading.value = true
  errorMsg.value = ''
  try {
    const [url, params] = endpointFor(activeTab.value, page)
    const { data } = await api.get(url, { params })
    rows.value = data.data ?? []
    meta.value = normalizeMeta(data)
  } catch (err) {
    rows.value = []
    meta.value = null
    const status = err.response?.status
    errorMsg.value =
      err.response?.data?.message ||
      (status ? `Hiba ${status}: nem sikerült betölteni.` : 'Nem sikerült betölteni.')
    if (import.meta.env.DEV) console.error('[admin] loadTab', activeTab.value, err)
  } finally {
    loading.value = false
  }
}

watch(activeTab, () => {
  search.value = ''
  loadTab(1)
})

watch(search, () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => loadTab(1), 300)
})

onMounted(() => loadTab(1))

function startEdit(row) {
  editErrors.value = {}
  if (activeTab.value === 'users') {
    editing.value = {
      entity: 'users',
      id: row.id,
      form: {
        username: row.username ?? '',
        email: row.email ?? '',
        bio: row.bio ?? '',
        is_admin: !!row.is_admin,
      },
    }
  } else if (activeTab.value === 'categories') {
    editing.value = { entity: 'categories', id: row.id, form: { name: row.name ?? '' } }
  } else if (activeTab.value === 'ingredients') {
    editing.value = { entity: 'ingredients', id: row.id, form: { name: row.name ?? '' } }
  } else if (activeTab.value === 'units') {
    editing.value = { entity: 'units', id: row.id, form: { name: row.name ?? '' } }
  }
}

async function saveEdit() {
  if (!editing.value) return
  saving.value = true
  editErrors.value = {}
  try {
    const { entity, id, form } = editing.value
    await api.put(`/${entity}/${id}`, form)
    editing.value = null
    await loadTab(meta.value?.current_page ?? 1)
  } catch (err) {
    if (err.response?.status === 422) editErrors.value = err.response.data.errors ?? {}
  } finally {
    saving.value = false
  }
}

function confirmDelete(row) {
  deleteError.value = ''
  const map = {
    users: { url: '/users', label: row.username },
    recipes: { url: '/recipes', label: row.title },
    tools: { url: '/kitchen-tools', label: row.name },
    reviews: { url: '/reviews', label: `#${row.id}` },
    categories: { url: '/categories', label: row.name },
    ingredients: { url: '/ingredients', label: row.name },
    units: { url: '/units', label: row.name ?? row },
  }
  const entry = map[activeTab.value]
  if (!entry) return
  const id = typeof row === 'object' ? row.id : null
  if (!id) return
  pendingDelete.value = { url: entry.url, id, label: entry.label }
}

async function doDelete() {
  if (!pendingDelete.value) return
  deleting.value = true
  deleteError.value = ''
  try {
    await api.delete(`${pendingDelete.value.url}/${pendingDelete.value.id}`)
    pendingDelete.value = null
    await loadTab(meta.value?.current_page ?? 1)
  } catch (err) {
    deleteError.value = err.response?.data?.message || 'Törlés sikertelen.'
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <div class="admin-root">
    <header class="admin-header">
      <h1 class="admin-title">Adminisztráció</h1>
      <p class="admin-sub">Üdv, {{ authStore.user?.username }} — itt mindent kezelhetsz.</p>
    </header>

    <div class="admin-tabs" role="tablist">
      <button
        v-for="t in TABS"
        :key="t.key"
        :class="['tab', { 'tab-active': activeTab === t.key }]"
        role="tab"
        :aria-selected="activeTab === t.key"
        @click="activeTab = t.key"
      >
        {{ t.label }}
      </button>
    </div>

    <div
      class="admin-tools"
      v-if="
        ['users', 'recipes', 'tools', 'reviews', 'ingredients', 'categories', 'units'].includes(
          activeTab,
        )
      "
    >
      <input
        v-model="search"
        type="text"
        class="admin-search"
        :placeholder="`Keresés ${activeItemPlural} között…`"
      />
    </div>

    <div v-if="loading" class="admin-state">Betöltés…</div>

    <div v-else-if="errorMsg" class="admin-state admin-error">{{ errorMsg }}</div>

    <div v-else-if="!rows.length" class="admin-state">Nincs találat.</div>

    <div v-else class="admin-table-wrap">
      <table class="admin-table">
        <!-- Users -->
        <thead v-if="activeTab === 'users'">
          <tr>
            <th>ID</th>
            <th>Név</th>
            <th>Email</th>
            <th>Receptek</th>
            <th>Eszközök</th>
            <th>Admin</th>
            <th></th>
          </tr>
        </thead>
        <tbody v-if="activeTab === 'users'">
          <tr v-for="u in rows" :key="u.id">
            <td>{{ u.id }}</td>
            <td>
              <RouterLink :to="{ name: 'user-profile', params: { id: u.id } }" class="admin-link">
                {{ u.username }}
              </RouterLink>
            </td>
            <td class="admin-muted">{{ u.email }}</td>
            <td>{{ u.recipes_count ?? '—' }}</td>
            <td>{{ u.kitchen_tools_count ?? '—' }}</td>
            <td>{{ u.is_admin ? 'Igen' : 'Nem' }}</td>
            <td class="admin-actions">
              <button class="admin-edit" @click="startEdit(u)">Szerk.</button>
              <button
                class="admin-del"
                :disabled="u.id === authStore.user?.id"
                @click="confirmDelete(u)"
              >
                Törlés
              </button>
            </td>
          </tr>
        </tbody>

        <!-- Recipes -->
        <thead v-if="activeTab === 'recipes'">
          <tr>
            <th>ID</th>
            <th>Cím</th>
            <th>Szerző</th>
            <th>Nehézség</th>
            <th></th>
          </tr>
        </thead>
        <tbody v-if="activeTab === 'recipes'">
          <tr v-for="r in rows" :key="r.id">
            <td>{{ r.id }}</td>
            <td>
              <RouterLink :to="{ name: 'recipe-detail', params: { id: r.id } }" class="admin-link">
                {{ r.title }}
              </RouterLink>
            </td>
            <td class="admin-muted">
              <RouterLink
                v-if="r.author?.id"
                :to="{ name: 'user-profile', params: { id: r.author.id } }"
                class="admin-link"
              >
                {{ r.author.username }}
              </RouterLink>
              <span v-else>—</span>
            </td>
            <td>{{ r.difficulty }}</td>
            <td class="admin-actions">
              <RouterLink :to="{ name: 'recipe-edit', params: { id: r.id } }" class="admin-edit"
                >Szerk.</RouterLink
              >
              <button class="admin-del" @click="confirmDelete(r)">Törlés</button>
            </td>
          </tr>
        </tbody>

        <!-- Tools -->
        <thead v-if="activeTab === 'tools'">
          <tr>
            <th>ID</th>
            <th>Név</th>
            <th>Tulajdonos</th>
            <th>Ár/nap</th>
            <th>Elérhető</th>
            <th></th>
          </tr>
        </thead>
        <tbody v-if="activeTab === 'tools'">
          <tr v-for="t in rows" :key="t.id">
            <td>{{ t.id }}</td>
            <td>
              <RouterLink :to="{ name: 'tool-detail', params: { id: t.id } }" class="admin-link">
                {{ t.name }}
              </RouterLink>
            </td>
            <td class="admin-muted">
              <RouterLink
                v-if="t.owner?.id"
                :to="{ name: 'user-profile', params: { id: t.owner.id } }"
                class="admin-link"
              >
                {{ t.owner.username }}
              </RouterLink>
              <span v-else>—</span>
            </td>
            <td>{{ t.price_per_day }} Ft</td>
            <td>{{ t.is_available ? 'Igen' : 'Nem' }}</td>
            <td class="admin-actions">
              <RouterLink :to="{ name: 'tool-edit', params: { id: t.id } }" class="admin-edit"
                >Szerk.</RouterLink
              >
              <button class="admin-del" @click="confirmDelete(t)">Törlés</button>
            </td>
          </tr>
        </tbody>

        <!-- Reviews -->
        <thead v-if="activeTab === 'reviews'">
          <tr>
            <th>ID</th>
            <th>Csillagok</th>
            <th>Hozzászólás</th>
            <th>Szerző</th>
            <th>Recept</th>
            <th></th>
          </tr>
        </thead>
        <tbody v-if="activeTab === 'reviews'">
          <tr v-for="r in rows" :key="r.id">
            <td>{{ r.id }}</td>
            <td>{{ r.rating }}</td>
            <td class="admin-muted">{{ (r.comment ?? '').slice(0, 60) }}</td>
            <td>
              <RouterLink
                v-if="r.user?.id"
                :to="{ name: 'user-profile', params: { id: r.user.id } }"
                class="admin-link"
              >
                {{ r.user.username }}
              </RouterLink>
              <span v-else>—</span>
            </td>
            <td>
              <RouterLink
                :to="{ name: 'recipe-detail', params: { id: r.recipe?.id ?? r.recipe_id } }"
                class="admin-link"
              >
                {{ r.recipe?.title ?? `#${r.recipe_id}` }}
              </RouterLink>
            </td>
            <td class="admin-actions">
              <button class="admin-del" @click="confirmDelete(r)">Törlés</button>
            </td>
          </tr>
        </tbody>

        <!-- Categories / Ingredients -->
        <thead v-if="['categories', 'ingredients'].includes(activeTab)">
          <tr>
            <th>ID</th>
            <th>Név</th>
            <th></th>
          </tr>
        </thead>
        <tbody v-if="['categories', 'ingredients'].includes(activeTab)">
          <tr v-for="row in rows" :key="row.id">
            <td>{{ row.id }}</td>
            <td>{{ row.name }}</td>
            <td class="admin-actions">
              <button class="admin-edit" @click="startEdit(row)">Szerk.</button>
              <button class="admin-del" @click="confirmDelete(row)">Törlés</button>
            </td>
          </tr>
        </tbody>

        <!-- Units -->
        <thead v-if="activeTab === 'units'">
          <tr>
            <th>ID</th>
            <th>Név</th>
            <th></th>
          </tr>
        </thead>
        <tbody v-if="activeTab === 'units'">
          <tr v-for="u in rows" :key="u.id ?? u">
            <td>{{ u.id ?? '—' }}</td>
            <td>{{ u.name ?? u }}</td>
            <td class="admin-actions">
              <button class="admin-edit" :disabled="!u.id" @click="startEdit(u)">Szerk.</button>
              <button class="admin-del" :disabled="!u.id" @click="confirmDelete(u)">Törlés</button>
            </td>
          </tr>
        </tbody>
      </table>

      <Pagination
        v-if="meta && meta.last_page > 1"
        :meta="meta"
        :item-label="activeItemLabel"
        class="mt-6 mb-1"
        @page-change="loadTab"
      />
    </div>

    <!-- Edit modal -->
    <BaseModal v-model="editing" :title="`Szerkesztés — ${activeItemLabel}`" max-width="max-w-lg">
      <template #default>
        <div v-if="editing" class="edit-form">
          <template v-if="editing.entity === 'users'">
            <BaseInput
              v-model="editing.form.username"
              label="Felhasználónév"
              :error="editErrors.username?.[0]"
            />
            <BaseInput
              v-model="editing.form.email"
              type="email"
              label="E-mail"
              :error="editErrors.email?.[0]"
            />
            <label class="edit-textarea-label">
              <span>Bio</span>
              <textarea v-model="editing.form.bio" class="edit-textarea" rows="3" />
            </label>
            <p v-if="editErrors.bio?.[0]" class="edit-err">{{ editErrors.bio[0] }}</p>
            <label class="edit-check">
              <input type="checkbox" v-model="editing.form.is_admin" />
              <span>Adminisztrátor</span>
            </label>
          </template>
          <template v-else>
            <BaseInput v-model="editing.form.name" label="Név" :error="editErrors.name?.[0]" />
          </template>
        </div>
      </template>
      <template #footer>
        <BaseButton variant="outline" @click="editing = null">Mégse</BaseButton>
        <BaseButton variant="primary" :loading="saving" @click="saveEdit">Mentés</BaseButton>
      </template>
    </BaseModal>

    <!-- Delete confirm modal -->
    <BaseModal v-model="pendingDelete" title="Törlés megerősítése" max-width="max-w-sm">
      <template #default>
        <p v-if="pendingDelete" class="del-confirm">
          Biztos vagy benne, hogy törlöd a(z) <strong>{{ pendingDelete.label }}</strong> elemet?
        </p>
        <p v-if="deleteError" class="edit-err">{{ deleteError }}</p>
      </template>
      <template #footer>
        <BaseButton variant="outline" @click="pendingDelete = null">Mégse</BaseButton>
        <BaseButton variant="danger" :loading="deleting" @click="doDelete">Törlés</BaseButton>
      </template>
    </BaseModal>
  </div>
</template>

<style scoped>
.admin-root {
  padding: 1.5rem 0 3rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}
.admin-header {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
.admin-title {
  font-size: 1.625rem;
  font-weight: 800;
  color: var(--color-text);
}
.admin-sub {
  font-size: 0.875rem;
  color: var(--color-muted);
}

.admin-tabs {
  display: flex;
  gap: 0.25rem;
  flex-wrap: wrap;
  border-bottom: 1.5px solid var(--color-stroke);
  padding-bottom: 0.5rem;
}
.tab {
  padding: 0.5rem 0.875rem;
  border-radius: 0.5rem;
  border: 1.5px solid transparent;
  background: transparent;
  color: var(--color-muted);
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  transition:
    background 150ms ease,
    color 150ms ease;
}
.tab:hover {
  background: var(--color-surface);
  color: var(--color-text);
}
.tab-active {
  background: color-mix(in srgb, var(--color-accent) 12%, transparent);
  color: var(--color-accent);
  border-color: color-mix(in srgb, var(--color-accent) 40%, transparent);
}

.admin-tools {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}
.admin-search {
  flex: 1;
  max-width: 360px;
  padding: 0.5rem 0.75rem;
  border: 1.5px solid var(--color-stroke);
  border-radius: 0.5rem;
  background: var(--color-bg);
  color: var(--color-text);
  font-size: 0.85rem;
  outline: none;
}
.admin-search:focus {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 1px var(--color-accent);
}

.admin-state {
  padding: 2rem 1rem;
  text-align: center;
  color: var(--color-muted);
  font-size: 0.9rem;
}
.admin-error {
  color: var(--color-danger);
  font-weight: 600;
}

.admin-table-wrap {
  border: 1.5px solid var(--color-stroke);
  border-radius: 0.75rem;
  overflow: hidden;
  overflow-x: auto;
  background: var(--color-bg);
}
.admin-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
  min-width: 600px;
}
.admin-table th,
.admin-table td {
  padding: 0.6rem 0.75rem;
  text-align: left;
  border-bottom: 1px solid var(--color-stroke);
}
.admin-table thead th {
  background: var(--color-surface);
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-muted);
}
.admin-table tbody tr:last-child td {
  border-bottom: none;
}
.admin-muted {
  color: var(--color-muted);
}

.admin-actions {
  text-align: right;
  white-space: nowrap;
}
.admin-actions > * + * {
  margin-left: 0.35rem;
}
.admin-table thead th:last-child {
  text-align: right;
}
.admin-edit,
.admin-del {
  display: inline-block;
  padding: 0.3rem 0.6rem;
  border-radius: 0.4rem;
  border: 1.5px solid var(--color-stroke);
  background: var(--color-bg);
  color: var(--color-text);
  font-size: 0.75rem;
  font-weight: 700;
  cursor: pointer;
  text-decoration: none;
  line-height: 1.2;
  transition:
    background 150ms ease,
    color 150ms ease,
    border-color 150ms ease;
}

.admin-link {
  color: var(--color-accent);
  text-decoration: none;
  font-weight: 600;
  transition: color 150ms ease;
}
.admin-link:hover {
  color: var(--color-accent-hover);
  text-decoration: underline;
}
.admin-edit:hover {
  background: var(--color-surface);
}
.admin-del {
  color: var(--color-danger);
  border-color: color-mix(in srgb, var(--color-danger) 40%, transparent);
}
.admin-del:hover {
  background: color-mix(in srgb, var(--color-danger) 10%, transparent);
}
.admin-del:disabled,
.admin-edit:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.edit-form {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.edit-textarea-label {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--color-text);
}
.edit-textarea {
  border: 1.5px solid var(--color-stroke);
  border-radius: 0.5rem;
  padding: 0.5rem 0.75rem;
  font-family: inherit;
  font-size: 0.85rem;
  resize: vertical;
  outline: none;
  background: var(--color-bg);
  color: var(--color-text);
  transition:
    border-color 150ms ease,
    box-shadow 150ms ease;
}
.edit-textarea:focus {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 1px var(--color-accent);
}
.edit-check {
  display: inline-flex;
  gap: 0.4rem;
  font-size: 0.85rem;
  font-weight: 600;
  align-items: center;
}
.edit-check input[type='checkbox'] {
  accent-color: var(--color-accent);
}
.edit-err {
  color: var(--color-danger);
  font-size: 0.8rem;
}
.del-confirm {
  font-size: 0.9rem;
  color: var(--color-text);
}
</style>
