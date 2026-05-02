<!-- Receptkönyv kártya a saját könyvek listájához. -->

<script setup>
import { computed, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'

const props = defineProps({
  book: { type: Object, required: true },
})

const FALLBACK =
  import.meta.env.VITE_RECIPES_FALLBACK_IMAGE_URL ??
  'https://images.unsplash.com/photo-1495195134817-aeb325a55b65?auto=format&fit=crop&w=800&q=60'

const imgSrc = ref(props.book.cover_image_url || FALLBACK)
watch(
  () => props.book.cover_image_url,
  (v) => {
    imgSrc.value = v || FALLBACK
  },
)
function onImgError() {
  if (imgSrc.value !== FALLBACK) imgSrc.value = FALLBACK
}

const lastUpdated = computed(() => {
  if (!props.book.updated_at) return ''
  const d = new Date(props.book.updated_at.replace(' ', 'T'))
  return d.toLocaleDateString('hu-HU', { year: 'numeric', month: 'long', day: 'numeric' })
})
</script>

<template>
  <RouterLink :to="{ name: 'recipe-book-detail', params: { id: book.id } }" class="rb-card">
    <div class="rb-card-cover">
      <img :src="imgSrc" :alt="book.title" @error="onImgError" />
      <div class="rb-card-spine" aria-hidden="true"></div>
      <div class="rb-card-overlay" aria-hidden="true"></div>
    </div>
    <div class="rb-card-body">
      <h3 class="rb-card-title">{{ book.title }}</h3>
      <p v-if="book.subtitle" class="rb-card-subtitle">{{ book.subtitle }}</p>
      <div class="rb-card-meta">
        <span class="rb-card-chip">{{ book.items_count ?? 0 }} recept</span>
        <span v-if="lastUpdated" class="rb-card-date">{{ lastUpdated }}</span>
      </div>
    </div>
  </RouterLink>
</template>

<style scoped>
.rb-card {
  display: flex;
  flex-direction: column;
  border-radius: 18px;
  border: 1.5px solid var(--color-stroke);
  background: var(--color-bg);
  overflow: hidden;
  text-decoration: none;
  transition:
    transform 220ms var(--ease-ui-out),
    box-shadow 220ms var(--ease-ui-out),
    border-color 220ms ease;
}

@media (hover: hover) and (pointer: fine) {
  .rb-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 18px 40px -14px rgba(47, 30, 23, 0.2);
    border-color: var(--color-accent-soft);
  }
}

.rb-card:active {
  transform: scale(0.985);
}

.rb-card-cover {
  position: relative;
  aspect-ratio: 4 / 3;
  background: var(--color-surface);
  overflow: hidden;
}

.rb-card-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 480ms var(--ease-ui-out);
}

.rb-card:hover .rb-card-cover img {
  transform: scale(1.04);
}

.rb-card-spine {
  position: absolute;
  inset-block: 0;
  left: 0;
  width: 7px;
  background: linear-gradient(90deg, rgba(0, 0, 0, 0.36) 0%, transparent 100%);
}

.rb-card-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(47, 30, 23, 0.42) 0%, transparent 55%);
  pointer-events: none;
}

.rb-card-body {
  padding: 0.85rem 1rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.rb-card-title {
  font-size: 1rem;
  font-weight: 800;
  color: var(--color-text);
  letter-spacing: -0.01em;
  margin: 0;
  line-height: 1.25;
}

.rb-card-subtitle {
  font-size: 0.8rem;
  color: var(--color-muted);
  margin: 0;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.rb-card-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-top: 0.4rem;
}

.rb-card-chip {
  display: inline-flex;
  align-items: center;
  padding: 0.2rem 0.55rem;
  border-radius: 999px;
  background: color-mix(in srgb, var(--color-accent) 14%, transparent);
  color: var(--color-accent);
  font-size: 0.72rem;
  font-weight: 800;
}

.rb-card-date {
  font-size: 0.7rem;
  color: var(--color-muted);
}
</style>
