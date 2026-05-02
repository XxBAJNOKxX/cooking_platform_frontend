import { ref } from 'vue'
import api from '@/services/api'
import { useApiCall } from '@/composables/useApiCall'

/**
 * Receptkönyv-tételek kezelése — recept hozzáadás, eltávolítás, sorrend mentése.
 * A `RecipeBookEditorView` használja a tétel-listához.
 */
export function useRecipeBookEditor(bookId) {
  const items = ref([])

  const addItemCall = useApiCall({ logTag: 'useRecipeBookEditor:add' })
  const removeItemCall = useApiCall({ logTag: 'useRecipeBookEditor:remove' })
  const reorderCall = useApiCall({ logTag: 'useRecipeBookEditor:reorder' })

  async function addRecipe(recipeId, note = null) {
    return addItemCall.execute(async () => {
      const res = await api.post(`/recipe-books/${bookId.value ?? bookId}/items`, {
        recipe_id: recipeId,
        note,
      })
      const newItem = res.data.data
      items.value = [...items.value, newItem]
      return newItem
    }, { rethrow: true })
  }

  async function removeItem(itemId) {
    const ok = await removeItemCall.execute(async () => {
      await api.delete(`/recipe-books/${bookId.value ?? bookId}/items/${itemId}`)
      items.value = items.value.filter((i) => i.id !== itemId)
      return true
    })
    return ok === true
  }

  async function saveOrder(orderedItems) {
    const positions = orderedItems.map((item, index) => ({
      id: item.id,
      position: index,
    }))
    return reorderCall.execute(async () => {
      const res = await api.put(`/recipe-books/${bookId.value ?? bookId}/reorder`, {
        positions,
      })
      items.value = res.data.data ?? items.value
      return res.data.data
    })
  }

  function setItems(initial) {
    items.value = Array.isArray(initial) ? [...initial] : []
  }

  return {
    items,
    setItems,
    addRecipe,
    removeItem,
    saveOrder,
    addLoading: addItemCall.loading,
    addError: addItemCall.error,
    removeLoading: removeItemCall.loading,
    removeError: removeItemCall.error,
    reorderLoading: reorderCall.loading,
    reorderError: reorderCall.error,
  }
}
