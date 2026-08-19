/**
 * Vuex Posts Store Module.
 * Manages posts list, pagination, filters, and CRUD operations.
 * Tracks read status locally to avoid re-firing read receipt API calls.
 */
import postsApi from '@/api/postsApi'
import readReceiptsApi from '@/api/readReceiptsApi'
import { DEFAULT_PAGE_SIZE } from '@/utils/constants'

export default {
  namespaced: true,

  state: () => ({
    /** Array of post objects from the API */
    posts: [],
    /** Pagination metadata */
    pagination: {
      page: 1,
      pageSize: DEFAULT_PAGE_SIZE,
      totalCount: 0,
      totalPages: 0
    },
    /** Active filters */
    filters: {
      priority: null, // null = all, 0 = Low, 1 = Medium, 2 = High
      search: ''
    },
    /** Set of post IDs that have been marked as read in this session */
    readPostIds: new Set(),
    /** Loading state for post list */
    loading: false,
    /** Error message */
    error: null
  }),

  getters: {
    /** Whether any filter is active */
    hasActiveFilters: (state) => {
      return state.filters.priority !== null || state.filters.search.length > 0
    }
  },

  mutations: {
    SET_POSTS(state, { data, pagination }) {
      state.posts = data
      state.pagination = pagination
    },

    /** Adds a single new post to the top of the list */
    ADD_POST(state, post) {
      state.posts.unshift(post)
      state.pagination.totalCount++
    },

    /** Updates a post in the list in place */
    UPDATE_POST(state, updatedPost) {
      const index = state.posts.findIndex(p => p.id === updatedPost.id)
      if (index !== -1) {
        state.posts.splice(index, 1, updatedPost)
      }
    },

    /** Removes a post from the list */
    REMOVE_POST(state, postId) {
      state.posts = state.posts.filter(p => p.id !== postId)
      state.pagination.totalCount--
    },

    SET_FILTERS(state, filters) {
      state.filters = { ...state.filters, ...filters }
    },

    SET_PAGE(state, page) {
      state.pagination.page = page
    },

    /** Track a post as read locally to prevent duplicate API calls */
    MARK_READ(state, postId) {
      state.readPostIds.add(postId)
      // Also update the post in the list
      const post = state.posts.find(p => p.id === postId)
      if (post) {
        post.isRead = true
        post.readCount = (post.readCount || 0) + 1
      }
    },

    SET_LOADING(state, loading) {
      state.loading = loading
    },

    SET_ERROR(state, error) {
      state.error = error
    }
  },

  actions: {
    /**
     * Fetches posts from the API with current filters and pagination.
     * Called on page load, filter change, and page change.
     */
    async fetchPosts({ commit, state }) {
      commit('SET_LOADING', true)
      commit('SET_ERROR', null)

      try {
        const params = {
          page: state.pagination.page,
          pageSize: state.pagination.pageSize
        }

        // Apply filters only if set
        if (state.filters.priority !== null) {
          params.priority = state.filters.priority
        }
        if (state.filters.search) {
          params.search = state.filters.search
        }

        const result = await postsApi.getPosts(params)
        commit('SET_POSTS', result)
      } catch (error) {
        commit('SET_ERROR', error.message || 'Failed to load posts')
      } finally {
        commit('SET_LOADING', false)
      }
    },

    /** Creates a new post and adds it to the top of the list */
    async createPost({ commit }, postData) {
      commit('SET_LOADING', true)
      try {
        const post = await postsApi.createPost(postData)
        commit('ADD_POST', post)
        return post
      } finally {
        commit('SET_LOADING', false)
      }
    },

    /** Updates an existing post */
    async updatePost({ commit }, { id, data: postData }) {
      commit('SET_LOADING', true)
      try {
        const post = await postsApi.updatePost(id, postData)
        commit('UPDATE_POST', post)
        return post
      } finally {
        commit('SET_LOADING', false)
      }
    },

    /** Deletes a post */
    async deletePost({ commit }, postId) {
      commit('SET_LOADING', true)
      try {
        await postsApi.deletePost(postId)
        commit('REMOVE_POST', postId)
      } finally {
        commit('SET_LOADING', false)
      }
    },

    /**
     * Marks a post as read. Only fires the API call once per post per session.
     * Called by IntersectionObserver when a post card scrolls into view.
     */
    async markAsRead({ commit, state }, postId) {
      // Skip if already marked in this session
      if (state.readPostIds.has(postId)) return

      // Find the post and check if already read on the server
      const post = state.posts.find(p => p.id === postId)
      if (post?.isRead) {
        state.readPostIds.add(postId) // Track locally to prevent future checks
        return
      }

      try {
        await readReceiptsApi.markAsRead(postId)
        commit('MARK_READ', postId)
      } catch {
        // Silently fail — read receipts are non-critical
      }
    },

    /** Updates filters and refetches posts from page 1 */
    async setFilters({ commit, dispatch }, filters) {
      commit('SET_FILTERS', filters)
      commit('SET_PAGE', 1)
      await dispatch('fetchPosts')
    },

    /** Changes page and refetches posts */
    async setPage({ commit, dispatch }, page) {
      commit('SET_PAGE', page)
      await dispatch('fetchPosts')
    }
  }
}
