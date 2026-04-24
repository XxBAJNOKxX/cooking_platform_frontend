<!-- Recept hozzáadása a naptárhoz modal (dátum + típus + adagok). -->

<script setup>
import { ref, watch } from 'vue'
import api from '@/services/api'
import BaseModal from '@/components/BaseModal.vue'
import BaseButton from '@/components/BaseButton.vue'
import { RouterLink } from 'vue-router'

const CAL_MEAL_TYPES = ['Reggeli', 'Tízórai', 'Ebéd', 'Uzsonna', 'Vacsora']

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  recipe: { type: Object, default: null },
})

const emit = defineEmits(['update:modelValue'])

function getTodayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const todayStr = getTodayStr()
const calDate = ref(todayStr)
const calMealType = ref('Ebéd')
const calServings = ref(4)
const calLoading = ref(false)
const calError = ref('')
const calSuccess = ref(false)

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      calDate.value = todayStr
      calMealType.value = 'Ebéd'
      calServings.value = props.recipe?.servings ?? 4
      calError.value = ''
      calSuccess.value = false
    }
  },
)

function close() {
  emit('update:modelValue', false)
}

async function submit() {
  if (!props.recipe) return
  calLoading.value = true
  calError.value = ''
  try {
    await api.post('/meal-plans', {
      recipe_id: props.recipe.id,
      planned_date: calDate.value,
      meal_type: calMealType.value,
      servings: calServings.value,
    })
    calSuccess.value = true
  } catch {
    calError.value = 'Nem sikerült hozzáadni. Próbáld újra!'
  } finally {
    calLoading.value = false
  }
}
</script>

<template>
  <BaseModal
    v-if="modelValue"
    :model-value="true"
    title="Hozzáadás a naptárhoz"
    @close="close"
    max-width="max-w-sm"
  >
    <Transition name="cal-success" mode="out-in">
      <div v-if="calSuccess" class="cal-success-body">
        <div class="cal-success-icon">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            aria-hidden="true"
          >
            <path d="M20 6L9 17l-5-5" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </div>
        <p class="cal-success-title">Hozzáadva!</p>
        <p class="cal-success-sub">{{ recipe?.title }}</p>
        <RouterLink :to="{ name: 'calendar' }" class="cal-success-link" @click="close">
          Naptár megtekintése →
        </RouterLink>
      </div>

      <div v-else class="cal-form-body">
        <p class="cal-recipe-name">{{ recipe?.title }}</p>

        <div class="cal-field">
          <label class="cal-label" for="cal-date">Dátum</label>
          <input
            id="cal-date"
            v-model="calDate"
            type="date"
            class="cal-date-input"
            :min="todayStr"
          />
        </div>

        <div class="cal-field">
          <span class="cal-label">Étkezés típusa</span>
          <div class="cal-meal-pills">
            <button
              v-for="type in CAL_MEAL_TYPES"
              :key="type"
              class="cal-meal-pill"
              :class="{ active: calMealType === type }"
              @click="calMealType = type"
            >
              {{ type }}
            </button>
          </div>
        </div>

        <div class="cal-field">
          <label class="cal-label" for="cal-servings">Hány főre</label>
          <div class="cal-servings">
            <button
              type="button"
              class="cal-serv-btn"
              :disabled="calServings <= 1"
              @click="calServings = Math.max(1, calServings - 1)"
            >
              −
            </button>
            <input
              id="cal-servings"
              v-model.number="calServings"
              type="number"
              min="1"
              max="100"
              class="cal-serv-input"
            />
            <button
              type="button"
              class="cal-serv-btn"
              :disabled="calServings >= 100"
              @click="calServings = Math.min(100, calServings + 1)"
            >
              +
            </button>
          </div>
        </div>

        <p v-if="calError" class="cal-error" role="alert">{{ calError }}</p>
      </div>
    </Transition>

    <template #footer>
      <BaseButton
        v-if="!calSuccess"
        variant="primary"
        block
        :loading="calLoading"
        :disabled="!calDate"
        @click="submit"
      >
        Hozzáadás
      </BaseButton>
      <BaseButton v-else variant="outline" block @click="close"> Bezárás </BaseButton>
    </template>
  </BaseModal>
</template>

<style scoped>
.cal-form-body {
  display: flex;
  flex-direction: column;
  gap: 1.125rem;
}

.cal-recipe-name {
  font-size: 0.9375rem;
  font-weight: 700;
  color: var(--color-text);
  padding: 0.5rem 0.75rem;
  background: var(--color-surface);
  border-radius: 0.625rem;
  border: 1px solid var(--color-stroke);
}

.cal-field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.cal-label {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--color-muted);
}

.cal-date-input {
  width: 100%;
  padding: 0.6rem 0.875rem;
  border-radius: 0.75rem;
  border: 1.5px solid var(--color-stroke);
  background: var(--color-bg);
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-text);
  outline: none;
  cursor: pointer;
  transition:
    border-color 160ms ease,
    box-shadow 160ms ease;
}

.cal-date-input:focus {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-accent) 15%, transparent);
}

.cal-meal-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
}

.cal-meal-pill {
  padding: 0.3rem 0.75rem;
  border-radius: 999px;
  border: 1.5px solid var(--color-stroke);
  background: transparent;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-muted);
  cursor: pointer;
  transition:
    background 150ms ease,
    border-color 150ms ease,
    color 150ms ease,
    transform 150ms var(--ease-ui-out);
}

.cal-meal-pill.active {
  background: var(--color-accent);
  border-color: var(--color-accent);
  color: var(--color-bg);
}

.cal-meal-pill:active {
  transform: scale(0.93);
}

.cal-servings {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--color-bg);
  border: 1.5px solid var(--color-stroke);
  border-radius: 0.75rem;
  padding: 0.25rem;
  width: max-content;
}

.cal-serv-btn {
  width: 2rem;
  height: 2rem;
  border-radius: 0.5rem;
  border: none;
  background: var(--color-surface);
  color: var(--color-text);
  font-size: 1.1rem;
  font-weight: 700;
  cursor: pointer;
  transition:
    background 150ms ease,
    transform 150ms var(--ease-ui-out);
}

.cal-serv-btn:hover:not(:disabled) {
  background: var(--color-surface-hover);
}
.cal-serv-btn:active:not(:disabled) {
  transform: scale(0.92);
}
.cal-serv-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.cal-serv-input {
  width: 3rem;
  text-align: center;
  border: none;
  background: transparent;
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--color-text);
  outline: none;
  -moz-appearance: textfield;
}
.cal-serv-input::-webkit-outer-spin-button,
.cal-serv-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.cal-error {
  font-size: 0.8125rem;
  color: var(--color-danger);
  padding: 0.5rem 0.75rem;
  background: color-mix(in srgb, var(--color-danger) 8%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-danger) 22%, transparent);
  border-radius: 0.5rem;
}

.cal-success-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 0 0.5rem;
  text-align: center;
}

.cal-success-icon {
  width: 3rem;
  height: 3rem;
  border-radius: 999px;
  background: color-mix(in srgb, var(--color-chip) 15%, transparent);
  border: 2px solid var(--color-chip);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-chip);
  animation: successPop 380ms var(--ease-ui-out) both;
}

@keyframes successPop {
  from {
    transform: scale(0.6);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.cal-success-icon svg {
  width: 1.375rem;
  height: 1.375rem;
}

.cal-success-title {
  font-size: 1.125rem;
  font-weight: 800;
  color: var(--color-text);
  margin: 0;
}

.cal-success-sub {
  font-size: 0.875rem;
  color: var(--color-muted);
  margin: 0;
}

.cal-success-link {
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--color-accent);
  text-decoration: underline;
  text-decoration-color: color-mix(in srgb, var(--color-accent) 40%, transparent);
  text-underline-offset: 3px;
  transition: color 150ms;
}

.cal-success-link:hover {
  color: var(--color-accent-hover);
}

.cal-success-enter-active,
.cal-success-leave-active {
  transition:
    opacity 200ms var(--ease-ui-out),
    transform 200ms var(--ease-ui-out);
}

.cal-success-enter-from {
  opacity: 0;
  transform: scale(0.97) translateY(6px);
}

.cal-success-leave-to {
  opacity: 0;
  transform: scale(0.97) translateY(-6px);
}
</style>
