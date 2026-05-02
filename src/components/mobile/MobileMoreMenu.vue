<!-- Bottom-sheet "Egyéb" menü a mobil navbarhoz — profil, receptkönyvek, bevásárlólista, eszközök, üzenetek, kijelentkezés. -->

<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'

const props = defineProps({
  open: { type: Boolean, default: false },
})
const emit = defineEmits(['update:open'])

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const close = () => emit('update:open', false)

const hasUnread = ref(false)
let unreadTimer = null

async function checkUnread() {
  if (!authStore.isAuthenticated) {
    hasUnread.value = false
    return
  }
  try {
    const res = await api.get('/messages/unread-count')
    hasUnread.value = (res.data?.count ?? 0) > 0
  } catch {
    hasUnread.value = false
  }
}

onMounted(() => {
  checkUnread()
  unreadTimer = setInterval(checkUnread, 60_000)
  window.addEventListener('unread:refresh', checkUnread)
})

onUnmounted(() => {
  clearInterval(unreadTimer)
  window.removeEventListener('unread:refresh', checkUnread)
})

const menuItems = computed(() => {
  const items = []

  if (authStore.isAuthenticated) {
    items.push(
      {
        to: '/profile',
        label: 'Profilom',
        icon: 'user',
        active: route.path === '/profile',
      },
      {
        to: '/recipe-books',
        label: 'Receptkönyveim',
        icon: 'book',
        active: route.path.startsWith('/recipe-books'),
      },
      {
        to: '/shopping-list',
        label: 'Bevásárlólista',
        icon: 'cart',
        active: route.path === '/shopping-list',
      },
      {
        to: '/tools',
        label: 'Eszközök',
        icon: 'tool',
        active: route.path.startsWith('/tools'),
      },
      {
        to: '/messages',
        label: 'Üzenetek',
        icon: 'message',
        active: route.path === '/messages',
        badge: hasUnread.value,
      },
    )

    if (authStore.isAdmin) {
      items.push({
        to: '/admin',
        label: 'Admin',
        icon: 'admin',
        active: route.path === '/admin',
      })
    }
  } else {
    items.push(
      {
        to: '/tools',
        label: 'Eszközök',
        icon: 'tool',
        active: route.path.startsWith('/tools'),
      },
      {
        to: '/login',
        label: 'Bejelentkezés',
        icon: 'login',
        active: route.path === '/login',
      },
    )
  }

  return items
})

function navigateTo(item) {
  close()
  router.push(item.to)
}

async function handleLogout() {
  close()
  try {
    await authStore.logout()
    await router.push('/')
  } catch (e) {
    console.error('Logout failed:', e)
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="more-menu">
      <div v-if="open" class="more-overlay md:hidden no-print" @click.self="close">
        <div class="more-sheet" role="dialog" aria-label="Egyéb menü">
          <div class="more-handle" aria-hidden="true"></div>

          <div
            v-if="authStore.isAuthenticated"
            class="more-user"
          >
            <div class="more-avatar">
              {{ authStore.user?.username?.slice(0, 2).toUpperCase() || 'FE' }}
            </div>
            <div class="more-user-info">
              <p class="more-user-name">{{ authStore.user?.username || 'Felhasználó' }}</p>
              <p class="more-user-email">{{ authStore.user?.email || '' }}</p>
            </div>
          </div>

          <ul class="more-list">
            <li v-for="item in menuItems" :key="item.to">
              <button
                type="button"
                class="more-item"
                :class="{ 'more-item--active': item.active }"
                @click="navigateTo(item)"
              >
                <span class="more-item-icon" :class="`more-item-icon--${item.icon}`">
                  <!-- user -->
                  <svg v-if="item.icon === 'user'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <!-- book -->
                  <svg v-else-if="item.icon === 'book'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  <!-- cart -->
                  <svg v-else-if="item.icon === 'cart'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
                  </svg>
                  <!-- tool -->
                  <svg v-else-if="item.icon === 'tool'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <!-- message -->
                  <svg v-else-if="item.icon === 'message'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <!-- admin -->
                  <svg v-else-if="item.icon === 'admin'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <!-- login -->
                  <svg v-else-if="item.icon === 'login'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                </span>
                <span class="more-item-label">{{ item.label }}</span>
                <span v-if="item.badge" class="more-item-badge">új</span>
                <svg class="more-item-chevron" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </li>
          </ul>

          <button
            v-if="authStore.isAuthenticated"
            type="button"
            class="more-logout"
            @click="handleLogout"
          >
            <svg class="more-logout-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Kijelentkezés
          </button>

          <button type="button" class="more-close" @click="close">Bezárás</button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.more-overlay {
  position: fixed;
  inset: 0;
  z-index: 60;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.more-sheet {
  width: 100%;
  background: var(--color-bg);
  border-top-left-radius: 1.5rem;
  border-top-right-radius: 1.5rem;
  padding: 1rem 1rem calc(1.25rem + env(safe-area-inset-bottom, 0));
  box-shadow: 0 -10px 32px -10px rgba(0, 0, 0, 0.35);
  transform-origin: bottom center;
  max-height: 80vh;
  overflow-y: auto;
}

.more-handle {
  width: 44px;
  height: 4px;
  background: color-mix(in srgb, var(--color-stroke) 70%, transparent);
  border-radius: 999px;
  margin: 0 auto 0.85rem;
}

/* ── User header ── */
.more-user {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0.5rem 0.85rem;
  border-bottom: 1px solid color-mix(in srgb, var(--color-stroke) 50%, transparent);
  margin-bottom: 0.65rem;
}

.more-avatar {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: var(--color-accent);
  color: var(--color-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 0.85rem;
  flex-shrink: 0;
}

.more-user-info {
  min-width: 0;
}

.more-user-name {
  font-size: 0.95rem;
  font-weight: 800;
  color: var(--color-text);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.more-user-email {
  font-size: 0.78rem;
  color: var(--color-muted);
  margin: 0.1rem 0 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ── Menu items ── */
.more-list {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  list-style: none;
  padding: 0;
  margin: 0;
}

.more-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.72rem 0.85rem;
  border: 1px solid color-mix(in srgb, var(--color-stroke) 40%, transparent);
  border-radius: 0.9rem;
  background: var(--color-surface);
  color: var(--color-text);
  text-align: left;
  cursor: pointer;
  transition:
    background-color 180ms var(--ease-ui-out),
    transform 160ms var(--ease-ui-out);
}

.more-item:hover {
  background: color-mix(in srgb, var(--color-surface) 75%, var(--color-bg));
}

.more-item:active {
  transform: scale(0.985);
}

.more-item--active {
  background: color-mix(in srgb, var(--color-accent) 12%, var(--color-surface));
  border-color: color-mix(in srgb, var(--color-accent) 30%, transparent);
}

.more-item--active .more-item-label {
  color: var(--color-accent);
}

.more-item-icon {
  width: 36px;
  height: 36px;
  border-radius: 0.65rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in srgb, var(--color-accent) 14%, transparent);
  color: var(--color-accent);
  flex-shrink: 0;
}

.more-item-icon svg {
  width: 1.2rem;
  height: 1.2rem;
}

.more-item-icon--book {
  background: color-mix(in srgb, var(--color-chip) 18%, transparent);
  color: var(--color-chip);
}

.more-item-icon--cart {
  background: color-mix(in srgb, #4a90e2 16%, transparent);
  color: #2c6db5;
}

.more-item-icon--tool {
  background: color-mix(in srgb, #b18352 18%, transparent);
  color: #8a5f30;
}

.more-item-icon--message {
  background: color-mix(in srgb, #9b59b6 16%, transparent);
  color: #7d3c98;
}

.more-item-icon--admin {
  background: color-mix(in srgb, var(--color-danger) 14%, transparent);
  color: var(--color-danger);
}

.more-item-icon--login {
  background: color-mix(in srgb, var(--color-accent) 14%, transparent);
  color: var(--color-accent);
}

.more-item-label {
  flex: 1;
  font-weight: 700;
  font-size: 0.95rem;
}

.more-item-badge {
  background: color-mix(in srgb, var(--color-danger) 14%, transparent);
  color: var(--color-danger);
  padding: 0.15rem 0.55rem;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 800;
}

.more-item-chevron {
  width: 0.9rem;
  height: 0.9rem;
  color: var(--color-muted);
  flex-shrink: 0;
  opacity: 0.5;
}

/* ── Logout ── */
.more-logout {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  margin-top: 0.65rem;
  padding: 0.72rem;
  border-radius: 0.9rem;
  border: 1px solid color-mix(in srgb, var(--color-danger) 25%, transparent);
  background: color-mix(in srgb, var(--color-danger) 8%, transparent);
  color: var(--color-danger);
  font-weight: 700;
  font-size: 0.92rem;
  cursor: pointer;
  transition:
    background-color 180ms ease,
    transform 160ms ease;
}

.more-logout:hover {
  background: color-mix(in srgb, var(--color-danger) 14%, transparent);
}

.more-logout:active {
  transform: scale(0.985);
}

.more-logout-icon {
  width: 1.15rem;
  height: 1.15rem;
}

/* ── Close button ── */
.more-close {
  width: 100%;
  margin-top: 0.65rem;
  padding: 0.78rem;
  border-radius: 0.95rem;
  border: 1px solid color-mix(in srgb, var(--color-stroke) 70%, transparent);
  background: transparent;
  color: var(--color-muted);
  font-weight: 700;
  cursor: pointer;
  transition: background-color 180ms ease;
}

.more-close:hover {
  background: color-mix(in srgb, var(--color-surface) 70%, transparent);
}

/* ── Transitions ── */
.more-menu-enter-active,
.more-menu-leave-active {
  transition: opacity 220ms var(--ease-ui-out);
}

.more-menu-enter-active .more-sheet,
.more-menu-leave-active .more-sheet {
  transition: transform 280ms var(--ease-drawer);
}

.more-menu-enter-from,
.more-menu-leave-to {
  opacity: 0;
}

.more-menu-enter-from .more-sheet,
.more-menu-leave-to .more-sheet {
  transform: translateY(100%);
}
</style>
