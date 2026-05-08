<!-- Bottom-sheet akciómenü a FAB+ gombhoz — 4 gyors akció. -->

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

defineProps({
  open: { type: Boolean, default: false },
})
const emit = defineEmits(['update:open'])

const router = useRouter()
const authStore = useAuthStore()

const close = () => emit('update:open', false)

const actions = computed(() => [
  {
    icon: 'recipe',
    label: 'Új recept',
    description: 'Saját recept feltöltése a közösségnek',
    handler: () => router.push('/recipes/create'),
    requiresVerified: true,
  },
  {
    icon: 'book',
    label: 'Új receptkönyv',
    description: 'Receptek gyűjtése egy nyomtatható könyvbe',
    handler: () => router.push('/recipe-books/create'),
    requiresVerified: true,
  },
  {
    icon: 'calendar',
    label: 'Recept naptárba',
    description: 'Tervezett étkezés hozzáadása a heti étrendhez',
    handler: () => router.push({ path: '/calendar', query: { openAdd: '1' } }),
    requiresVerified: true,
  },
  {
    icon: 'tool',
    label: 'Új eszköz',
    description: 'Konyhai eszköz megosztása bérbeadásra',
    handler: () => router.push('/tools/create'),
    requiresVerified: true,
  },
])

const onActionClick = (action) => {
  close()
  if (action.requiresVerified && !authStore.isVerified) {
    router.push('/verify-otp')
    return
  }
  action.handler()
}
</script>

<template>
  <Teleport to="body">
    <Transition name="fab-menu">
      <div v-if="open" class="fab-menu-overlay md:hidden no-print" @click.self="close">
        <div class="fab-menu-sheet" role="dialog" aria-label="Gyors akciók">
          <div class="fab-menu-handle" aria-hidden="true"></div>
          <h3 class="fab-menu-title">Mit szeretnél létrehozni?</h3>

          <ul class="fab-menu-list">
            <li v-for="action in actions" :key="action.label">
              <button type="button" class="fab-menu-item" @click="onActionClick(action)">
                <span class="fab-menu-item-icon" :class="`fab-menu-item-icon--${action.icon}`">
                  <svg v-if="action.icon === 'recipe'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <svg v-else-if="action.icon === 'book'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  <svg v-else-if="action.icon === 'calendar'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <svg v-else-if="action.icon === 'tool'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </span>
                <span class="fab-menu-item-text">
                  <span class="fab-menu-item-label">{{ action.label }}</span>
                  <span class="fab-menu-item-description">{{ action.description }}</span>
                </span>
                <svg class="fab-menu-item-chevron" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </li>
          </ul>

          <button type="button" class="fab-menu-close" @click="close">Mégsem</button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fab-menu-overlay {
  position: fixed;
  inset: 0;
  z-index: 60;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.fab-menu-sheet {
  width: 100%;
  background: var(--color-bg);
  border-top-left-radius: 1.5rem;
  border-top-right-radius: 1.5rem;
  padding: 1rem 1rem calc(1.25rem + env(safe-area-inset-bottom, 0));
  box-shadow: 0 -10px 32px -10px rgba(0, 0, 0, 0.35);
  transform-origin: bottom center;
}

.fab-menu-handle {
  width: 44px;
  height: 4px;
  background: color-mix(in srgb, var(--color-stroke) 70%, transparent);
  border-radius: 999px;
  margin: 0 auto 0.85rem;
}

.fab-menu-title {
  font-size: 1.05rem;
  font-weight: 800;
  color: var(--color-text);
  text-align: center;
  margin-bottom: 0.65rem;
}

.fab-menu-list {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  list-style: none;
  padding: 0;
  margin: 0;
}

.fab-menu-item {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  width: 100%;
  padding: 0.75rem 0.85rem;
  border: 1px solid color-mix(in srgb, var(--color-stroke) 60%, transparent);
  border-radius: 1rem;
  background: var(--color-surface);
  color: var(--color-text);
  text-align: left;
  cursor: pointer;
  transition:
    background-color 180ms var(--ease-ui-out),
    transform 160ms var(--ease-ui-out);
}

.fab-menu-item:hover {
  background: color-mix(in srgb, var(--color-surface) 75%, var(--color-bg));
}

.fab-menu-item:active {
  transform: scale(0.985);
}

.fab-menu-item-icon {
  width: 42px;
  height: 42px;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in srgb, var(--color-accent) 14%, transparent);
  color: var(--color-accent);
  flex-shrink: 0;
}

.fab-menu-item-icon svg {
  width: 1.4rem;
  height: 1.4rem;
}

.fab-menu-item-icon--book {
  background: color-mix(in srgb, var(--color-chip) 18%, transparent);
  color: var(--color-chip);
}

.fab-menu-item-icon--calendar {
  background: color-mix(in srgb, #4a90e2 16%, transparent);
  color: #2c6db5;
}

.fab-menu-item-icon--tool {
  background: color-mix(in srgb, #b18352 18%, transparent);
  color: #8a5f30;
}

.fab-menu-item-text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.fab-menu-item-label {
  font-weight: 700;
  font-size: 0.98rem;
}

.fab-menu-item-description {
  font-size: 0.78rem;
  color: var(--color-muted);
  line-height: 1.25;
}

.fab-menu-item-chevron {
  width: 1rem;
  height: 1rem;
  color: var(--color-muted);
  flex-shrink: 0;
}

.fab-menu-close {
  width: 100%;
  margin-top: 0.85rem;
  padding: 0.78rem;
  border-radius: 0.95rem;
  border: 1px solid color-mix(in srgb, var(--color-stroke) 70%, transparent);
  background: transparent;
  color: var(--color-muted);
  font-weight: 700;
  cursor: pointer;
  transition: background-color 180ms ease;
}

.fab-menu-close:hover {
  background: color-mix(in srgb, var(--color-surface) 70%, transparent);
}

.fab-menu-enter-active,
.fab-menu-leave-active {
  transition: opacity 220ms var(--ease-ui-out);
}

.fab-menu-enter-active .fab-menu-sheet,
.fab-menu-leave-active .fab-menu-sheet {
  transition: transform 280ms var(--ease-drawer);
}

.fab-menu-enter-from,
.fab-menu-leave-to {
  opacity: 0;
}

.fab-menu-enter-from .fab-menu-sheet,
.fab-menu-leave-to .fab-menu-sheet {
  transform: translateY(100%);
}
</style>
