import { ref, computed } from 'vue'

/**
 * Hozzávaló-csoportok kezelése a recept-szerkesztőben (létrehozás, átnevezés, törlés).
 */
export function useIngredientGroups(itemsRef, updateFn) {
  const activeGroup = ref('')
  const newGroupName = ref('')
  const showGroupInput = ref(false)

  const groups = computed(() => {
    const seen = new Map()
    for (const i of itemsRef.value) {
      const key = (i.group ?? '').toString()
      if (!seen.has(key)) seen.set(key, [])
      seen.get(key).push(i)
    }
    const out = []
    if (seen.has('')) out.push({ name: '', items: seen.get('') })
    for (const [name, items] of seen) if (name !== '') out.push({ name, items })
    return out
  })

  const hasGroups = computed(() => itemsRef.value.some((i) => i.group && i.group.trim() !== ''))

  const displayedGroups = computed(() => {
    const g = [...groups.value]
    if (activeGroup.value && !g.some((x) => x.name === activeGroup.value)) {
      g.push({ name: activeGroup.value, items: [] })
    }
    return g
  })

  const groupNames = computed(() =>
    displayedGroups.value.map((g) => g.name).filter((n) => n !== ''),
  )

  function openGroupInput() {
    showGroupInput.value = true
    newGroupName.value = ''
  }

  function commitNewGroup() {
    const name = newGroupName.value.trim()
    if (!name) {
      showGroupInput.value = false
      return
    }
    activeGroup.value = name
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
    const next = itemsRef.value.map((i) =>
      (i.group ?? '') === oldName ? { ...i, group: trimmed } : i,
    )
    if (activeGroup.value === oldName) activeGroup.value = trimmed
    updateFn(next)
  }

  function removeGroup(name) {
    const next = itemsRef.value.map((i) => ((i.group ?? '') === name ? { ...i, group: '' } : i))
    if (activeGroup.value === name) activeGroup.value = ''
    updateFn(next)
  }

  return {
    activeGroup,
    newGroupName,
    showGroupInput,
    groups,
    hasGroups,
    displayedGroups,
    groupNames,
    openGroupInput,
    commitNewGroup,
    cancelNewGroup,
    renameGroup,
    removeGroup,
  }
}
