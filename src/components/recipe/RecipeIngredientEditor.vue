<!-- Hozzávaló szerkesztő a recept editorban — autocomplete, csoportok. -->

<script setup>
import { ref, toRef, onMounted, onBeforeUnmount, nextTick } from 'vue'
import api from '@/services/api'
import BaseSelect from '@/components/BaseSelect.vue'
import BaseAutocomplete from '@/components/BaseAutocomplete.vue'
import { useIngredientSearch } from '@/composables/useIngredientSearch'
import { useIngredientGroups } from '@/composables/useIngredientGroups'

const props = defineProps({
  modelValue: { type: Array, required: true },
  units: { type: Array, default: () => [] },
  errors: { type: Object, default: () => ({}) },
})

const emit = defineEmits(['update:modelValue', 'unit-created'])

const ingWrapRef = ref(null)
const groupInputRef = ref(null)

function update(items) {
  emit('update:modelValue', items)
}

const itemsRef = toRef(props, 'modelValue')

const {
  query: ingQuery,
  results: ingResults,
  searching: ingSearching,
  dropdown: ingDropdown,
  creating: ingCreating,
  queryExists,
  onInput: onIngSearch,
  reset: resetSearch,
  createFromQuery,
} = useIngredientSearch(itemsRef)

const {
  activeGroup,
  newGroupName,
  showGroupInput,
  hasGroups,
  displayedGroups,
  groupNames,
  openGroupInput: _openGroupInput,
  commitNewGroup,
  cancelNewGroup,
  renameGroup: _renameGroup,
  removeGroup: _removeGroup,
} = useIngredientGroups(itemsRef, update)

function openGroupInput() {
  _openGroupInput()
  nextTick(() => groupInputRef.value?.focus())
}

function renameGroup(oldName, newName) {
  _renameGroup(oldName, newName)
}

function removeGroup(name) {
  _removeGroup(name)
}

function onIngInput(e) {
  onIngSearch(e.target.value)
}

function selectIngredient(ing) {
  update([
    ...props.modelValue,
    { id: ing.id, name: ing.name, quantity: '', unit: '', group: activeGroup.value || '' },
  ])
  resetSearch()
}

async function createAndAddIngredient() {
  const created = await createFromQuery()
  if (!created) return
  if (!props.modelValue.some((i) => i.id === created.id)) {
    selectIngredient(created)
  } else {
    resetSearch()
  }
}

function removeIngredient(ing) {
  update(props.modelValue.filter((i) => i !== ing))
}

function updateField(ing, field, value) {
  const next = props.modelValue.map((i) => (i === ing ? { ...i, [field]: value } : i))
  update(next)
}

function stepFor(val) {
  if (val === '' || val === null || val === undefined) return 1
  const s = String(val).replace(',', '.')
  const dot = s.indexOf('.')
  if (dot === -1) return 1
  const decimals = s.length - dot - 1
  if (decimals <= 0) return 1
  return Math.pow(10, -Math.min(decimals, 4))
}

function moveToGroup(ing, groupName) {
  updateField(ing, 'group', groupName ?? '')
}

function onDocMouseDown(e) {
  if (ingWrapRef.value && !ingWrapRef.value.contains(e.target)) {
    ingDropdown.value = false
  }
}

async function onUnitCustom(ing, name) {
  updateField(ing, 'unit', name)
  try {
    await api.post('/units', { name })
    emit('unit-created', name)
  } catch {
    // Szerver-oldali létrehozás best-effort
  }
}

onMounted(() => document.addEventListener('mousedown', onDocMouseDown))
onBeforeUnmount(() => document.removeEventListener('mousedown', onDocMouseDown))
</script>

<template>
  <div class="rie-root">
    <!-- Groups toolbar -->
    <div class="rie-toolbar">
      <p class="rie-hint">
        <template v-if="hasGroups || activeGroup">
          <span>Aktív csoport:</span>
          <BaseSelect
            v-model="activeGroup"
            size="sm"
            :options="[
              { value: '', label: '— Alap —' },
              ...groupNames.map((n) => ({ value: n, label: n })),
            ]"
            class="rie-active-select"
          />
        </template>
        <template v-else>
          Csoportokba rendezheted a hozzávalókat (pl. „A csirkéhez”, „A joghurtos öntethez”).
        </template>
      </p>

      <div v-if="!showGroupInput" class="rie-toolbar-actions">
        <button type="button" class="rie-group-btn" @click="openGroupInput">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            aria-hidden="true"
          >
            <path d="M12 5v14M5 12h14" stroke-linecap="round" />
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
            :title="
              activeGroup === group.name ? 'Kilép a csoportból' : 'Új elemet ehhez a csoporthoz adj'
            "
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
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              aria-hidden="true"
            >
              <path d="M18 6L6 18M6 6l12 12" stroke-linecap="round" />
            </svg>
          </button>
        </header>

        <div
          v-if="group.items.length"
          class="ing-list"
          :class="{ 'ing-list--no-groups': groupNames.length === 0 }"
        >
          <div class="ing-list-hdr">
            <span>Hozzávaló</span>
            <span v-if="groupNames.length > 0">Lista</span>
            <span>Mennyiség</span>
            <span>Egység</span>
            <span />
          </div>
          <div v-for="ing in group.items" :key="`${group.name}-${ing.id}`" class="ing-row">
            <span class="ing-name">
              {{ ing.name }}
            </span>
            <BaseSelect
              v-if="groupNames.length > 0"
              :model-value="ing.group || ''"
              @update:model-value="moveToGroup(ing, $event)"
              size="sm"
              title="Áthelyezés másik csoportba"
              :options="[
                { value: '', label: '— Alap —' },
                ...groupNames.map((n) => ({ value: n, label: n })),
              ]"
              class="ing-move"
            />

            <input
              :value="ing.quantity"
              @input="updateField(ing, 'quantity', $event.target.value)"
              type="number"
              min="0"
              :step="stepFor(ing.quantity)"
              class="ing-input ing-qty"
              :class="{
                'ing-input--err': errors[`ingredients.${modelValue.indexOf(ing)}.quantity`],
              }"
              placeholder="—"
            />

            <BaseAutocomplete
              :model-value="ing.unit || ''"
              :options="units"
              :has-error="!!errors[`ingredients.${modelValue.indexOf(ing)}.unit`]"
              placeholder="—"
              custom-label="Új egység:"
              @update:model-value="updateField(ing, 'unit', $event)"
              @custom="onUnitCustom(ing, $event)"
              class="ing-unit-ac"
            />

            <button
              type="button"
              class="ing-rm"
              @click="removeIngredient(ing)"
              aria-label="Eltávolítás"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
                aria-hidden="true"
              >
                <path d="M18 6L6 18M6 6l12 12" stroke-linecap="round" />
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
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.2"
          class="ing-search-ico"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" stroke-linecap="round" />
        </svg>
        <input
          :value="ingQuery"
          @input="onIngInput"
          type="text"
          class="ing-search-input"
          :placeholder="
            activeGroup ? `Hozzávaló keresése (${activeGroup})…` : 'Hozzávaló keresése…'
          "
          autocomplete="off"
        />
        <svg
          v-if="ingSearching"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.2"
          class="ing-spinner"
          aria-hidden="true"
        >
          <path
            d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"
            stroke-linecap="round"
          />
        </svg>
      </div>

      <div v-if="ingDropdown" class="ing-dropdown" role="listbox">
        <button
          v-for="ing in ingResults"
          :key="ing.id"
          type="button"
          class="ing-option"
          role="option"
          @click="selectIngredient(ing)"
        >
          {{ ing.name }}
        </button>

        <button
          v-if="ingQuery.trim() && !queryExists"
          type="button"
          class="ing-option ing-option--create"
          :disabled="ingCreating || ingSearching"
          @click="createAndAddIngredient"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            aria-hidden="true"
          >
            <path d="M12 5v14M5 12h14" stroke-linecap="round" />
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

.rie-active-select:focus {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 1px var(--color-accent);
}

.rie-toolbar-actions {
  display: flex;
  gap: 6px;
}

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
  transition:
    background 150ms var(--ease-ui-out),
    transform 150ms var(--ease-ui-out);
}

.rie-group-btn svg {
  width: 13px;
  height: 13px;
}

.rie-group-btn:hover {
  background: var(--color-surface);
}

.rie-group-btn:active {
  transform: scale(0.96);
}

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

.rie-group-ok {
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.rie-group-ok:hover {
  background: color-mix(in srgb, var(--color-accent) 10%, transparent);
}

.rie-group-cancel:hover {
  background: var(--color-surface);
}

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

.rie-group--active {
  border-color: var(--color-accent);
}

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
  transition:
    border-color 150ms var(--ease-ui-out),
    background 150ms var(--ease-ui-out);
}

.rie-group-name:hover {
  border-color: var(--color-stroke);
}

.rie-group-name:focus {
  border-color: var(--color-accent);
  background: var(--color-bg);
}

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

.rie-group-use:hover:not(.on) {
  background: var(--color-surface-hover, var(--color-stroke));
}

.rie-group-rm {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  border: 1.5px solid var(--color-stroke);
  background: transparent;
  color: var(--color-muted);
  cursor: pointer;
  flex-shrink: 0;
  transition:
    background 150ms,
    color 150ms,
    border-color 150ms;
}

.rie-group-rm svg {
  width: 12px;
  height: 12px;
}

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
.ing-list {
  overflow: hidden;
}

.ing-list-hdr {
  display: grid;
  grid-template-columns: 1fr 110px 100px 116px 36px;
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
  grid-template-columns: 1fr 110px 100px 116px 36px;
  gap: 8px;
  align-items: center;
  padding: 9px 12px;
  border-top: 1.5px solid var(--color-stroke);
  transition: background 150ms var(--ease-ui-out);
}

/* When no groups exist, the Lista column is removed from both header and rows. */
.ing-list--no-groups .ing-list-hdr,
.ing-list--no-groups .ing-row {
  grid-template-columns: 1fr 100px 116px 36px;
}

.rie-group .ing-row:first-of-type {
  border-top: none;
}

.ing-row:hover {
  background: var(--color-surface);
}

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
.ing-move:focus {
  border-color: var(--color-stroke);
  background: var(--color-bg);
}

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
  transition:
    border-color 150ms var(--ease-ui-out),
    box-shadow 150ms var(--ease-ui-out);
}

.ing-input:focus {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 1px var(--color-accent);
}

.ing-input--err {
  border-color: var(--color-danger);
}

.ing-qty {
  text-align: right;
}

.ing-unit-ac {
  min-width: 0;
}

.ing-rm {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 8px;
  border: 1.5px solid var(--color-stroke);
  background: transparent;
  color: var(--color-muted);
  cursor: pointer;
  flex-shrink: 0;
  transition:
    background 150ms,
    color 150ms,
    border-color 150ms,
    transform 150ms;
}

.ing-rm svg {
  width: 13px;
  height: 13px;
}

.ing-rm:hover {
  background: color-mix(in srgb, var(--color-danger) 10%, transparent);
  color: var(--color-danger);
  border-color: color-mix(in srgb, var(--color-danger) 40%, transparent);
}

.ing-rm:active {
  transform: scale(0.9);
}

/* ── Search ── */
.ing-search {
  position: relative;
}

.ing-search-box {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 14px;
  border-radius: 12px;
  border: 1.5px solid var(--color-stroke);
  background: var(--color-bg);
  transition:
    border-color 150ms var(--ease-ui-out),
    box-shadow 150ms var(--ease-ui-out);
}

.ing-search-box:focus-within {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 1px var(--color-accent);
}

.ing-search-ico {
  width: 15px;
  height: 15px;
  color: var(--color-muted);
  flex-shrink: 0;
}

.ing-search-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  color: var(--color-text);
  font-size: 0.875rem;
  font-family: inherit;
}

.ing-search-input::placeholder {
  color: var(--color-muted);
}

@keyframes rieSpin {
  to {
    transform: rotate(360deg);
  }
}

.ing-spinner {
  width: 15px;
  height: 15px;
  color: var(--color-accent);
  flex-shrink: 0;
  animation: rieSpin 0.8s linear infinite;
}

.ing-dropdown {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  z-index: 50;
  border: 1.5px solid var(--color-stroke);
  border-radius: 12px;
  background: var(--color-bg);
  box-shadow: 0 8px 28px -6px rgba(47, 30, 23, 0.16);
  overflow: hidden;
  animation: rieDropIn 160ms var(--ease-ui-out) both;
}

@keyframes rieDropIn {
  from {
    opacity: 0;
    transform: translateY(-6px) scale(0.98);
  }

  to {
    opacity: 1;
    transform: none;
  }
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

.ing-option:last-child {
  border-bottom: none;
}

.ing-option:hover {
  background: var(--color-surface);
}

.ing-option--create {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--color-accent);
  font-weight: 600;
  background: color-mix(in srgb, var(--color-accent) 5%, transparent);
}

.ing-option--create svg {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

.ing-option--create strong {
  font-weight: 700;
}

.ing-option--create:hover:not(:disabled) {
  background: color-mix(in srgb, var(--color-accent) 12%, transparent);
}

.ing-option--create:disabled {
  opacity: 0.6;
  cursor: wait;
}

@media (max-width: 540px) {
  .ing-list-hdr,
  .ing-row {
    grid-template-columns: 1fr 80px 96px 32px;
    gap: 6px;
    padding: 8px 10px;
  }

  .ing-list--no-groups .ing-list-hdr,
  .ing-list--no-groups .ing-row {
    grid-template-columns: 1fr 80px 96px 32px;
  }
}

@media (max-width: 420px) {
  .ing-list-hdr {
    display: none;
  }

  .ing-row,
  .ing-list--no-groups .ing-row {
    grid-template-columns: 1fr 32px;
    grid-template-rows: auto auto auto;
    row-gap: 6px;
  }

  .ing-name {
    grid-column: 1;
    grid-row: 1;
  }

  .ing-rm {
    grid-column: 2;
    grid-row: 1;
  }

  .ing-qty {
    grid-column: 1 / -1;
    grid-row: 2;
  }

  .ing-unit-ac {
    grid-column: 1 / -1;
    grid-row: 3;
  }
}
</style>
