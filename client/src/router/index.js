/**
 * Vue Router configuration.
 * Defines routes with role-based guards and lazy-loaded components.
 */
import { createRouter, createWebHistory } from 'vue-router'
import store from '@/store'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/features/auth/pages/LoginPage.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/posts',
    name: 'Posts',
    component: () => import('@/features/posts/pages/PostsListPage.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/users',
    name: 'Users',
    component: () => import('@/features/users/pages/UsersManagePage.vue'),
    meta: { requiresAuth: true, requiredRole: 'Manager' }
  },
  {
    // Default redirect
    path: '/',
    redirect: '/posts'
  },
  {
    // Catch-all 404
    path: '/:pathMatch(.*)*',
    redirect: '/posts'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

/**
 * Global navigation guard.
 * Redirects unauthenticated users to login.
 * Redirects unauthorized users to posts (role check).
 */
router.beforeEach((to, from, next) => {
  const isAuthenticated = store.getters['auth/isAuthenticated']
  const userRole = store.getters['auth/userRole']

  // Route requires auth but user is not logged in
  if (to.meta.requiresAuth !== false && !isAuthenticated) {
    return next('/login')
  }

  // User is logged in but trying to access login page
  if (to.path === '/login' && isAuthenticated) {
    return next('/posts')
  }

  // Route requires specific role
  if (to.meta.requiredRole && userRole !== to.meta.requiredRole) {
    return next('/posts')
  }

  next()
})

export default router
