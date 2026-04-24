<!-- Eszköz kártya a piactéren (kép, név, ár, város, tulajdonos). -->

<script setup>
import { computed } from 'vue'

const props = defineProps({
  tool: { type: Object, required: true },
  index: { type: Number, default: 0 },
})

const FALLBACK =
  'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=800&q=60'

const locationLabel = computed(() => {
  const t = props.tool
  const parts = [t.city, t.county].filter(Boolean)
  return parts.join(', ')
})

const priceLabel = computed(() => {
  const p = Number(props.tool.price_per_day ?? 0)
  return p.toLocaleString('hu-HU', { maximumFractionDigits: 0 }) + ' Ft/nap'
})
</script>

<template>
  <RouterLink
    :to="{ name: 'tool-detail', params: { id: tool.id } }"
    class="tcard"
    :style="{ '--delay': `${Math.min(index, 8) * 40}ms` }"
    :aria-label="tool.name"
  >
    <div class="tcard-img-wrap">
      <img
        :src="tool.image_url || FALLBACK"
        :alt="tool.name"
        class="tcard-img"
        loading="lazy"
        decoding="async"
      />
      <span v-if="!tool.is_available" class="tcard-badge tcard-badge-rented"
        >Jelenleg bérbe adva</span
      >
      <span v-else class="tcard-badge tcard-badge-free">Elérhető</span>
    </div>

    <div class="tcard-body">
      <h3 class="tcard-title">{{ tool.name }}</h3>

      <div class="tcard-loc" v-if="locationLabel">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          aria-hidden="true"
        >
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
        <span>{{ locationLabel }}</span>
      </div>

      <div class="tcard-foot">
        <span class="tcard-price">{{ priceLabel }}</span>
        <span v-if="tool.owner" class="tcard-owner">{{ tool.owner.username }}</span>
      </div>
    </div>
  </RouterLink>
</template>

<style scoped>
.tcard {
  display: flex;
  flex-direction: column;
  border-radius: 18px;
  border: 1.5px solid var(--color-stroke);
  background: var(--color-bg);
  overflow: hidden;
  text-decoration: none;
  color: var(--color-text);
  animation: tcardIn 280ms var(--ease-ui-out) var(--delay, 0ms) both;
  transition:
    transform 220ms var(--ease-ui-out),
    box-shadow 220ms var(--ease-ui-out),
    border-color 220ms var(--ease-ui-out);
}

@keyframes tcardIn {
  from {
    opacity: 0;
    transform: translateY(10px) scale(0.97);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

@media (hover: hover) and (pointer: fine) {
  .tcard:hover {
    transform: translateY(-3px);
    box-shadow: 0 18px 40px -14px rgba(47, 30, 23, 0.2);
    border-color: var(--color-accent-soft);
  }
  .tcard:hover .tcard-img {
    transform: scale(1.05);
  }
}
.tcard:active {
  transform: scale(0.985);
}

.tcard-img-wrap {
  position: relative;
  aspect-ratio: 3 / 2;
  overflow: hidden;
  background: var(--color-surface);
  flex-shrink: 0;
}
.tcard-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 480ms var(--ease-ui-out);
}

.tcard-badge {
  position: absolute;
  top: 0.625rem;
  left: 0.625rem;
  padding: 0.2rem 0.55rem;
  border-radius: 999px;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  backdrop-filter: blur(6px);
}
.tcard-badge-free {
  background: color-mix(in srgb, #5b7f43 85%, transparent);
  color: #fff;
}
.tcard-badge-rented {
  background: color-mix(in srgb, #2f1e17 80%, transparent);
  color: #fff;
}

.tcard-body {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.875rem 0.95rem 0.95rem;
  flex: 1;
}

.tcard-title {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 800;
  line-height: 1.3;
  letter-spacing: -0.01em;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.tcard-loc {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.78rem;
  color: var(--color-muted);
}
.tcard-loc svg {
  width: 0.85rem;
  height: 0.85rem;
  flex-shrink: 0;
  color: var(--color-accent);
}

.tcard-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: auto;
  gap: 0.5rem;
}

.tcard-price {
  font-size: 0.85rem;
  font-weight: 800;
  color: var(--color-accent);
  background: color-mix(in srgb, var(--color-accent) 10%, transparent);
  padding: 0.25rem 0.55rem;
  border-radius: 0.45rem;
}

.tcard-owner {
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--color-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 8rem;
}
</style>
