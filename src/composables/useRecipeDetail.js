import { ref, computed } from 'vue'
import api from '@/services/api'
import { useApiCall } from '@/composables/useApiCall'
import { useAuthStore } from '@/stores/auth'

/**
 * Recept-részletező állapota: fetch, kedvenc toggle, törlés, review hozzáadás.
 */
export function useRecipeDetail(recipeIdRef) {
  const authStore = useAuthStore()

  const recipe = ref(null)
  const favorited = ref(false)
  const favLoading = ref(false)

  const fetchCall = useApiCall({ logTag: 'useRecipeDetail:fetch' })
  const deleteCall = useApiCall({ logTag: 'useRecipeDetail:delete' })

  const isOwner = computed(
    () => authStore.isAuthenticated && authStore.user?.id === recipe.value?.author?.id,
  )

  const averageRating = computed(() => {
    const rs = recipe.value?.reviews
    if (!rs?.length) return 0
    return rs.reduce((s, r) => s + r.rating, 0) / rs.length
  })

  const hasReviewed = computed(
    () =>
      authStore.isAuthenticated &&
      recipe.value?.reviews?.some((r) => r.user?.id === authStore.user?.id),
  )

  async function fetchRecipe() {
    const id = recipeIdRef.value
    if (!id) return
    await fetchCall.execute(async () => {
      const { data } = await api.get(`/recipes/${id}`)
      recipe.value = data.data
      favorited.value = Boolean(data.data.is_favorited)
      return data.data
    })
  }

  async function toggleFavorite() {
    if (!authStore.isAuthenticated || favLoading.value || !recipe.value) return
    favLoading.value = true
    const prev = favorited.value
    favorited.value = !prev
    try {
      const { data } = await api.post(`/favorites/${recipe.value.id}/toggle`)
      favorited.value = Boolean(data.favorited)
    } catch {
      favorited.value = prev
    } finally {
      favLoading.value = false
    }
  }

  async function deleteRecipe() {
    if (!recipe.value) return false
    const result = await deleteCall.execute(() => api.delete(`/recipes/${recipe.value.id}`), {
      rethrow: false,
    })
    return result !== null
  }

  function addReview(review) {
    if (recipe.value?.reviews) {
      recipe.value.reviews.unshift(review)
    }
  }

  async function updateReview(id, payload) {
    const { data } = await api.put(`/reviews/${id}`, payload)
    const list = recipe.value?.reviews
    if (list) {
      const idx = list.findIndex((r) => r.id === id)
      if (idx !== -1) list[idx] = data.data
    }
    return data.data
  }

  async function deleteReview(id) {
    await api.delete(`/reviews/${id}`)
    const list = recipe.value?.reviews
    if (list) {
      const idx = list.findIndex((r) => r.id === id)
      if (idx !== -1) list.splice(idx, 1)
    }
  }

  return {
    recipe,
    loading: fetchCall.loading,
    error: computed(() => {
      if (!fetchCall.error.value) return ''
      return fetchCall.error.value
    }),
    favorited,
    favLoading,
    isOwner,
    averageRating,
    hasReviewed,
    fetchRecipe,
    toggleFavorite,
    deleteRecipe,
    deleting: deleteCall.loading,
    deleteError: deleteCall.error,
    addReview,
    updateReview,
    deleteReview,
  }
}
