<!-- Receptkönyv részletező — előnézet + nyomtatható, könyv-szerű layout (borító, TOC, page-break, lábléc). -->

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'

import BaseButton from '@/components/BaseButton.vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import DeleteConfirmModal from '@/components/recipe/DeleteConfirmModal.vue'
import { useRecipeBooks } from '@/composables/useRecipeBooks'
import { useAuthStore } from '@/stores/auth'
import { usePageRule } from '@/composables/usePageRule'

usePageRule(`
  @page {
    size: A4 portrait;
    margin: 16mm 14mm 20mm 14mm;
    @bottom-right {
      content: counter(page);
      font-family: Georgia, 'Times New Roman', serif;
      font-size: 10pt;
      color: #555;
    }
    @bottom-left {
      content: "";
      font-family: Georgia, 'Times New Roman', serif;
      font-size: 9pt;
      color: #888;
    }
  }
  @page :first {
    margin: 0;
    @bottom-right { content: ""; }
    @bottom-left { content: ""; }
  }
`)

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const bookId = computed(() => Number(route.params.id))

const { book, detailLoading, detailError, removeLoading, removeError, fetch, remove } =
  useRecipeBooks()

const showDeleteModal = ref(false)

onMounted(async () => {
  await fetch(bookId.value)
})

const isOwner = computed(
  () => authStore.user && book.value && book.value.owner?.id === authStore.user.id,
)

function printBook() {
  window.print()
}

async function confirmDelete() {
  const ok = await remove(bookId.value)
  if (ok) {
    showDeleteModal.value = false
    router.push({ name: 'recipe-books' })
  }
}

function formatPrepTime(min) {
  if (!min) return ''
  return `${min} perc`
}

function getRecipeAnchor(item) {
  return `recipe-${item.id}`
}

function formatQty(q) {
  if (q === null || q === undefined || q === '') return ''
  const n = Number(q)
  if (Number.isNaN(n)) return String(q)
  return Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/\.?0+$/, '')
}

function ingredientLabel(ing) {
  const qty = ing.quantity ?? ing.pivot?.quantity
  const unit = ing.unit ?? ing.pivot?.unit
  const parts = []
  const qtyStr = formatQty(qty)
  if (qtyStr) parts.push(qtyStr)
  if (unit) parts.push(unit)
  parts.push(ing.name)
  return parts.join(' ')
}

function groupIngredients(ingredients) {
  if (!ingredients || ingredients.length === 0) return []
  const groups = new Map()
  for (const ing of ingredients) {
    const key = ing.group ?? ing.pivot?.group_name ?? ing.group_name ?? ''
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(ing)
  }
  return Array.from(groups.entries()).map(([name, items]) => ({ name, items }))
}

function recipeStepLines(steps) {
  if (!steps) return []
  return steps
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
}

const formattedDate = computed(() => {
  if (!book.value?.created_at) return ''
  const d = new Date(book.value.created_at.replace(' ', 'T'))
  return d.toLocaleDateString('hu-HU', { year: 'numeric', month: 'long' })
})
</script>

<template>
  <div class="rb-detail">
    <div v-if="detailLoading" class="state-center">
      <LoadingSpinner />
    </div>

    <div v-else-if="detailError" class="state-center">
      <p class="error-text">{{ detailError }}</p>
    </div>

    <template v-else-if="book">
      <!-- Screen-mode header (no-print) -->
      <div class="rb-detail-header no-print">
        <button class="back-link" type="button" @click="router.push({ name: 'recipe-books' })">
          <svg fill="none" stroke="currentColor" stroke-width="2.4" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Vissza
        </button>
        <h1 class="rb-detail-title">{{ book.title }}</h1>
        <div class="rb-detail-actions">
          <button type="button" class="action-btn action-btn-print" @click="printBook">
            <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <polyline points="6,9 6,2 18,2 18,9" />
              <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" />
              <rect x="6" y="14" width="12" height="8" />
            </svg>
            Nyomtatás / PDF
          </button>
          <RouterLink
            v-if="isOwner"
            :to="{ name: 'recipe-book-edit', params: { id: book.id } }"
            class="action-btn"
          >
            <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke-linecap="round" />
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke-linecap="round" />
            </svg>
            Szerkesztés
          </RouterLink>
          <button
            v-if="isOwner"
            type="button"
            class="action-btn action-btn-danger"
            @click="showDeleteModal = true"
          >
            <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <polyline points="3,6 5,6 21,6" />
              <path d="M19,6l-1,14H6L5,6" />
              <path d="M10 11v6M14 11v6M9 6V4h6v2" stroke-linecap="round" />
            </svg>
            Törlés
          </button>
        </div>
      </div>

      <!-- Screen preview header (no-print) — kompakt info a könyvről  -->
      <div class="rb-detail-summary no-print">
        <p v-if="book.subtitle" class="rb-detail-subtitle">{{ book.subtitle }}</p>
        <p class="rb-detail-meta">
          <span>{{ book.items_count ?? book.items?.length ?? 0 }} recept</span>
          <span v-if="book.owner?.username">· szerző: {{ book.owner.username }}</span>
          <span v-if="formattedDate">· {{ formattedDate }}</span>
        </p>
        <p v-if="book.description" class="rb-detail-description">{{ book.description }}</p>

        <p v-if="!book.items || book.items.length === 0" class="rb-detail-empty">
          A könyv jelenleg üres. Nyiss meg a szerkesztőt és adj hozzá recepteket.
        </p>
      </div>

      <!-- Print + screen rendered: a teljes könyv tartalma. Screen-en előnézetszerűen
           formázódik, print módban A4 oldalakra törve, könyv-szerű layouttal. -->
      <div class="rb-print-content">
        <!-- Borítóoldal -->
        <section class="rb-cover">
          <div
            class="rb-cover-image"
            :style="book.cover_image_url
              ? { backgroundImage: `url(${book.cover_image_url})` }
              : null"
          >
            <div class="rb-cover-overlay"></div>
          </div>
          <div class="rb-cover-text">
            <p class="rb-cover-eyebrow">Saját szakácskönyv</p>
            <h1 class="rb-cover-title">{{ book.title }}</h1>
            <p v-if="book.subtitle" class="rb-cover-subtitle">{{ book.subtitle }}</p>
            <p v-if="book.description" class="rb-cover-description">{{ book.description }}</p>
            <p class="rb-cover-author">
              <span v-if="book.owner?.username">{{ book.owner.username }}</span>
              <span v-if="formattedDate"> · {{ formattedDate }}</span>
            </p>
          </div>
        </section>

        <!-- Tartalomjegyzék -->
        <section v-if="book.items && book.items.length > 0" class="rb-toc">
          <h2 class="rb-toc-title">Tartalomjegyzék</h2>
          <ol class="rb-toc-list">
            <li v-for="(item, index) in book.items" :key="item.id" class="rb-toc-row">
              <span class="rb-toc-num">{{ index + 1 }}.</span>
              <a :href="`#${getRecipeAnchor(item)}`" class="rb-toc-entry">
                <span class="rb-toc-recipe">{{ item.recipe?.title }}</span>
                <span class="rb-toc-leader" aria-hidden="true"></span>
                <span class="rb-toc-page" :data-href="`#${getRecipeAnchor(item)}`"></span>
              </a>
            </li>
          </ol>
        </section>

        <!-- Recept szekciók -->
        <section
          v-for="(item, index) in book.items"
          :key="`r-${item.id}`"
          :id="getRecipeAnchor(item)"
          class="rb-recipe"
        >
          <header class="rb-recipe-header">
            <p class="rb-recipe-num">{{ index + 1 }}</p>
            <div>
              <h2 class="rb-recipe-title">{{ item.recipe?.title }}</h2>
              <p class="rb-recipe-meta">
                <span v-if="item.recipe?.prep_time">{{ formatPrepTime(item.recipe.prep_time) }}</span>
                <span v-if="item.recipe?.servings">· {{ item.recipe.servings }} adag</span>
                <span v-if="item.recipe?.difficulty">· {{ item.recipe.difficulty }}</span>
                <span v-if="item.recipe?.author?.username">· {{ item.recipe.author.username }}</span>
              </p>
            </div>
          </header>

          <img
            v-if="item.recipe?.image_url"
            :src="item.recipe.image_url"
            :alt="item.recipe.title"
            class="rb-recipe-image"
          />

          <p v-if="item.recipe?.description" class="rb-recipe-description">
            {{ item.recipe.description }}
          </p>

          <div class="rb-recipe-body">
            <div class="rb-recipe-ingredients">
              <h3 class="rb-recipe-section-title">Hozzávalók</h3>
              <div
                v-for="(group, gi) in groupIngredients(item.recipe?.ingredients)"
                :key="`g-${gi}`"
                class="rb-recipe-ingredient-group"
              >
                <p v-if="group.name" class="rb-recipe-ingredient-group-name">{{ group.name }}</p>
                <ul class="rb-recipe-ingredient-list">
                  <li v-for="ing in group.items" :key="ing.id">
                    {{ ingredientLabel(ing) }}
                  </li>
                </ul>
              </div>
            </div>

            <div class="rb-recipe-steps">
              <h3 class="rb-recipe-section-title">Elkészítés</h3>
              <ol class="rb-recipe-step-list">
                <li v-for="(line, idx) in recipeStepLines(item.recipe?.steps)" :key="idx">
                  {{ line }}
                </li>
              </ol>
            </div>
          </div>

          <p v-if="item.note" class="rb-recipe-note">{{ item.note }}</p>
        </section>
      </div>
    </template>

    <DeleteConfirmModal
      v-model="showDeleteModal"
      title="Receptkönyv törlése"
      :item-name="book?.title ?? ''"
      body-prefix="Biztosan törölni szeretnéd a"
      body-suffix="receptkönyvet? Ez a művelet nem vonható vissza."
      :deleting="removeLoading"
      :error-message="removeError || ''"
      @confirm="confirmDelete"
    />
  </div>
</template>

<style scoped>
.rb-detail {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.rb-detail-header {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  flex-wrap: wrap;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.4rem 0.7rem;
  border-radius: 0.55rem;
  border: 1.5px solid var(--color-stroke);
  background: transparent;
  color: var(--color-muted);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 160ms ease, color 160ms ease;
}

.back-link:hover {
  background: var(--color-surface);
  color: var(--color-text);
}

.back-link svg {
  width: 0.95rem;
  height: 0.95rem;
}

.rb-detail-title {
  flex: 1;
  font-size: 1.4rem;
  font-weight: 800;
  margin: 0;
  letter-spacing: -0.02em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.rb-detail-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 0.95rem;
  border-radius: 0.6rem;
  border: 1.5px solid var(--color-stroke);
  background: var(--color-surface);
  color: var(--color-text);
  font-weight: 700;
  font-size: 0.82rem;
  text-decoration: none;
  cursor: pointer;
  transition:
    background 160ms ease,
    border-color 160ms ease,
    transform 160ms var(--ease-ui-out);
}

.action-btn:hover {
  background: var(--color-surface-hover);
  border-color: var(--color-muted);
}

.action-btn:active {
  transform: scale(0.96);
}

.action-btn svg {
  width: 0.95rem;
  height: 0.95rem;
}

.action-btn-print {
  border-color: var(--color-accent);
  background: color-mix(in srgb, var(--color-accent) 12%, transparent);
  color: var(--color-accent);
}

.action-btn-print:hover {
  background: color-mix(in srgb, var(--color-accent) 22%, transparent);
}

.action-btn-danger {
  border-color: color-mix(in srgb, var(--color-danger) 50%, transparent);
  background: color-mix(in srgb, var(--color-danger) 8%, transparent);
  color: var(--color-danger);
}

.action-btn-danger:hover {
  background: color-mix(in srgb, var(--color-danger) 16%, transparent);
}

.rb-detail-summary {
  background: var(--color-surface);
  border: 1px solid var(--color-stroke);
  border-radius: 1rem;
  padding: 0.85rem 1rem;
}

.rb-detail-subtitle {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--color-text);
  margin: 0 0 0.25rem;
}

.rb-detail-meta {
  font-size: 0.78rem;
  color: var(--color-muted);
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin: 0 0 0.5rem;
}

.rb-detail-description {
  font-size: 0.9rem;
  color: var(--color-muted);
  margin: 0;
  line-height: 1.55;
}

.rb-detail-empty {
  margin: 0.85rem 0 0;
  padding: 0.85rem;
  border: 1.5px dashed var(--color-stroke);
  border-radius: 0.7rem;
  text-align: center;
  color: var(--color-muted);
  font-size: 0.9rem;
}

.error-text {
  color: var(--color-danger);
}

.state-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 3rem 0;
  color: var(--color-muted);
}

/* ─── Print content (book-style) — screen módban előnézet, print módban A4-en formázott. ─── */

.rb-print-content {
  background: white;
  color: #2f1e17;
  border-radius: 1rem;
  border: 1px solid var(--color-stroke);
  overflow: hidden;
}

/* Borító */
.rb-cover {
  position: relative;
  min-height: 28rem;
  display: flex;
  align-items: flex-end;
  color: white;
  padding: 2.5rem 2rem;
  background: linear-gradient(135deg, #2f1e17 0%, #5a3322 100%);
  overflow: hidden;
}

.rb-cover-image {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
}

.rb-cover-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.65) 0%, rgba(0, 0, 0, 0.95) 100%);
}

.rb-cover-text {
  position: relative;
  z-index: 1;
  max-width: 36rem;
  background: rgba(20, 12, 8, 0.85);
  padding: 1.6rem 1.85rem;
  border-radius: 0.85rem;
  border: 1px solid rgba(255, 255, 255, 0.18);
  color: #ffffff;
}

.rb-cover-text * {
  color: inherit;
}

.rb-cover-eyebrow {
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.25em;
  text-transform: uppercase;
  color: #ffc88a !important;
  margin: 0 0 0.6rem;
}

.rb-cover-title {
  font-size: clamp(2rem, 5vw, 3.4rem);
  line-height: 1.05;
  font-weight: 900;
  margin: 0 0 0.85rem;
  letter-spacing: -0.02em;
  font-family: Georgia, 'Times New Roman', serif;
  color: #ffffff !important;
}

.rb-cover-subtitle {
  font-size: 1.15rem;
  font-weight: 700;
  margin: 0 0 1rem;
  color: #ffffff !important;
  font-style: italic;
}

.rb-cover-description {
  font-size: 0.98rem;
  line-height: 1.6;
  margin: 0 0 1.25rem;
  color: #ffffff !important;
  max-width: 32rem;
}

.rb-cover-author {
  font-size: 0.92rem;
  color: #ffc88a !important;
  font-weight: 600;
  margin: 0;
  letter-spacing: 0.05em;
}

/* TOC */
.rb-toc {
  padding: 2rem 2rem 1.5rem;
}

.rb-toc-title {
  font-size: 1.4rem;
  font-weight: 800;
  font-family: Georgia, 'Times New Roman', serif;
  margin: 0 0 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid var(--color-text);
  color: var(--color-text);
  letter-spacing: -0.01em;
}

.rb-toc-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.rb-toc-row {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  font-size: 0.95rem;
}

.rb-toc-num {
  font-weight: 700;
  color: var(--color-accent);
  min-width: 1.6rem;
}

.rb-toc-entry {
  flex: 1;
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  text-decoration: none;
  color: var(--color-text);
}

.rb-toc-recipe {
  font-weight: 600;
}

.rb-toc-leader {
  flex: 1;
  border-bottom: 1px dotted var(--color-muted);
  height: 0.4rem;
}

.rb-toc-page {
  font-variant-numeric: tabular-nums;
  font-weight: 600;
  color: var(--color-muted);
  min-width: 1.5rem;
  text-align: right;
}

/* Recept szekció */
.rb-recipe {
  padding: 1.85rem 2rem 2rem;
  border-top: 1px solid var(--color-stroke);
}

.rb-recipe-header {
  display: flex;
  align-items: flex-start;
  gap: 0.85rem;
  margin-bottom: 0.85rem;
}

.rb-recipe-num {
  flex-shrink: 0;
  width: 2.4rem;
  height: 2.4rem;
  border-radius: 999px;
  background: var(--color-accent);
  color: white;
  font-weight: 800;
  font-size: 1.1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0;
  font-family: Georgia, 'Times New Roman', serif;
}

.rb-recipe-title {
  font-size: 1.5rem;
  font-weight: 800;
  font-family: Georgia, 'Times New Roman', serif;
  margin: 0;
  line-height: 1.2;
  letter-spacing: -0.01em;
  color: var(--color-text);
}

.rb-recipe-meta {
  font-size: 0.82rem;
  color: var(--color-muted);
  margin: 0.2rem 0 0;
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
}

.rb-recipe-image {
  display: block;
  width: 100%;
  max-height: 22rem;
  object-fit: cover;
  border-radius: 0.7rem;
  margin: 0 0 1rem;
  border: 1px solid var(--color-stroke);
}

.rb-recipe-description {
  font-size: 0.92rem;
  line-height: 1.55;
  color: var(--color-muted);
  font-style: italic;
  margin: 0 0 1rem;
}

.rb-recipe-body {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.6fr);
  gap: 1.5rem;
}

@media (max-width: 720px) {
  .rb-recipe-body {
    grid-template-columns: 1fr;
  }
}

.rb-recipe-section-title {
  font-size: 0.95rem;
  font-weight: 800;
  margin: 0 0 0.5rem;
  letter-spacing: -0.01em;
  color: var(--color-text);
  border-bottom: 1.5px solid var(--color-stroke);
  padding-bottom: 0.3rem;
}

.rb-recipe-ingredient-group {
  margin-bottom: 0.5rem;
}

.rb-recipe-ingredient-group-name {
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--color-accent);
  margin: 0 0 0.2rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.rb-recipe-ingredient-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.rb-recipe-ingredient-list li {
  font-size: 0.88rem;
  padding: 0.2rem 0;
  border-bottom: 1px dotted color-mix(in srgb, var(--color-stroke) 70%, transparent);
}

.rb-recipe-step-list {
  list-style: decimal;
  padding-left: 1.4rem;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}

.rb-recipe-step-list li {
  font-size: 0.92rem;
  line-height: 1.55;
}

.rb-recipe-note {
  margin-top: 1rem;
  padding: 0.65rem 0.85rem;
  background: color-mix(in srgb, var(--color-accent) 8%, transparent);
  border-left: 3px solid var(--color-accent);
  border-radius: 0.4rem;
  font-size: 0.88rem;
  color: var(--color-text);
  font-style: italic;
}

/* ────── PRINT ────── */
@media print {
  .rb-detail {
    display: block !important;
    padding: 0 !important;
    margin: 0 !important;
  }

  .rb-print-content {
    background: white !important;
    color: black !important;
    border-radius: 0 !important;
    border: none !important;
  }

  .rb-cover {
    height: 297mm;
    min-height: 297mm;
    width: 100%;
    page-break-after: always;
    padding: 30mm 25mm;
    box-sizing: border-box;
  }

  .rb-toc {
    page-break-after: always;
    padding: 0;
  }

  .rb-toc-page::before {
    content: target-counter(attr(data-href), page);
  }

  .rb-recipe {
    page-break-before: always;
    padding: 0;
    border-top: none;
  }

  .rb-recipe-image {
    max-height: 60mm !important;
    width: 100% !important;
    border-radius: 4pt !important;
    page-break-inside: avoid;
    break-inside: avoid;
    page-break-before: avoid !important;
    break-before: avoid !important;
  }

  .rb-recipe-num {
    background: black !important;
    color: white !important;
  }

  .rb-recipe-ingredient-group-name {
    color: black !important;
  }

  .rb-recipe-note {
    background: #f5f5f5 !important;
    border-left-color: black !important;
    color: black !important;
  }
}
</style>

<style>
@media print {
  /* Globális: el kell rejteni az App-ön kívüli díszítést is. */
  #app > div > header {
    display: none !important;
  }
  body {
    background: white !important;
  }
}
</style>
