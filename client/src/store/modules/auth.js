/**
 * Vuex Auth Store Module.
 * Manages application auth state. Supabase owns token storage and rotation;
 * this module owns only the session projection needed by the UI.
 */
import authApi from '@/api/authApi'

let unsubscribeFromSession = null

export default {
  namespaced: true,

  state: () => ({
    session: null,
    /** Current user profile { id, username, role } */
    user: null,
    initialized: false,
    /** Login request loading state */
    loading: false,
    /** Login error message */
    error: null
  }),

  getters: {
    /** Whether the user is currently authenticated */
    isAuthenticated: (state) => Boolean(state.session?.access_token && state.user),
    /** Current user's role string */
    userRole: (state) => state.user?.role || null,
    /** Current user's display name */
    username: (state) => state.user?.username || '',
    /** Current user's ID */
    userId: (state) => state.user?.id || null
  },

  mutations: {
    SET_AUTH(state, { session, user }) {
      state.session = session
      state.user = user
      state.error = null
    },

    /** Clears all auth state (logout) */
    CLEAR_AUTH(state) {
      state.session = null
      state.user = null
      state.error = null
    },

    SET_LOADING(state, loading) {
      state.loading = loading
    },

    SET_ERROR(state, error) {
      state.error = error
    },

    SET_INITIALIZED(state, initialized) {
      state.initialized = initialized
    }
  },

  actions: {
    /**
     * Authenticates the user with username/password.
     * On success: stores tokens and user profile.
     * On failure: sets error message for display.
     */
    async login({ commit }, credentials) {
      commit('SET_LOADING', true)
      commit('SET_ERROR', null)

      try {
        const result = await authApi.login(credentials)
        commit('SET_AUTH', result)
        return result
      } catch (error) {
        const message = error.message || 'Login failed'
        commit('SET_ERROR', message)
        throw error
      } finally {
        commit('SET_LOADING', false)
      }
    },

    /** Restore the Supabase session before the router starts evaluating guards. */
    async initialize({ commit, dispatch }) {
      try {
        const session = await authApi.getSession()
        await dispatch('syncSession', session)

        if (!unsubscribeFromSession) {
          unsubscribeFromSession = authApi.onSessionChange(nextSession => {
            dispatch('syncSession', nextSession).catch(error => {
              commit('SET_ERROR', error.message)
            })
          })
        }
      } catch (error) {
        commit('CLEAR_AUTH')
        commit('SET_ERROR', error.message)
      } finally {
        commit('SET_INITIALIZED', true)
      }
    },

    async syncSession({ commit }, session) {
      if (!session?.user) {
        commit('CLEAR_AUTH')
        return
      }

      try {
        const user = await authApi.getProfile(session.user.id)
        commit('SET_AUTH', { session, user })
      } catch (error) {
        commit('CLEAR_AUTH')
        throw error
      }
    },

    /**
     * Logs the user out by revoking the refresh token server-side
     * and clearing all local auth state.
     */
    async logout({ commit }) {
      try {
        await authApi.logout()
      } catch {
        // Ignore logout API errors — clear local state regardless
      } finally {
        commit('CLEAR_AUTH')
      }
    }
  }
}
