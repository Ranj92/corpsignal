/**
 * Composable: useAuth
 * Provides convenient access to auth state and permission checks.
 * Wraps Vuex auth store getters for use in Vue 3 Composition API.
 */
import { computed } from 'vue'
import { useStore } from 'vuex'
import { canManagePosts, canManageUsers } from '@/utils/constants'

export function useAuth() {
  const store = useStore()

  /** Whether the user is authenticated */
  const isAuthenticated = computed(() => store.getters['auth/isAuthenticated'])

  /** Current user's role (string) */
  const userRole = computed(() => store.getters['auth/userRole'])

  /** Current user's username */
  const username = computed(() => store.getters['auth/username'])

  /** Current user's ID */
  const userId = computed(() => store.getters['auth/userId'])

  /** Whether current user can create/edit/delete posts */
  const canEditPosts = computed(() => canManagePosts(userRole.value))

  /** Whether current user can manage user accounts */
  const canEditUsers = computed(() => canManageUsers(userRole.value))

  return {
    isAuthenticated,
    userRole,
    username,
    userId,
    canEditPosts,
    canEditUsers
  }
}
