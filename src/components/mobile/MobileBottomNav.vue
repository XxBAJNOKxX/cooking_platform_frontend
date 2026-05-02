<!-- Mobil alsó tab-bar — bejelentkezett: Home / Receptek / FAB+ / Naptár / Egyéb; vendég: Home / Receptek / Eszközök / Belépés. Csak `md:` alatt látható. -->

<script setup>
import { ref, computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import MobileFabMenu from '@/components/mobile/MobileFabMenu.vue'
import MobileMoreMenu from '@/components/mobile/MobileMoreMenu.vue'

const route = useRoute()
const authStore = useAuthStore()

const isFabMenuOpen = ref(false)
const isMoreMenuOpen = ref(false)

const isMoreActive = computed(() =>
  route.path.startsWith('/profile') ||
  route.path.startsWith('/recipe-books') ||
  route.path.startsWith('/shopping-list') ||
  route.path.startsWith('/tools') ||
  route.path.startsWith('/messages') ||
  route.path.startsWith('/admin')
)
</script>

<template>
  <!-- ═══ Bejelentkezett felhasználó navbar ═══ -->
  <nav v-if="authStore.isAuthenticated" class="bottom-nav bottom-nav--auth md:hidden no-print" aria-label="Alsó navigáció">
    <RouterLink
      to="/"
      class="bottom-nav-tab"
      :class="{ 'bottom-nav-tab--active': route.path === '/' }"
    >
      <svg class="bottom-nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
      <span class="bottom-nav-label">Főoldal</span>
    </RouterLink>

    <RouterLink
      to="/recipes"
      class="bottom-nav-tab"
      :class="{ 'bottom-nav-tab--active': route.path.startsWith('/recipes') && !route.path.startsWith('/recipe-books') }"
    >
      <svg class="bottom-nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
      <span class="bottom-nav-label">Receptek</span>
    </RouterLink>

    <button
      type="button"
      class="bottom-nav-fab"
      aria-label="Gyors akciók megnyitása"
      @click="isFabMenuOpen = true"
    >
      <span class="bottom-nav-fab-inner">
        <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4" />
        </svg>
      </span>
    </button>

    <RouterLink
      to="/calendar"
      class="bottom-nav-tab"
      :class="{ 'bottom-nav-tab--active': route.path.startsWith('/calendar') }"
    >
      <svg class="bottom-nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
      <span class="bottom-nav-label">Naptár</span>
    </RouterLink>

    <button
      type="button"
      class="bottom-nav-tab"
      :class="{ 'bottom-nav-tab--active': isMoreActive }"
      @click="isMoreMenuOpen = true"
    >
      <svg class="bottom-nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
      </svg>
      <span class="bottom-nav-label">Egyéb</span>
    </button>
  </nav>

  <!-- ═══ Vendég navbar (nincs FAB, 4 tab) ═══ -->
  <nav v-else class="bottom-nav bottom-nav--guest md:hidden no-print" aria-label="Alsó navigáció">
    <RouterLink
      to="/"
      class="bottom-nav-tab"
      :class="{ 'bottom-nav-tab--active': route.path === '/' }"
    >
      <svg class="bottom-nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
      <span class="bottom-nav-label">Főoldal</span>
    </RouterLink>

    <RouterLink
      to="/recipes"
      class="bottom-nav-tab"
      :class="{ 'bottom-nav-tab--active': route.path.startsWith('/recipes') }"
    >
      <svg class="bottom-nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
      <span class="bottom-nav-label">Receptek</span>
    </RouterLink>

    <RouterLink
      to="/tools"
      class="bottom-nav-tab"
      :class="{ 'bottom-nav-tab--active': route.path.startsWith('/tools') }"
    >
      <svg class="bottom-nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
      <span class="bottom-nav-label">Eszközök</span>
    </RouterLink>

    <RouterLink
      to="/login"
      class="bottom-nav-tab"
      :class="{ 'bottom-nav-tab--active': route.path === '/login' || route.path === '/register' }"
    >
      <svg class="bottom-nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
      </svg>
      <span class="bottom-nav-label">Belépés</span>
    </RouterLink>
  </nav>

  <MobileFabMenu v-model:open="isFabMenuOpen" />
  <MobileMoreMenu v-model:open="isMoreMenuOpen" />
</template>

<style scoped>
.bottom-nav {
  position: fixed;
  inset-inline: 0;
  bottom: 0;
  z-index: 45;
  display: grid;
  align-items: stretch;
  background: color-mix(in srgb, var(--color-bg) 96%, transparent);
  backdrop-filter: blur(12px);
  border-top: 1px solid color-mix(in srgb, var(--color-stroke) 60%, transparent);
  box-shadow: 0 -4px 20px -8px rgba(0, 0, 0, 0.15);
  padding-bottom: env(safe-area-inset-bottom, 0);
  height: calc(64px + env(safe-area-inset-bottom, 0));
}

.bottom-nav--auth {
  grid-template-columns: repeat(2, 1fr) auto repeat(2, 1fr);
}

.bottom-nav--guest {
  grid-template-columns: repeat(4, 1fr);
}

@media (min-width: 768px) {
  .bottom-nav {
    display: none !important;
  }
}

.bottom-nav-tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.18rem;
  color: var(--color-muted);
  font-size: 0.68rem;
  font-weight: 600;
  text-decoration: none;
  position: relative;
  transition: color 180ms var(--ease-ui-out);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
}

.bottom-nav-tab:active {
  transform: scale(0.96);
}

.bottom-nav-tab--active {
  color: var(--color-accent);
}

.bottom-nav-tab--active::before {
  content: '';
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 32px;
  height: 2.5px;
  background: var(--color-accent);
  border-radius: 0 0 2px 2px;
}

.bottom-nav-icon {
  width: 1.5rem;
  height: 1.5rem;
}

.bottom-nav-label {
  letter-spacing: 0.01em;
}

.bottom-nav-fab {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
}

.bottom-nav-fab-inner {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  border-radius: 999px;
  background: var(--color-accent);
  color: var(--color-bg);
  box-shadow:
    0 8px 20px -8px color-mix(in srgb, var(--color-accent) 80%, transparent),
    0 0 0 4px var(--color-bg);
  transform: translateY(-22px);
  transition:
    transform 200ms var(--ease-ui-out),
    background-color 200ms var(--ease-ui-out),
    box-shadow 200ms var(--ease-ui-out);
}

.bottom-nav-fab:active .bottom-nav-fab-inner {
  transform: translateY(-22px) scale(0.92);
  background: var(--color-accent-hover);
}

@media print {
  .bottom-nav,
  .no-print {
    display: none !important;
  }
}
</style>
