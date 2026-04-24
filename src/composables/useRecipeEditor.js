import { ref, computed } from 'vue'
import api from '@/services/api'
import { useApiCall } from '@/composables/useApiCall'

function emptyForm() {
  return {
    title: '',
    description: '',
    steps: '',
    prep_time: '',
    servings: '',
    difficulty: '',
    image_url: '',
    category_ids: [],
    ingredients: [],
  }
}

export function formIsEmpty(f) {
  return (
    !f.title.trim() &&
    !f.description.trim() &&
    !f.steps.trim() &&
    !f.prep_time &&
    !f.servings &&
    !f.difficulty &&
    !f.image_url &&
    f.category_ids.length === 0 &&
    f.ingredients.length === 0
  )
}

export function validateForm(form) {
  const errs = {}
  if (!form.title.trim()) errs.title = ['A recept neve kötelező.']
  if (!form.description.trim()) errs.description = ['A leírás kötelező.']
  if (!form.steps.trim()) errs.steps = ['Az elkészítés lépései kötelezők.']
  if (!form.prep_time || Number(form.prep_time) < 1) {
    errs.prep_time = ['Az elkészítési idő kötelező (min. 1 perc).']
  }
  if (!form.difficulty) errs.difficulty = ['A nehézségi szint kötelező.']
  return errs
}

export function buildPayload(form) {
  return {
    title: form.title,
    description: form.description,
    steps: form.steps,
    prep_time: Number(form.prep_time),
    servings: form.servings ? Number(form.servings) : null,
    difficulty: form.difficulty,
    image_url: form.image_url || null,
    category_ids: form.category_ids,
    ingredients: form.ingredients.map((i) => ({
      id: i.id,
      quantity: i.quantity == null || String(i.quantity).trim() === '' ? null : Number(i.quantity),
      unit: i.unit,
      group: (i.group ?? '').trim() || null,
    })),
  }
}

/**
 * Recept szerkesztő form állapota: fetch (edit módban), validate, submit (POST/PUT).
 */
export function useRecipeEditor(recipeIdRef, authStore) {
  const form = ref(emptyForm())
  const errors = ref({})
  const serverError = ref('')
  const notAuthorized = ref(false)
  const saving = ref(false)

  const fetchCall = useApiCall({ logTag: 'useRecipeEditor:fetch' })
  const pageLoading = fetchCall.loading

  const isEdit = computed(() => !!recipeIdRef.value)

  async function fetchRecipe() {
    await fetchCall.execute(async () => {
      const { data } = await api.get(`/recipes/${recipeIdRef.value}`)
      const r = data.data

      if (!authStore.user) await authStore.fetchUser()

      if (authStore.user?.id !== r.author?.id && !authStore.isAdmin) {
        notAuthorized.value = true
        return null
      }

      form.value = {
        title: r.title ?? '',
        description: r.description ?? '',
        steps: r.steps ?? '',
        prep_time: r.prep_time ?? '',
        servings: r.servings ?? '',
        difficulty: r.difficulty ?? '',
        image_url: r.image_url ?? '',
        category_ids: (r.categories ?? []).map((c) => c.id),
        ingredients: (r.ingredients ?? []).map((i) => ({
          id: i.id,
          name: i.name,
          quantity: i.quantity ?? '',
          unit: i.unit ?? '',
          group: i.group ?? '',
        })),
      }
      return r
    })

    if (fetchCall.error.value) {
      serverError.value = 'Nem sikerült betölteni a receptet.'
    }
  }

  async function save() {
    errors.value = {}
    serverError.value = ''

    const clientErrors = validateForm(form.value)
    if (Object.keys(clientErrors).length > 0) {
      errors.value = clientErrors
      return { ok: false, reason: 'validation' }
    }

    saving.value = true
    const payload = buildPayload(form.value)

    try {
      const res = isEdit.value
        ? await api.put(`/recipes/${recipeIdRef.value}`, payload)
        : await api.post('/recipes', payload)
      return { ok: true, recipe: res.data.data }
    } catch (err) {
      if (err.response?.status === 422) {
        errors.value = err.response.data.errors ?? {}
        return { ok: false, reason: 'validation' }
      }
      serverError.value = 'Valami hiba történt. Kérjük, próbáld újra.'
      return { ok: false, reason: 'server' }
    } finally {
      saving.value = false
    }
  }

  return {
    form,
    errors,
    serverError,
    notAuthorized,
    saving,
    pageLoading,
    isEdit,
    fetchRecipe,
    save,
  }
}
