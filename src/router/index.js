import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// Vue Router — útvonalak és meta-flag alapú authentikáció (auth/guest/verified/admin)
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    if (to.hash) return { el: to.hash, behavior: 'smooth' }
    return { top: 0, left: 0 }
  },
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/HomeView.vue'),
      meta: { fullWidth: true },
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/auth/LoginView.vue'),
      meta: { requiresGuest: true, fullWidth: true },
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('@/views/auth/RegisterView.vue'),
      meta: { requiresGuest: true, fullWidth: true },
    },
    {
      path: '/forgot-password',
      name: 'forgot-password',
      component: () => import('@/views/auth/ForgotPasswordView.vue'),
      meta: { requiresGuest: true, fullWidth: true },
    },
    {
      path: '/reset-password',
      name: 'reset-password',
      component: () => import('@/views/auth/ResetPasswordView.vue'),
      meta: { requiresGuest: true, fullWidth: true },
    },
    {
      path: '/verify-otp',
      name: 'verify-otp',
      component: () => import('@/views/auth/VerifyOtpView.vue'),
      meta: { requiresAuth: true, fullWidth: true },
    },
    {
      path: '/recipes',
      name: 'recipes',
      component: () => import('@/views/RecipeCatalogView.vue'),
    },
    {
      path: '/recipes/create',
      name: 'recipe-create',
      component: () => import('@/views/RecipeEditorView.vue'),
      meta: { requiresAuth: true, requiresVerified: true },
    },
    {
      path: '/recipes/:id',
      name: 'recipe-detail',
      component: () => import('@/views/RecipeDetailView.vue'),
    },
    {
      path: '/recipes/:id/edit',
      name: 'recipe-edit',
      component: () => import('@/views/RecipeEditorView.vue'),
      meta: { requiresAuth: true, requiresVerified: true },
    },
    {
      path: '/tools',
      name: 'tools',
      component: () => import('@/views/tools/ToolMarketView.vue'),
    },
    {
      path: '/tools/create',
      name: 'tool-create',
      component: () => import('@/views/tools/ToolEditorView.vue'),
      meta: { requiresAuth: true, requiresVerified: true },
    },
    {
      path: '/tools/:id',
      name: 'tool-detail',
      component: () => import('@/views/tools/ToolDetailView.vue'),
    },
    {
      path: '/tools/:id/edit',
      name: 'tool-edit',
      component: () => import('@/views/tools/ToolEditorView.vue'),
      meta: { requiresAuth: true, requiresVerified: true },
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('@/views/ProfileView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/users/:id',
      name: 'user-profile',
      component: () => import('@/views/UserPublicProfileView.vue'),
    },
    {
      path: '/messages',
      name: 'messages',
      component: () => import('@/views/MessengerView.vue'),
      meta: { requiresAuth: true, requiresVerified: true },
    },
    {
      path: '/shopping-list',
      name: 'shopping-list',
      component: () => import('@/views/ShoppingListView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/calendar',
      name: 'calendar',
      component: () => import('@/views/CalendarView.vue'),
      meta: { requiresAuth: true, requiresVerified: true },
    },
    {
      path: '/recipe-books',
      name: 'recipe-books',
      component: () => import('@/views/RecipeBookListView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/recipe-books/create',
      name: 'recipe-book-create',
      component: () => import('@/views/RecipeBookEditorView.vue'),
      meta: { requiresAuth: true, requiresVerified: true },
    },
    {
      path: '/recipe-books/:id',
      name: 'recipe-book-detail',
      component: () => import('@/views/RecipeBookDetailView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/recipe-books/:id/edit',
      name: 'recipe-book-edit',
      component: () => import('@/views/RecipeBookEditorView.vue'),
      meta: { requiresAuth: true, requiresVerified: true },
    },
    {
      path: '/admin',
      name: 'admin',
      component: () => import('@/views/AdminView.vue'),
      meta: { requiresAuth: true, requiresAdmin: true },
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/views/NotFoundView.vue'),
    },
  ],
})

// Globális navigation guard — meta flag-ek szerint redirectel, ha nincs jogosultság
router.beforeEach(async (to) => {
  const authStore = useAuthStore()

  if (authStore.token && !authStore.user) {
    await authStore.fetchUser()
  }

  if (to.meta.requiresGuest && authStore.isAuthenticated) {
    return { name: 'home' }
  }
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return {
      name: 'login',
      query: to.fullPath && to.fullPath !== '/' ? { redirect: to.fullPath } : undefined,
    }
  }
  if (
    to.meta.requiresVerified &&
    authStore.isAuthenticated &&
    authStore.user &&
    !authStore.user.is_verified
  ) {
    return { name: 'verify-otp' }
  }
  if (to.meta.requiresAdmin && !authStore.isAdmin) {
    return { name: 'home' }
  }
})

export default router
