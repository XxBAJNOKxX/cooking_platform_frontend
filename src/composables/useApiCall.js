import { ref, shallowRef } from 'vue'

function extractMessage(err, fallback) {
  if (!err) return fallback
  if (err.response?.data?.message) return err.response.data.message
  if (err.message) return err.message
  return fallback
}

/**
 * Általános API-hívás wrapper loading + error state-tel.
 * Minden composable/view ezen keresztül hív — kiváltja a try/catch/finally boilerplate-et.
 */
export function useApiCall(options = {}) {
  const { defaultError = 'Hiba történt.', logTag = null } = options

  const loading = ref(false)
  const error = ref(null)
  const data = shallowRef(null)

  async function execute(fn, { onSuccess, onError, rethrow = false } = {}) {
    loading.value = true
    error.value = null
    try {
      const result = await fn()
      data.value = result
      if (onSuccess) onSuccess(result)
      return result
    } catch (err) {
      const msg = extractMessage(err, defaultError)
      error.value = msg
      if (logTag && import.meta.env.DEV) {
        console.error(`[${logTag}]`, err)
      }
      if (onError) onError(err)
      if (rethrow) throw err
      return null
    } finally {
      loading.value = false
    }
  }

  function reset() {
    loading.value = false
    error.value = null
    data.value = null
  }

  return { loading, error, data, execute, reset }
}
