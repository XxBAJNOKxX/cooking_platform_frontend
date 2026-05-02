<!-- Saját receptkönyvek listája — kártyás grid + új könyv gomb. -->

<script setup>
import { onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import BaseButton from '@/components/BaseButton.vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import RecipeBookCard from '@/components/recipebook/RecipeBookCard.vue'
import { useRecipeBooks } from '@/composables/useRecipeBooks'

const { books, listLoading, listError, fetchAll } = useRecipeBooks()

onMounted(fetchAll)
</script>

<template>
  <div class="rb-list-page">
    <div class="rb-list-header">
      <div>
        <h1 class="rb-list-title">Receptkönyveim</h1>
        <p class="rb-list-subtitle">Saját, nyomtatható szakácskönyveid a kedvenc receptjeidből</p>
      </div>
      <RouterLink :to="{ name: 'recipe-book-create' }" tabindex="-1">
        <BaseButton variant="primary" rounded="full">
          + Új receptkönyv
        </BaseButton>
      </RouterLink>
    </div>

    <div v-if="listLoading" class="state-center">
      <LoadingSpinner />
    </div>

    <div v-else-if="listError" class="state-center">
      <p class="error-text">{{ listError }}</p>
      <BaseButton variant="outline" size="sm" @click="fetchAll">Újra</BaseButton>
    </div>

    <div v-else-if="!books.length" class="empty">
      <div class="empty-emoji">📔</div>
      <h2 class="empty-title">Még nincs receptkönyved</h2>
      <p class="empty-text">
        Hozz létre egy nyomtatható receptkönyvet kedvenc receptjeidből — borítóoldallal,
        tartalomjegyzékkel és oldalszámokkal együtt.
      </p>
      <RouterLink :to="{ name: 'recipe-book-create' }" tabindex="-1">
        <BaseButton variant="primary" rounded="full">Első könyv létrehozása</BaseButton>
      </RouterLink>
    </div>

    <div v-else class="rb-list-grid">
      <RecipeBookCard v-for="book in books" :key="book.id" :book="book" />
    </div>
  </div>
</template>

<style scoped>
.rb-list-page {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.rb-list-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.rb-list-title {
  font-size: 1.7rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  margin: 0;
  color: var(--color-text);
}

.rb-list-subtitle {
  font-size: 0.9rem;
  color: var(--color-muted);
  margin: 0.25rem 0 0;
}

.rb-list-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(15rem, 1fr));
  gap: 1.1rem;
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

.error-text {
  color: var(--color-danger);
}

.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.85rem;
  padding: 4rem 1rem;
  text-align: center;
}

.empty-emoji {
  font-size: 3rem;
}

.empty-title {
  font-size: 1.2rem;
  font-weight: 800;
  margin: 0;
  color: var(--color-text);
}

.empty-text {
  max-width: 28rem;
  color: var(--color-muted);
  margin: 0 0 0.5rem;
  font-size: 0.92rem;
  line-height: 1.55;
}

@media (max-width: 640px) {
  .rb-list-title {
    font-size: 1.4rem;
  }
}
</style>
