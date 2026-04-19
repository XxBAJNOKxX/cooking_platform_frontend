<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import api from '@/services/api'

const props = defineProps({
  modelValue: { type: Array, required: true },
  units: { type: Array, default: () => [] },
  errors: { type: Object, default: () => ({}) },
})

const emit = defineEmits(['update:modelValue'])

const ingQuery = ref('')
const ingResults = ref([])
const ingSearching = ref(false)
const ingDropdown = ref(false)
const ingCreating = ref(false)
const ingWrapRef = ref(null)
let ingTimer = null

const newGroupName = ref('')
const showGroupInput = ref(false)
const groupInputRef = ref(null)

const groups = computed(() => {
  const seen = new Map()
  for (const i of props.modelValue) {
    const key = (i.group ?? '').toString()
    if (!seen.has(key)) seen.set(key, [])
    seen.get(key).push(i)
  }
  // default bucket first, then insertion order
  const out = []
  if (seen.has('')) out.push({ name: '', items: seen.get('') })
  for (const [name, items] of seen) if (name !== '') out.push({ name, items })
  return out
})

const hasGroups = computed(() => props.modelValue.some(i => i.group && i.group.trim() !== ''))

function update(items) {
  emit('update:modelValue', items)
}

function onIngInput(e) {
  ingQuery.value = e.target.value
  clearTimeout(ingTimer)
  if (!ingQuery.value.trim()) {
    ingResults.value = []
    ingDropdown.value = false
    return
  }
  ingTimer = setTimeout(async () => {
    ingSearching.value = true
    try {
      const { data } = await api.get('/ingredients', { params: { search: ingQuery.value } })
      const used = new Set(props.modelValue.map(i => i.id))
      ingResults.value = data.data.filter(i => !used.has(i.id))
      ingDropdown.value = true
    } finally {
      ingSearching.value = false
    }
  }, 250)
}

const queryExists = computed(() => {
  const q = ingQuery.value.trim().toLowerCase()
  if (!q) return false
  return ingResults.value.some(i => i.name.trim().toLowerCase() === q)
})

function selectIngredient(ing) {
  update([
    ...props.modelValue,
    { id: ing.id, name: ing.name, quantity: '', unit: '', group: activeGroup.value || '' },
  ])
  ingQuery.value = ''
  ingResults.value = []
  ingDropdown.value = false
}

async function createAndAddIngredient() {
  const name = ingQuery.value.trim()
  if (!name || ingCreating.value) return
  ingCreating.value = true
  try {
    const { data } = await api.post('/ingredients', { name })
    const created = data.data
    if (!props.modelValue.some(i => i.id === created.id)) {
      selectIngredient(created)
    } else {
      ingQuery.value = ''
      ingResults.value = []
      ingDropdown.value = false
    }
  } finally {
    ingCreating.value = false
  }
}

function removeIngredient(ing) {
  update(props.modelValue.filter(i => i !== ing))
}

function updateField(ing, field, value) {
  const next = props.modelValue.map(i => (i === ing ? { ...i, [field]: value } : i))
  update(next)
}

// --- Groups ---
const activeGroup = ref('')

function openGroupInput() {
  showGroupInput.value = true
  newGroupName.value = ''
  setTimeout(() => groupInputRef.value?.focus(), 0)
}

function commitNewGroup() {
  const name = newGroupName.value.trim()
  if (!name) {
    showGroupInput.value = false
    return
  }
  // set as active so the next search adds to it; no items yet until one is added
  activeGroup.value = name
  // seed an empty group marker so it appears in the list — we use a zero-width
  // ingredient? Better: just set activeGroup and display it via a computed list
  // of "known groups" combining used + activeGroup.
  showGroupInput.value = false
  newGroupName.value = ''
}

function cancelNewGroup() {
  showGroupInput.value = false
  newGroupName.value = ''
}

function renameGroup(oldName, newName) {
  const trimmed = (newName ?? '').trim()
  if (trimmed === oldName) return
  const next = props.modelValue.map(i =>
    (i.group ?? '') === oldName ? { ...i, group: trimmed } : i,
  )
  if (activeGroup.value === oldName) activeGroup.value = trimmed
  update(next)
}

function removeGroup(name) {
  // Move items from this group back to the default bucket.
  const next = props.modelValue.map(i =>
    (i.group ?? '') === name ? { ...i, group: '' } : i,
  )
  if (activeGroup.value === name) activeGroup.value = ''
  update(next)
}

function moveToGroup(ing, groupName) {
  updateField(ing, 'group', groupName ?? '')
}

// displayedGroups = groups derived from items + activeGroup if empty
const displayedGroups = computed(() => {
  const g = [...groups.value]
  if (activeGroup.value && !g.some(x => x.name === activeGroup.value)) {
    g.push({ name: activeGroup.value, items: [] })
  }
  return g
})

// All group names for the "move to" dropdown — excluding default
const groupNames = computed(() =>
  displayedGroups.value.map(g => g.name).filter(n => n !== ''),
)

// --- Close dropdown on outside click ---
function onDocClick(e) {
  if (ingWrapRef.value && !ingWrapRef.value.contains(e.target)) {
    ingDropdown.value = false
  }
}

onMounted(() => document.addEventListener('click', onDocClick))
onBeforeUnmount(() => {
  document.removeEventListener('click', onDocClick)
  clearTimeout(ingTimer)
})
</script>

<template>
  <div class="rie-root">
    <datalist id="rie-units-list">
      <option v-for="u in units" :key="u" :value="u" />
    </datalist>

    <!-- Groups toolbar -->
    <div class="rie-toolbar">
      <p class="rie-hint">
        <template v-if="hasGroups || activeGroup">
          Aktív csoport:
          <select
            class="rie-active-select"
            :value="activeGroup"
            @change="activeGroup = $event.target.value"
          >
            <option value="">— Alap —</option>
            <option v-for="name in groupNames" :key="name" :value="name">{{ name }}</option>
          </select>
        </template>
        <template v-else>
          Csoportokba rendezheted a hozzávalókat (pl. „A csirkéhez”, „A joghurtos öntethez”).
        </template>
      </p>

      <div v-if="!showGroupInput" class="rie-toolbar-actions">
        <button type="button" class="rie-group-btn" @click="openGroupInput">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
            <path d="M12 5v14M5 12h14" stroke-linecap="round"/>
          </svg>
          Új csoport
        </button>
      </div>
      <div v-else class="rie-group-input-row">
        <input
          ref="groupInputRef"
          v-model="newGroupName"
          class="rie-group-input"
          placeholder="pl. A csirkéhez"
          maxlength="80"
          @keydown.enter.prevent="commitNewGroup"
          @keydown.esc="cancelNewGroup"
        />
        <button type="button" class="rie-group-ok" @click="commitNewGroup">OK</button>
        <button type="button" class="rie-group-cancel" @click="cancelNewGroup">Mégse</button>
      </div>
    </div>

    <!-- Grouped ingredient list -->
    <div v-if="modelValue.length || activeGroup" class="rie-groups">
      <div
        v-for="group in displayedGroups"
        :key="group.name || '_default'"
        class="rie-group"
        :class="{ 'rie-group--active': activeGroup === group.name }"
      >
        <header v-if="group.name" class="rie-group-hdr">
          <input
            class="rie-group-name"
            :value="group.name"
            maxlength="80"
            @change="renameGroup(group.name, $event.target.value)"
          />
          <button
            type="button"
            class="rie-group-use"
            :class="{ on: activeGroup === group.name }"
            @click="activeGroup = activeGroup === group.name ? '' : group.name"
            :title="activeGroup === group.name ? 'Kilép a csoportból' : 'Új elemet ehhez a csoporthoz adj'"
          >
            {{ activeGroup === group.name ? 'Kiválasztva' : 'Kiválaszt' }}
          </button>
          <button
            type="button"
            class="rie-group-rm"
            @click="removeGroup(group.name)"
            aria-label="Csoport törlése"
            title="Csoport feloldása — hozzávalók átkerülnek az alaphoz"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
              <path d="M18 6L6 18M6 6l12 12" stroke-linecap="round"/>
            </svg>
          </button>
        </header>

        <div v-if="group.items.length" class="ing-list">
          <div class="ing-list-hdr">
            <span>Hozzávaló</span>
            <span>Mennyiség</span>
            <span>Egység</span>
            <span />
          </div>
          <div
            v-for="ing in group.items"
            :key="`${group.name}-${ing.id}`"
            class="ing-row"
          >
            <span class="ing-name">
              {{ ing.name }}
              <select
                v-if="groupNames.length > 0"
                class="ing-move"
                :value="ing.group || ''"
                @change="moveToGroup(ing, $event.target.value)"
                title="Áthelyezés másik csoportba"
              >
                <option value="">— Alap —</option>
                <option v-for="n in groupNames" :key="n" :value="n">{{ n }}</option>
              </select>
            </span>
            <input
              :value="ing.quantity"
              @input="updateField(ing, 'quantity', $event.target.value)"
              type="number"
              min="0.01"
              step="0.01"
              class="ing-input ing-qty"
              :class="{ 'ing-input--err': errors[`ingredients.${modelValue.indexOf(ing)}.quantity`] }"
              placeholder="0"
            />
            <div class="ing-unit-wrap">
              <input
                :value="ing.unit"
                @input="updateField(ing, 'unit', $event.target.value)"
                list="rie-units-list"
                class="ing-input ing-unit"
                :class="{ 'ing-input--err': errors[`ingredients.${modelValue.indexOf(ing)}.unit`] }"
                placeholder="Egység"
                autocomplete="off"
                spellcheck="false"
              />
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="ing-unit-chev" aria-hidden="true">
                <polyline points="6,9 12,15 18,9"/>
              </svg>
            </div>
            <button type="button" class="ing-rm" @click="removeIngredient(ing)" aria-label="Eltávolítás">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
                <path d="M18 6L6 18M6 6l12 12" stroke-linecap="round"/>
              </svg>
            </button>
          </div>
        </div>
        <p v-else class="rie-empty-group">
          Üres csoport — keress rá egy hozzávalóra alább, és ide kerül.
        </p>
      </div>
    </div>

    <!-- Ingredient search -->
    <div class="ing-search" ref="ingWrapRef">
      <div class="ing-search-box">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" class="ing-search-ico" aria-hidden="true">
          <circle cx="11" cy="11" r="8"/>
          <path d="m21 21-4.35-4.35" stroke-linecap="round"/>
        </svg>
        <input
          :value="ingQuery"
          @input="onIngInput"
          type="text"
          class="ing-search-input"
          :placeholder="activeGroup
            ? `Hozzávaló keresése (${activeGroup})…`
            : 'Hozzávaló keresése…'"
          autocomplete="off"
        />
        <svg v-if="ingSearching" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" class="ing-spinner" aria-hidden="true">
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" stroke-linecap="round"/>
        </svg>
      </div>

      <div v-if="ingDropdown" class="ing-dropdown" role="listbox">
        <button
          v-for="ing in ingResults"
          :key="ing.id"
          type="button"
          class="ing-option"
          role="option"
          @mousedown.prevent @click="selectIngredient(ing)"
        >{{ ing.name }}</button>

        <button
          v-if="ingQuery.trim() && !queryExists"
          type="button"
          class="ing-option ing-option--create"
          :disabled="ingCreating || ingSearching"
          @mousedown.prevent
          @click="createAndAddIngredient"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
            <path d="M12 5v14M5 12h14" stroke-linecap="round"/>
          </svg>
          <span>
            <span v-if="ingCreating">Létrehozás…</span>
            <template v-else>
              Új hozzávaló: <strong>{{ ingQuery.trim() }}</strong>
            </template>
          </span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.rie-root {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* ── Toolbar ── */
.rie-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
}

.rie-hint {
  margin: 0;
  font-size: 0.8rem;
  color: var(--color-muted);
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.rie-active-select {
  padding: 4px 8px;
  border-radius: 8px;
  border: 1.5px solid var(--color-stroke);
  background: var(--color-bg);
  color: var(--color-text);
  font-size: 0.8rem;
  font-family: inherit;
  font-weight: 600;
  outline: none;
  cursor: pointer;
}
.rie-active-select:focus { border-color: var(--color-accent); box-shadow: 0 0 0 1px var(--color-accent); }

.rie-toolbar-actions { display: flex; gap: 6px; }

.rie-group-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 10px;
  border: 1.5px solid var(--color-stroke);
  background: var(--color-bg);
  color: var(--color-text);
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 150ms var(--ease-ui-out), transform 150ms var(--ease-ui-out);
}
.rie-group-btn svg { width: 13px; height: 13px; }
.rie-group-btn:hover  { background: var(--color-surface); }
.rie-group-btn:active { transform: scale(0.96); }

.rie-group-input-row {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.rie-group-input {
  padding: 6px 10px;
  border-radius: 8px;
  border: 1.5px solid var(--color-accent);
  background: var(--color-bg);
  color: var(--color-text);
  font-size: 0.825rem;
  font-family: inherit;
  outline: none;
}

.rie-group-ok,
.rie-group-cancel {
  padding: 6px 12px;
  border-radius: 8px;
  border: 1.5px solid var(--color-stroke);
  background: var(--color-bg);
  color: var(--color-text);
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
}
.rie-group-ok     { border-color: var(--color-accent); color: var(--color-accent); }
.rie-group-ok:hover     { background: color-mix(in srgb, var(--color-accent) 10%, transparent); }
.rie-group-cancel:hover { background: var(--color-surface); }

/* ── Groups ── */
.rie-groups {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.rie-group {
  border: 1.5px solid var(--color-stroke);
  border-radius: 12px;
  overflow: hidden;
  transition: border-color 160ms ease;
}

.rie-group--active { border-color: var(--color-accent); }

.rie-group-hdr {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--color-surface);
  border-bottom: 1.5px solid var(--color-stroke);
}

.rie-group-name {
  flex: 1;
  min-width: 0;
  padding: 4px 8px;
  border-radius: 6px;
  border: 1.5px solid transparent;
  background: transparent;
  color: var(--color-text);
  font-size: 0.875rem;
  font-weight: 700;
  font-family: inherit;
  outline: none;
  transition: border-color 150ms var(--ease-ui-out), background 150ms var(--ease-ui-out);
}
.rie-group-name:hover { border-color: var(--color-stroke); }
.rie-group-name:focus { border-color: var(--color-accent); background: var(--color-bg); }

.rie-group-use {
  padding: 4px 10px;
  border-radius: 8px;
  border: 1.5px solid var(--color-stroke);
  background: var(--color-bg);
  color: var(--color-muted);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  cursor: pointer;
  flex-shrink: 0;
}
.rie-group-use.on {
  border-color: var(--color-accent);
  background: color-mix(in srgb, var(--color-accent) 11%, transparent);
  color: var(--color-accent);
}
.rie-group-use:hover:not(.on) { background: var(--color-surface-hover, var(--color-stroke)); }

.rie-group-rm {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px; height: 28px;
  border-radius: 8px;
  border: 1.5px solid var(--color-stroke);
  background: transparent;
  color: var(--color-muted);
  cursor: pointer;
  flex-shrink: 0;
  transition: background 150ms, color 150ms, border-color 150ms;
}
.rie-group-rm svg { width: 12px; height: 12px; }
.rie-group-rm:hover {
  background: color-mix(in srgb, var(--color-danger) 10%, transparent);
  color: var(--color-danger);
  border-color: color-mix(in srgb, var(--color-danger) 40%, transparent);
}

.rie-empty-group {
  margin: 0;
  padding: 16px 12px;
  font-size: 0.8rem;
  color: var(--color-muted);
  font-style: italic;
  text-align: center;
}

/* ── Ingredient list (copied from RecipeEditorView) ── */
.ing-list { overflow: hidden; }

.ing-list-hdr {
  display: grid;
  grid-template-columns: 1fr 100px 116px 36px;
  gap: 8px;
  padding: 7px 12px;
  background: var(--color-surface);
  font-size: 0.69rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-muted);
}

.ing-row {
  display: grid;
  grid-template-columns: 1fr 100px 116px 36px;
  gap: 8px;
  align-items: center;
  padding: 9px 12px;
  border-top: 1.5px solid var(--color-stroke);
  transition: background 150ms var(--ease-ui-out);
}
.rie-group .ing-row:first-of-type { border-top: none; }
.ing-row:hover { background: var(--color-surface); }

.ing-name {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
}

.ing-move {
  margin-left: auto;
  padding: 2px 6px;
  font-size: 0.7rem;
  border-radius: 6px;
  border: 1.5px solid transparent;
  background: transparent;
  color: var(--color-muted);
  cursor: pointer;
  font-family: inherit;
  max-width: 140px;
}
.ing-move:hover,
.ing-move:focus { border-color: var(--color-stroke); background: var(--color-bg); }

.ing-input {
  width: 100%;
  padding: 6px 10px;
  border-radius: 8px;
  border: 1.5px solid var(--color-stroke);
  background: var(--color-bg);
  color: var(--color-text);
  font-size: 0.8rem;
  font-family: inherit;
  outline: none;
  box-sizing: border-box;
  transition: border-color 150ms var(--ease-ui-out), box-shadow 150ms var(--ease-ui-out);
}
.ing-input:focus  { border-color: var(--color-accent); box-shadow: 0 0 0 1px var(--color-accent); }
.ing-input--err   { border-color: var(--color-danger); }
.ing-qty          { text-align: right; }

.ing-unit-wrap { position: relative; width: 100%; }
.ing-unit {
  -webkit-appearance: none;
  appearance: none;
  padding-right: 26px;
  cursor: pointer;
}
.ing-unit-chev {
  position: absolute;
  right: 7px;
  top: 50%;
  transform: translateY(-50%);
  width: 11px; height: 11px;
  color: var(--color-muted);
  pointer-events: none;
}

.ing-rm {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px; height: 30px;
  border-radius: 8px;
  border: 1.5px solid var(--color-stroke);
  background: transparent;
  color: var(--color-muted);
  cursor: pointer;
  flex-shrink: 0;
  transition: background 150ms, color 150ms, border-color 150ms, transform 150ms;
}
.ing-rm svg    { width: 13px; height: 13px; }
.ing-rm:hover  {
  background: color-mix(in srgb, var(--color-danger) 10%, transparent);
  color: var(--color-danger);
  border-color: color-mix(in srgb, var(--color-danger) 40%, transparent);
}
.ing-rm:active { transform: scale(0.9); }

/* ── Search ── */
.ing-search { position: relative; }

.ing-search-box {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 14px;
  border-radius: 12px;
  border: 1.5px solid var(--color-stroke);
  background: var(--color-bg);
  transition: border-color 150ms var(--ease-ui-out), box-shadow 150ms var(--ease-ui-out);
}
.ing-search-box:focus-within {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 1px var(--color-accent);
}

.ing-search-ico { width: 15px; height: 15px; color: var(--color-muted); flex-shrink: 0; }

.ing-search-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  color: var(--color-text);
  font-size: 0.875rem;
  font-family: inherit;
}
.ing-search-input::placeholder { color: var(--color-muted); }

@keyframes rieSpin { to { transform: rotate(360deg); } }
.ing-spinner {
  width: 15px; height: 15px;
  color: var(--color-accent);
  flex-shrink: 0;
  animation: rieSpin 0.8s linear infinite;
}

.ing-dropdown {
  position: absolute;
  top: calc(100% + 6px);
  left: 0; right: 0;
  z-index: 50;
  border: 1.5px solid var(--color-stroke);
  border-radius: 12px;
  background: var(--color-bg);
  box-shadow: 0 8px 28px -6px rgba(47, 30, 23, 0.16);
  overflow: hidden;
  animation: rieDropIn 160ms var(--ease-ui-out) both;
}

@keyframes rieDropIn {
  from { opacity: 0; transform: translateY(-6px) scale(0.98); }
  to   { opacity: 1; transform: none; }
}

.ing-option {
  display: block;
  width: 100%;
  padding: 10px 14px;
  text-align: left;
  border: none;
  border-bottom: 1px solid var(--color-stroke);
  background: transparent;
  color: var(--color-text);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 120ms var(--ease-ui-out);
}
.ing-option:last-child { border-bottom: none; }
.ing-option:hover      { background: var(--color-surface); }

.ing-option--create {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--color-accent);
  font-weight: 600;
  background: color-mix(in srgb, var(--color-accent) 5%, transparent);
}
.ing-option--create svg { width: 14px; height: 14px; flex-shrink: 0; }
.ing-option--create strong { font-weight: 700; }
.ing-option--create:hover:not(:disabled) {
  background: color-mix(in srgb, var(--color-accent) 12%, transparent);
}
.ing-option--create:disabled { opacity: 0.6; cursor: wait; }

@media (max-width: 540px) {
  .ing-list-hdr,
  .ing-row {
    grid-template-columns: 1fr 80px 96px 32px;
    gap: 6px;
    padding: 8px 10px;
  }
}

@media (max-width: 420px) {
  .ing-list-hdr { display: none; }
  .ing-row {
    grid-template-columns: 1fr 32px;
    grid-template-rows: auto auto auto;
    row-gap: 6px;
  }
  .ing-name      { grid-column: 1; grid-row: 1; }
  .ing-rm        { grid-column: 2; grid-row: 1; }
  .ing-qty       { grid-column: 1 / -1; grid-row: 2; }
  .ing-unit-wrap { grid-column: 1 / -1; grid-row: 3; }
}
</style>
