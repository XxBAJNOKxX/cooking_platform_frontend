import { ref } from 'vue'
import api from '@/services/api'
import { useApiCall } from '@/composables/useApiCall'

/**
 * Receptkönyvek lista + CRUD műveletek a saját könyvekre.
 * A `RecipeBookEditorView` és `RecipeBookListView` is ezen keresztül kommunikál a backenddel.
 */
export function useRecipeBooks() {
  const books = ref([])
  const book = ref(null)

  const fetchAllCall = useApiCall({
    defaultError: 'Nem sikerült betölteni a receptkönyveket.',
    logTag: 'useRecipeBooks:list',
  })
  const fetchOneCall = useApiCall({
    defaultError: 'Nem sikerült betölteni a receptkönyvet.',
    logTag: 'useRecipeBooks:show',
  })
  const createCall = useApiCall({ logTag: 'useRecipeBooks:create' })
  const updateCall = useApiCall({ logTag: 'useRecipeBooks:update' })
  const removeCall = useApiCall({ logTag: 'useRecipeBooks:delete' })

  async function fetchAll(perPage = 20) {
    await fetchAllCall.execute(async () => {
      const res = await api.get('/recipe-books', { params: { per_page: perPage } })
      books.value = res.data.data ?? []
      return res.data.data
    })
  }

  async function fetch(id) {
    await fetchOneCall.execute(async () => {
      const res = await api.get(`/recipe-books/${id}`)
      book.value = res.data.data ?? null
      return res.data.data
    })
  }

  async function create(payload) {
    return createCall.execute(async () => {
      const res = await api.post('/recipe-books', payload)
      return res.data.data
    })
  }

  async function update(id, payload) {
    return updateCall.execute(async () => {
      const res = await api.put(`/recipe-books/${id}`, payload)
      if (book.value?.id === id) book.value = res.data.data
      return res.data.data
    })
  }

  async function remove(id) {
    return removeCall.execute(async () => {
      await api.delete(`/recipe-books/${id}`)
      books.value = books.value.filter((b) => b.id !== id)
      return true
    })
  }

  return {
    books,
    book,
    listLoading: fetchAllCall.loading,
    listError: fetchAllCall.error,
    detailLoading: fetchOneCall.loading,
    detailError: fetchOneCall.error,
    createLoading: createCall.loading,
    createError: createCall.error,
    updateLoading: updateCall.loading,
    updateError: updateCall.error,
    removeLoading: removeCall.loading,
    removeError: removeCall.error,
    fetchAll,
    fetch,
    create,
    update,
    remove,
  }
}
