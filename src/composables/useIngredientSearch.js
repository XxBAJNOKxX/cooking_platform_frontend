import { ref, computed, onBeforeUnmount } from 'vue'
import api from '@/services/api'

const DEBOUNCE_MS = 250

/**
 * Hozzávaló autocomplete + új hozzávaló létrehozás (debounce-olt keresés).
 */
export function useIngredientSearch(usedItemsRef) {
  const query = ref('')
  const results = ref([])
  const searching = ref(false)
  const dropdown = ref(false)
  const creating = ref(false)

  let timer = null

  function onInput(value) {
    query.value = value
    clearTimeout(timer)
    if (!query.value.trim()) {
      results.value = []
      dropdown.value = false
      return
    }
    timer = setTimeout(async () => {
      searching.value = true
      try {
        const { data } = await api.get('/ingredients', { params: { search: query.value } })
        const used = new Set(usedItemsRef.value.map((i) => i.id))
        results.value = data.data.filter((i) => !used.has(i.id))
        dropdown.value = true
      } finally {
        searching.value = false
      }
    }, DEBOUNCE_MS)
  }

  const queryExists = computed(() => {
    const q = query.value.trim().toLowerCase()
    if (!q) return false
    return results.value.some((i) => i.name.trim().toLowerCase() === q)
  })

  function reset() {
    query.value = ''
    results.value = []
    dropdown.value = false
  }

  async function createFromQuery() {
    const name = query.value.trim()
    if (!name || creating.value) return null
    creating.value = true
    try {
      const { data } = await api.post('/ingredients', { name })
      return data.data
    } finally {
      creating.value = false
    }
  }

  onBeforeUnmount(() => clearTimeout(timer))

  return {
    query,
    results,
    searching,
    dropdown,
    creating,
    queryExists,
    onInput,
    reset,
    createFromQuery,
  }
}
