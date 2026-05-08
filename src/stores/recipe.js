import { defineStore } from 'pinia'
import api from '@/services/api'

/**
 * Recept-metaadat store — kategóriák és napi recept gyorstárazása.
 * Csökkenti a felesleges API-hívások számát navigáció során.
 */
export const useRecipeStore = defineStore('recipe', {
  state: () => ({
    categories: [],
    categoriesLoading: false,
    dailyRecipe: null,
    dailyRecipeLoading: false,
  }),

  actions: {
    /**
     * Kategóriák lekérése, ha még nincsenek betöltve.
     * Tartalmaz egy egyszeri újrapróbálkozást cold-start hiba (üres lista) esetén.
     */
    async fetchCategories({ force = false, retry = true } = {}) {
      if (this.categories.length > 0 && !force) return
      this.categoriesLoading = true
      try {
        const { data } = await api.get('/categories')
        const list = data.data ?? []

        if (list.length === 0 && retry) {
          this.categoriesLoading = false
          await new Promise((r) => setTimeout(r, 400))
          return this.fetchCategories({ force, retry: false })
        }

        this.categories = list
      } catch (err) {
        if (import.meta.env.DEV) console.warn('[fetchCategories]', err)
        if (retry) {
          this.categoriesLoading = false
          await new Promise((r) => setTimeout(r, 600))
          return this.fetchCategories({ force, retry: false })
        }
      } finally {
        this.categoriesLoading = false
      }
    },

    /**
     * Napi recept lekérése, ha még nincs betöltve.
     */
    async fetchDailyRecipe(force = false) {
      if (this.dailyRecipe && !force) return
      this.dailyRecipeLoading = true
      try {
        const { data } = await api.get('/recipes/daily')
        this.dailyRecipe = data.data ?? null
      } catch (err) {
        if (import.meta.env.DEV) console.error('[fetchDailyRecipe]', err)
      } finally {
        this.dailyRecipeLoading = false
      }
    },
  },
})
