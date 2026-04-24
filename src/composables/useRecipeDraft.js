import { ref, watch, onBeforeUnmount } from 'vue'

const DRAFT_DEBOUNCE_MS = 600

/**
 * Recept-szerkesztő piszkozat-automata mentése localStorage-be (debounce-olt),
 * visszaállítás / elvetés művelettel.
 */
export function useRecipeDraft(formRef, keyRef, isEmptyFn) {
  const draftAvailable = ref(false)
  const draftSnapshot = ref(null)
  const active = ref(false)

  let draftTimer = null
  let stopWatcher = null

  function saveDraftNow() {
    if (!active.value) return
    if (isEmptyFn(formRef.value)) {
      localStorage.removeItem(keyRef.value)
      return
    }
    try {
      localStorage.setItem(
        keyRef.value,
        JSON.stringify({
          savedAt: Date.now(),
          form: JSON.parse(JSON.stringify(formRef.value)),
        }),
      )
    } catch {
      // storage full / disabled — silent
    }
  }

  function scheduleDraftSave() {
    clearTimeout(draftTimer)
    draftTimer = setTimeout(saveDraftNow, DRAFT_DEBOUNCE_MS)
  }

  function activate() {
    if (stopWatcher) return
    active.value = true
    stopWatcher = watch(formRef, scheduleDraftSave, { deep: true })
  }

  function loadSnapshot() {
    try {
      const raw = localStorage.getItem(keyRef.value)
      if (!raw) return null
      const parsed = JSON.parse(raw)
      return parsed?.form ? parsed : null
    } catch {
      return null
    }
  }

  function offerRestoreIfExists() {
    const snap = loadSnapshot()
    if (snap && !isEmptyFn(snap.form)) {
      draftSnapshot.value = snap
      draftAvailable.value = true
    }
  }

  function restore() {
    if (!draftSnapshot.value?.form) return
    formRef.value = { ...formRef.value, ...draftSnapshot.value.form }
    draftAvailable.value = false
  }

  function discard() {
    localStorage.removeItem(keyRef.value)
    draftSnapshot.value = null
    draftAvailable.value = false
  }

  function clear() {
    clearTimeout(draftTimer)
    localStorage.removeItem(keyRef.value)
    draftSnapshot.value = null
  }

  function hasUnsavedChanges() {
    if (isEmptyFn(formRef.value)) return false
    return !!localStorage.getItem(keyRef.value)
  }

  onBeforeUnmount(() => {
    clearTimeout(draftTimer)
    if (stopWatcher) stopWatcher()
  })

  return {
    draftAvailable,
    draftSnapshot,
    activate,
    offerRestoreIfExists,
    restore,
    discard,
    clear,
    hasUnsavedChanges,
  }
}
