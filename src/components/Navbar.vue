<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import BaseButton from '@/components/BaseButton.vue'
import { useRouter } from 'vue-router'
import api from '@/services/api'

const authStore = useAuthStore()
const router = useRouter()

const isMobileMenuOpen = ref(false)
const isProfileMenuOpen = ref(false)
const profileDropdownRef = ref(null)

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

const closeMobileMenu = () => {
  if (isMobileMenuOpen.value) {
    isMobileMenuOpen.value = false
  }
}

const toggleProfileMenu = () => {
  isProfileMenuOpen.value = !isProfileMenuOpen.value
}

const closeProfileMenu = () => {
  if (isProfileMenuOpen.value) {
    isProfileMenuOpen.value = false
  }
}

const handleClickOutside = (e) => {
  if (profileDropdownRef.value && !profileDropdownRef.value.contains(e.target)) {
    closeProfileMenu()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  checkUnread()
  unreadTimer = setInterval(checkUnread, 60_000)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  clearInterval(unreadTimer)
})

const hasUnread = ref(false)
let unreadTimer = null

async function checkUnread() {
  if (!authStore.isAuthenticated) return
  try {
    const res = await api.get('/messages', { params: { per_page: 100 } })
    const myId = authStore.user?.id
    hasUnread.value = (res.data.data ?? []).some(
      m => !m.is_read && m.receiver?.id === myId
    )
  } catch { /* silent */ }
}

const handleLogout = async () => {
  closeProfileMenu()
  closeMobileMenu()

  try {
    await authStore.logout()
    await router.push('/')
  } catch (error) {
    console.error('Logout failed:', error)
  }
}
</script>

<template>
  <header class="sticky top-0 z-40 w-full border-b border-stroke bg-[#ffe0c2]/40 backdrop-blur-md">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="flex h-16 items-center justify-between">

        <div class="shrink-0 flex items-center">
          <RouterLink to="/" class="nav-logo group text-2xl font-black tracking-tight text-text outline-none relative"
            @click="closeMobileMenu">
            Cookr<span class="text-accent">.</span>
          </RouterLink>
        </div>

        <nav class="hidden md:flex items-center space-x-6 lg:space-x-8">
          <RouterLink to="/" class="nav-link text-sm font-semibold text-muted hover:text-text"
            exact-active-class="router-link-active">
            Főoldal
          </RouterLink>
          <RouterLink to="/recipes" class="nav-link text-sm font-semibold text-muted hover:text-text">
            Receptek
          </RouterLink>
          <RouterLink to="/tools" class="nav-link text-sm font-semibold text-muted hover:text-text">
            Eszközök
          </RouterLink>

          <template v-if="authStore.isAuthenticated">
            <RouterLink to="/calendar" class="nav-link text-sm font-semibold text-muted hover:text-text">
              Naptár
            </RouterLink>
            <RouterLink to="/shopping-list" class="nav-link text-sm font-semibold text-muted hover:text-text">
              Bevásárlólista
            </RouterLink>
          </template>
        </nav>

        <div class="hidden md:flex items-center space-x-4">
          <template v-if="authStore.isAuthenticated">
            <RouterLink to="/recipes/create" tabindex="-1">
              <BaseButton variant="primary" size="sm" rounded="full">Új recept</BaseButton>
            </RouterLink>

            <div class="relative" ref="profileDropdownRef">
              <button @click.stop="toggleProfileMenu"
                class="nav-avatar-btn flex items-center justify-center outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-full"
                aria-label="Profil menü">
                <div class="relative">
                  <div
                    class="h-9 w-9 rounded-full bg-accent text-bg flex items-center justify-center font-bold text-sm shadow-sm ring-2 ring-transparent hover:ring-stroke transition-all duration-200">
                    {{ authStore.user?.username?.charAt(0).toUpperCase() || 'U' }}
                  </div>
                  <span v-if="hasUnread" class="nav-unread-dot" aria-label="Olvasatlan üzenetek"></span>
                </div>
              </button>

              <div v-show="isProfileMenuOpen"
                class="profile-dropdown absolute right-0 top-12 mt-2 w-56 rounded-xl border border-stroke bg-bg shadow-xl overflow-hidden py-1 z-50">
                <div class="px-4 py-3 border-b border-stroke bg-surface/30">
                  <p class="text-sm font-bold text-text truncate">{{ authStore.user?.username || 'Felhasználó' }}</p>
                  <p class="text-xs text-muted truncate mt-0.5">{{ authStore.user?.email || 'email@pelda.hu' }}</p>
                </div>

                <div class="py-1">
                  <RouterLink to="/profile" @click="closeProfileMenu"
                    class="block px-4 py-2 text-sm font-medium text-text hover:bg-surface hover:text-accent transition-colors">
                    Profil
                  </RouterLink>
                  <RouterLink to="/messages" @click="closeProfileMenu"
                    class="block px-4 py-2 text-sm font-medium text-text hover:bg-surface hover:text-accent transition-colors">
                    Üzenetek
                  </RouterLink>
                </div>

                <div class="border-t border-stroke py-1">
                  <button @click="handleLogout"
                    class="w-full text-left px-4 py-2 text-sm font-medium text-danger hover:bg-danger/10 transition-colors">
                    Kijelentkezés
                  </button>
                </div>
              </div>
            </div>
          </template>

          <template v-else>
            <RouterLink to="/login" tabindex="-1">
              <BaseButton variant="primary" size="sm" rounded="full">Bejelentkezés</BaseButton>
            </RouterLink>
          </template>
        </div>

        <div class="flex md:hidden items-center">
          <button @click="toggleMobileMenu"
            class="mobile-menu-btn relative text-text bg-surface/40 hover:bg-surface/70 border border-stroke/70 focus:outline-none focus:ring-2 focus:ring-accent rounded-xl p-2"
            aria-label="Menü megnyitása">
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                :d="isMobileMenuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'"
                class="transition-all duration-300" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <div v-show="isMobileMenuOpen" class="mobile-menu-shell md:hidden absolute inset-x-0 top-full px-3 pt-2 pb-4">
      <div
        class="mobile-menu rounded-3xl border border-stroke/80 bg-[#ffe0c2]/88 backdrop-blur-xl shadow-[0_24px_50px_-28px_rgba(0,0,0,0.45)] overflow-hidden">
        <div class="p-3 space-y-1.5">
          <RouterLink @click="closeMobileMenu" to="/" exact-active-class="mobile-link-active" class="mobile-link">
            <span>Főoldal</span>
          </RouterLink>

          <RouterLink @click="closeMobileMenu" to="/recipes" exact-active-class="mobile-link-active"
            class="mobile-link">
            <span>Receptek</span>
          </RouterLink>

          <RouterLink @click="closeMobileMenu" to="/tools" exact-active-class="mobile-link-active"
            class="mobile-link">
            <span>Eszközök</span>
          </RouterLink>

          <template v-if="authStore.isAuthenticated">
            <RouterLink @click="closeMobileMenu" to="/calendar" exact-active-class="mobile-link-active"
              class="mobile-link">
              <span>Naptár</span>
            </RouterLink>

            <RouterLink @click="closeMobileMenu" to="/shopping-list" exact-active-class="mobile-link-active"
              class="mobile-link">
              <span>Bevásárlólista</span>
            </RouterLink>

            <div class="h-px bg-stroke/60 my-3 mx-2"></div>

            <div class="px-1 pb-1">
              <RouterLink to="/recipes/create" tabindex="-1" @click="closeMobileMenu">
                <BaseButton variant="primary" block class="py-3">Új recept</BaseButton>
              </RouterLink>
            </div>

            <div class="mobile-account mt-3 p-3 rounded-2xl border border-stroke/70 bg-surface/35">
              <div class="flex items-center gap-3 px-1 pb-3 border-b border-stroke/60">
                <div
                  class="h-10 w-10 rounded-full bg-accent text-bg flex items-center justify-center font-black text-sm">
                  {{ authStore.user?.username?.charAt(0).toUpperCase() || 'U' }}
                </div>
                <div class="min-w-0">
                  <p class="text-sm font-bold text-text truncate">{{ authStore.user?.username || 'Felhasználó' }}</p>
                  <p class="text-xs text-muted truncate mt-0.5">{{ authStore.user?.email || 'email@pelda.hu' }}</p>
                </div>
              </div>

              <div class="pt-2 space-y-1">
                <RouterLink @click="closeMobileMenu" to="/profile" exact-active-class="mobile-sub-link-active"
                  class="mobile-sub-link">
                  Profil
                </RouterLink>

                <RouterLink @click="closeMobileMenu" to="/messages" exact-active-class="mobile-sub-link-active"
                  class="mobile-sub-link">
                  Üzenetek
                </RouterLink>

                <button @click="handleLogout" class="mobile-sub-link mobile-sub-link-danger">
                  Kijelentkezés
                </button>
              </div>
            </div>
          </template>

          <template v-else>
            <div class="px-1 pt-3 pb-1">
              <RouterLink to="/login" tabindex="-1" @click="closeMobileMenu">
                <BaseButton variant="primary" block class="py-3">Bejelentkezés</BaseButton>
              </RouterLink>
            </div>
          </template>
        </div>
      </div>
    </div>
  </header>
</template>

<style scoped>
.nav-logo {
  transition: transform 160ms var(--ease-ui-out), opacity 160ms var(--ease-ui-out);
  transform-origin: left center;
}

.nav-logo:active {
  transform: scale(0.95);
  opacity: 0.8;
}

.nav-link {
  transition: color 200ms ease;
  position: relative;
}

.nav-link::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: 0;
  width: 100%;
  height: 2px;
  background-color: var(--color-accent);
  border-radius: 2px;
  transform: scaleX(0);
  transform-origin: right;
  transition: transform 300ms var(--ease-ui-out);
}

.nav-link:hover::after,
.nav-link.router-link-active::after {
  transform: scaleX(1);
  transform-origin: left;
}

.nav-link.router-link-active {
  color: var(--color-text);
}

.nav-avatar-btn {
  transition: transform 160ms var(--ease-ui-out);
}

.nav-avatar-btn:active {
  transform: scale(0.92);
}

.nav-unread-dot {
  position: absolute;
  top: -1px; right: -1px;
  width: 0.625rem; height: 0.625rem;
  border-radius: 999px;
  background: var(--color-danger);
  border: 2px solid var(--color-bg);
}

.profile-dropdown {
  transform-origin: top right;
  transition: opacity 150ms var(--ease-ui-out), transform 150ms var(--ease-ui-out);
}

@starting-style {
  .profile-dropdown {
    opacity: 0;
    transform: scale(0.95) translateY(-8px);
  }
}

.mobile-menu-btn {
  transition: transform 160ms var(--ease-ui-out), background-color 160ms var(--ease-ui-out), border-color 160ms var(--ease-ui-out);
}

.mobile-menu-btn:active {
  transform: scale(0.94);
}

.mobile-menu {
  transform-origin: top center;
  transition: opacity 280ms var(--ease-ui-out), transform 320ms var(--ease-drawer), filter 280ms var(--ease-ui-out);
}

@starting-style {
  .mobile-menu {
    transform: translateY(-12px) scale(0.98);
    opacity: 0;
    filter: blur(4px);
  }
}

.mobile-link {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-radius: 0.9rem;
  padding: 0.76rem 0.9rem;
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-text);
  transition: background-color 180ms var(--ease-ui-out), color 180ms var(--ease-ui-out), transform 160ms var(--ease-ui-out);
}

.mobile-link:hover {
  background-color: color-mix(in srgb, var(--color-surface) 72%, transparent);
}

.mobile-link:active {
  transform: scale(0.985);
}

.mobile-link-active {
  background-color: color-mix(in srgb, var(--color-accent) 14%, transparent);
  color: var(--color-accent);
}

.mobile-sub-link {
  display: block;
  width: 100%;
  border-radius: 0.75rem;
  padding: 0.6rem 0.68rem;
  text-align: left;
  font-size: 0.92rem;
  font-weight: 650;
  color: var(--color-text);
  transition: background-color 180ms var(--ease-ui-out), color 180ms var(--ease-ui-out), transform 160ms var(--ease-ui-out);
}

.mobile-sub-link:hover {
  background-color: color-mix(in srgb, var(--color-surface) 82%, transparent);
}

.mobile-sub-link:active {
  transform: scale(0.985);
}

.mobile-sub-link-active {
  background-color: color-mix(in srgb, var(--color-accent) 14%, transparent);
  color: var(--color-accent);
}

.mobile-sub-link-danger {
  color: var(--color-danger);
}

.mobile-sub-link-danger:hover {
  background-color: color-mix(in srgb, var(--color-danger) 12%, transparent);
  color: var(--color-danger);
}
</style>
