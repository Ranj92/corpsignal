/**
 * Vuex Users Store Module.
 * Manages user accounts (Manager role only).
 */
import usersApi from '@/api/usersApi'

export default {
  namespaced: true,

  state: () => ({
    /** Array of user objects */
    users: [],
    /** Loading state */
    loading: false,
    /** Error message */
    error: null
  }),

  mutations: {
    SET_USERS(state, users) {
      state.users = users
    },

    ADD_USER(state, user) {
      state.users.unshift(user)
    },

    UPDATE_USER(state, updatedUser) {
      const index = state.users.findIndex(u => u.id === updatedUser.id)
      if (index !== -1) {
        state.users.splice(index, 1, updatedUser)
      }
    },

    REMOVE_USER(state, userId) {
      state.users = state.users.filter(u => u.id !== userId)
    },

    SET_LOADING(state, loading) {
      state.loading = loading
    },

    SET_ERROR(state, error) {
      state.error = error
    }
  },

  actions: {
    /** Fetches all users from the API */
    async fetchUsers({ commit }) {
      commit('SET_LOADING', true)
      commit('SET_ERROR', null)

      try {
        const users = await usersApi.getUsers()
        commit('SET_USERS', users)
      } catch (error) {
        commit('SET_ERROR', error.message || 'Failed to load users')
      } finally {
        commit('SET_LOADING', false)
      }
    },

    /** Creates a new user account */
    async createUser({ commit }, userData) {
      const user = await usersApi.createUser(userData)
      commit('ADD_USER', user)
      return user
    },

    /** Updates an existing user account */
    async updateUser({ commit }, { id, data: userData }) {
      const user = await usersApi.updateUser(id, userData)
      commit('UPDATE_USER', user)
      return user
    },

    /** Deletes a user account */
    async deleteUser({ commit }, userId) {
      await usersApi.deleteUser(userId)
      commit('REMOVE_USER', userId)
    }
  }
}
