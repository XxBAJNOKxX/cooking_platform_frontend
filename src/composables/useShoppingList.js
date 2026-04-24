import { ref, computed, watch } from 'vue'
import api from '@/services/api'
import { useApiCall } from '@/composables/useApiCall'

function toDateStr(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function getMondayOf(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  const day = d.getDay()
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day))
  return d
}

export function currentWeekRange() {
  const monday = getMondayOf(new Date())
  const sunday = new Date(monday)
  sunday.setDate(sunday.getDate() + 6)
  return { start: toDateStr(monday), end: toDateStr(sunday) }
}

export function itemKey(item) {
  return `${item.id}:${item.unit ?? ''}`
}

export function recipeIngKey(recipeId, ing) {
  return `r${recipeId}:${ing.id}:${ing.unit ?? ''}`
}

/**
 * Bevásárlólista állapota: fetch dátum-tartományra + kipipált tételek localStorage-ben.
 */
export function useShoppingList() {
  const dateRange = ref(currentWeekRange())
  const aggregated = ref([])
  const byRecipe = ref([])
  const hasLoaded = ref(false)
  const checkedIds = ref(new Set())

  const { loading, error, execute } = useApiCall({
    defaultError: 'Nem sikerült betölteni a bevásárlólistát.',
    logTag: 'useShoppingList',
  })

  function storageKey() {
    return `sl_checked_${dateRange.value.start}_${dateRange.value.end}`
  }

  function saveChecked() {
    localStorage.setItem(storageKey(), JSON.stringify([...checkedIds.value]))
  }

  function loadChecked() {
    try {
      const raw = localStorage.getItem(storageKey())
      return raw ? new Set(JSON.parse(raw)) : new Set()
    } catch {
      return new Set()
    }
  }

  async function fetchList() {
    if (!dateRange.value.start || !dateRange.value.end) return
    await execute(async () => {
      const res = await api.get('/shopping-list', {
        params: { start_date: dateRange.value.start, end_date: dateRange.value.end },
      })
      aggregated.value = res.data?.aggregated ?? []
      byRecipe.value = res.data?.by_recipe ?? []
      checkedIds.value = loadChecked()
      hasLoaded.value = true
      return res.data
    })
  }

  watch(dateRange, fetchList, { immediate: true })

  function toggle(id) {
    const next = new Set(checkedIds.value)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    checkedIds.value = next
    saveChecked()
  }

  function resetAll() {
    checkedIds.value = new Set()
    saveChecked()
  }

  const checkedCount = computed(() => {
    let n = 0
    for (const it of aggregated.value) {
      if (checkedIds.value.has(itemKey(it))) n++
    }
    return n
  })
  const totalCount = computed(() => aggregated.value.length)

  const progress = computed(() =>
    totalCount.value === 0 ? 0 : (checkedCount.value / totalCount.value) * 100,
  )

  const sortedAggregated = computed(() => {
    const unchecked = aggregated.value.filter((i) => !checkedIds.value.has(itemKey(i)))
    const checked = aggregated.value.filter((i) => checkedIds.value.has(itemKey(i)))
    return [...unchecked, ...checked]
  })

  const hasAnyItems = computed(() => aggregated.value.length > 0 || byRecipe.value.length > 0)

  const rangeLabel = computed(() => {
    const { start, end } = dateRange.value
    if (!start || !end) return ''
    const s = new Date(`${start}T12:00:00`).toLocaleDateString('hu-HU', {
      month: 'short',
      day: 'numeric',
    })
    const e = new Date(`${end}T12:00:00`).toLocaleDateString('hu-HU', {
      month: 'short',
      day: 'numeric',
    })
    return `${s} – ${e}`
  })

  return {
    dateRange,
    aggregated,
    byRecipe,
    loading,
    error,
    hasLoaded,
    checkedIds,
    fetchList,
    toggle,
    resetAll,
    checkedCount,
    totalCount,
    progress,
    sortedAggregated,
    hasAnyItems,
    rangeLabel,
  }
}
