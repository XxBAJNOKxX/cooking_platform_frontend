<!-- Bejelentkezett user gyors akciói a homepage-en — naptár, lista, receptkönyv, új recept. -->

<script setup>
import { RouterLink } from 'vue-router'

const actions = [
  {
    to: '/calendar',
    icon: 'calendar',
    title: 'Heti menüm',
    description: 'Étkezések tervezése',
    accent: 'cal',
  },
  {
    to: '/shopping-list',
    icon: 'cart',
    title: 'Bevásárlólistám',
    description: 'Az étrendből összeállítva',
    accent: 'list',
  },
  {
    to: '/recipe-books',
    icon: 'book',
    title: 'Receptkönyveim',
    description: 'Saját nyomtatható könyvek',
    accent: 'book',
  },
  {
    to: '/recipes/create',
    icon: 'plus',
    title: 'Új recept',
    description: 'Megosztás a közösséggel',
    accent: 'recipe',
  },
]
</script>

<template>
  <section class="quick-actions">
    <div class="quick-actions-inner">
      <h2 class="quick-actions-title">Gyors akciók</h2>
      <ul class="quick-actions-grid">
        <li v-for="action in actions" :key="action.to">
          <RouterLink :to="action.to" class="qa-card" :class="`qa-card--${action.accent}`">
            <span class="qa-icon">
              <svg v-if="action.icon === 'calendar'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <svg v-else-if="action.icon === 'cart'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <svg v-else-if="action.icon === 'book'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <svg v-else-if="action.icon === 'plus'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4" />
              </svg>
            </span>
            <span class="qa-text">
              <span class="qa-title">{{ action.title }}</span>
              <span class="qa-description">{{ action.description }}</span>
            </span>
            <svg class="qa-chevron" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7" />
            </svg>
          </RouterLink>
        </li>
      </ul>
    </div>
  </section>
</template>

<style scoped>
.quick-actions {
  padding: 1.5rem 1rem 0.5rem;
}

.quick-actions-inner {
  max-width: 80rem;
  margin: 0 auto;
}

.quick-actions-title {
  font-size: 1.05rem;
  font-weight: 800;
  letter-spacing: -0.01em;
  color: var(--color-text);
  margin-bottom: 0.85rem;
  padding: 0 0.25rem;
}

.quick-actions-grid {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  grid-auto-rows: 1fr;
  gap: 0.6rem;
}

.quick-actions-grid > li {
  display: flex;
}

.qa-card {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 0.7rem;
  padding: 0.85rem;
  border-radius: 1rem;
  border: 1px solid color-mix(in srgb, var(--color-stroke) 70%, transparent);
  background: var(--color-surface);
  color: var(--color-text);
  text-decoration: none;
  width: 100%;
  transition:
    transform 200ms var(--ease-ui-out),
    background 200ms ease,
    border-color 200ms ease;
}

.qa-card:hover {
  transform: translateY(-2px);
  background: color-mix(in srgb, var(--color-surface) 75%, var(--color-bg));
  border-color: var(--color-accent);
}

.qa-icon {
  width: 2.4rem;
  height: 2.4rem;
  border-radius: 0.7rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in srgb, var(--color-accent) 14%, transparent);
  color: var(--color-accent);
}

.qa-icon svg {
  width: 1.3rem;
  height: 1.3rem;
}

.qa-card--cal .qa-icon {
  background: color-mix(in srgb, #4a90e2 16%, transparent);
  color: #2c6db5;
}

.qa-card--list .qa-icon {
  background: color-mix(in srgb, var(--color-chip) 18%, transparent);
  color: var(--color-chip);
}

.qa-card--book .qa-icon {
  background: color-mix(in srgb, #b18352 18%, transparent);
  color: #8a5f30;
}

.qa-text {
  display: flex;
  flex-direction: column;
  gap: 0.05rem;
  min-width: 0;
}

.qa-title {
  font-size: 0.92rem;
  font-weight: 800;
  letter-spacing: -0.005em;
}

.qa-description {
  font-size: 0.72rem;
  color: var(--color-muted);
}

.qa-chevron {
  width: 0.95rem;
  height: 0.95rem;
  color: var(--color-muted);
  flex-shrink: 0;
}

@media (min-width: 768px) {
  .quick-actions {
    padding: 2rem 1.5rem 0.5rem;
  }

  .quick-actions-title {
    font-size: 1.2rem;
    margin-bottom: 1rem;
  }

  .quick-actions-grid {
    gap: 1rem;
  }

  .qa-card {
    padding: 1.1rem;
    border-radius: 1.25rem;
  }

  .qa-icon {
    width: 2.8rem;
    height: 2.8rem;
  }

  .qa-icon svg {
    width: 1.5rem;
    height: 1.5rem;
  }

  .qa-title {
    font-size: 1rem;
  }
}

@media (min-width: 1024px) {
  .quick-actions-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}
</style>
