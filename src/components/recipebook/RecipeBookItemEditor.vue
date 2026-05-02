<!-- Drag-able item-sor a receptkönyv editorban — drag-handle, kép, cím, szerző, törlés. -->

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  item: { type: Object, required: true },
})

const emit = defineEmits(['remove'])

const FALLBACK =
  import.meta.env.VITE_RECIPES_FALLBACK_IMAGE_URL ??
  'https://images.unsplash.com/photo-1495195134817-aeb325a55b65?auto=format&fit=crop&w=400&q=60'

const imgSrc = ref(props.item.recipe?.image_url || FALLBACK)
watch(
  () => props.item.recipe?.image_url,
  (v) => {
    imgSrc.value = v || FALLBACK
  },
)
function onImgError() {
  if (imgSrc.value !== FALLBACK) imgSrc.value = FALLBACK
}
</script>

<template>
  <div class="rbi">
    <button type="button" class="rbi-handle" aria-label="Húzd a sorrendezéshez">
      <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <line x1="8" y1="6" x2="16" y2="6" stroke-linecap="round" />
        <line x1="8" y1="12" x2="16" y2="12" stroke-linecap="round" />
        <line x1="8" y1="18" x2="16" y2="18" stroke-linecap="round" />
      </svg>
    </button>

    <div class="rbi-thumb">
      <img :src="imgSrc" :alt="item.recipe?.title" @error="onImgError" />
    </div>

    <div class="rbi-text">
      <p class="rbi-title">{{ item.recipe?.title }}</p>
      <p v-if="item.recipe?.servings" class="rbi-meta">{{ item.recipe.servings }} adag</p>
    </div>

    <button
      type="button"
      class="rbi-remove"
      aria-label="Recept eltávolítása"
      @click="emit('remove', item)"
    >
      <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  </div>
</template>

<style scoped>
.rbi {
  display: grid;
  grid-template-columns: auto auto 1fr auto;
  align-items: center;
  gap: 0.7rem;
  padding: 0.6rem 0.75rem;
  background: var(--color-bg);
  border: 1.5px solid var(--color-stroke);
  border-radius: 0.95rem;
  transition:
    border-color 180ms ease,
    box-shadow 180ms ease;
}

.rbi:hover {
  border-color: var(--color-accent-soft);
}

.rbi-handle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.7rem;
  height: 1.7rem;
  border: none;
  background: transparent;
  color: var(--color-muted);
  cursor: grab;
  border-radius: 0.5rem;
  flex-shrink: 0;
  transition: color 160ms ease, background 160ms ease;
}

.rbi-handle:hover {
  color: var(--color-text);
  background: var(--color-surface);
}

.rbi-handle:active {
  cursor: grabbing;
}

.rbi-handle svg {
  width: 1.05rem;
  height: 1.05rem;
}

.rbi-thumb {
  width: 3.2rem;
  height: 3.2rem;
  border-radius: 0.6rem;
  overflow: hidden;
  background: var(--color-surface);
  flex-shrink: 0;
}

.rbi-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.rbi-text {
  min-width: 0;
}

.rbi-title {
  font-size: 0.92rem;
  font-weight: 700;
  color: var(--color-text);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.rbi-meta {
  font-size: 0.72rem;
  color: var(--color-muted);
  margin: 0;
}

.rbi-remove {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border: none;
  border-radius: 0.5rem;
  background: transparent;
  color: var(--color-muted);
  cursor: pointer;
  flex-shrink: 0;
  transition:
    color 160ms ease,
    background 160ms ease,
    transform 160ms var(--ease-ui-out);
}

.rbi-remove:hover {
  color: var(--color-danger);
  background: color-mix(in srgb, var(--color-danger) 10%, transparent);
}

.rbi-remove:active {
  transform: scale(0.94);
}

.rbi-remove svg {
  width: 0.95rem;
  height: 0.95rem;
}
</style>
