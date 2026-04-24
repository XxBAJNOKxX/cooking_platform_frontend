import { ref, computed, onUnmounted } from 'vue'
import api from '@/services/api'
import { useApiCall } from '@/composables/useApiCall'

function toDateStr(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function getMondayOf(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  const day = d.getDay()
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day))
  return d
}

/**
 * Étkezési terv CRUD + optimistic drag-and-drop áthelyezés.
 */
export function useMealPlans() {
  const mealPlans = ref([])
  const transientError = ref(null)

  const fetchCall = useApiCall({
    defaultError: 'Nem sikerült betölteni az étkezési tervet.',
    logTag: 'useMealPlans:fetch',
  })
  const deleteCall = useApiCall({ logTag: 'useMealPlans:delete' })
  const addCall = useApiCall({ logTag: 'useMealPlans:add' })

  async function fetchMealPlans() {
    await fetchCall.execute(async () => {
      const res = await api.get('/meal-plans', { params: { per_page: 100 } })
      mealPlans.value = res.data.data ?? []
      return res.data.data
    })
  }

  async function deleteMealPlan(id) {
    const ok = await deleteCall.execute(async () => {
      await api.delete(`/meal-plans/${id}`)
      mealPlans.value = mealPlans.value.filter((p) => p.id !== id)
      return true
    })
    return ok === true
  }

  async function moveMealPlan({ id, date, meal_type }) {
    const idx = mealPlans.value.findIndex((p) => p.id === id)
    if (idx === -1) return
    const current = mealPlans.value[idx]
    if (current.planned_date === date && current.meal_type === meal_type) return

    const snapshot = { ...current }
    mealPlans.value[idx] = { ...current, planned_date: date, meal_type }

    try {
      await api.put(`/meal-plans/${id}`, { planned_date: date, meal_type })
    } catch {
      mealPlans.value[idx] = snapshot
      transientError.value = 'Nem sikerült áthelyezni. Próbáld újra!'
      setTimeout(() => {
        transientError.value = null
      }, 3000)
    }
  }

  async function addMealPlan(payload) {
    const res = await addCall.execute(() => api.post('/meal-plans', payload), { rethrow: false })
    if (res) {
      mealPlans.value.push(res.data.data)
      return true
    }
    return false
  }

  const mealsByDate = computed(() => {
    const map = {}
    for (const plan of mealPlans.value) {
      if (!map[plan.planned_date]) map[plan.planned_date] = []
      map[plan.planned_date].push(plan)
    }
    return map
  })

  return {
    mealPlans,
    mealsByDate,
    loading: fetchCall.loading,
    fetchError: computed(() => fetchCall.error.value || transientError.value),
    deleteLoading: deleteCall.loading,
    deleteError: deleteCall.error,
    addLoading: addCall.loading,
    addError: addCall.error,
    fetchMealPlans,
    deleteMealPlan,
    moveMealPlan,
    addMealPlan,
  }
}

/**
 * Recept autocomplete a naptár „Étkezés hozzáadása” modalhoz (debounce-olt).
 */
export function useRecipeSearch() {
  const recipes = ref([])
  const { loading, execute } = useApiCall({ logTag: 'useRecipeSearch' })
  let debounceTimer = null

  async function loadRecipes(search = '') {
    await execute(async () => {
      const res = await api.get('/recipes', { params: { search, per_page: 30 } })
      recipes.value = res.data.data ?? []
      return res.data.data
    })
  }

  function scheduleLoad(search, delayMs = 300) {
    clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => loadRecipes(search), delayMs)
  }

  onUnmounted(() => clearTimeout(debounceTimer))

  return { recipes, recipesLoading: loading, loadRecipes, scheduleLoad }
}

export function formatDateStr(d) {
  return toDateStr(d)
}
