import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/HomeView.vue'),
      meta: { fullWidth: true }
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/auth/LoginView.vue'),
      meta: { requiresGuest: true, fullWidth: true }
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('@/views/auth/RegisterView.vue'),
      meta: { requiresGuest: true, fullWidth: true }
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
      meta: { requiresAuth: true }
    },
    {
      path: '/recipes/:id',
      name: 'recipe-detail',
      component: () => import('@/views/RecipeDetailView.vue')
    },
    {
      path: '/recipes/:id/edit',
      name: 'recipe-edit',
      component: () => import('@/views/RecipeEditorView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('@/views/ProfileView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/messages',
      name: 'messages',
      component: () => import('@/views/MessengerView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/shopping-list',
      name: 'shopping-list',
      component: () => import('@/views/ShoppingListView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/calendar',
      name: 'calendar',
      component: () => import('@/views/CalendarView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/views/NotFoundView.vue')
    }
  ],
})

router.beforeEach((to, _from) => {
  const authStore = useAuthStore()

  if (to.meta.requiresGuest && authStore.isAuthenticated) {
    return '/'
  }
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return { name: 'login' }
  }
})

export default router
