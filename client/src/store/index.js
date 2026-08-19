/**
 * Vuex Root Store.
 * Registers all namespaced modules.
 * Import and use via: import store from '@/store'
 */
import { createStore } from 'vuex'
import auth from './modules/auth'
import posts from './modules/posts'
import users from './modules/users'

const store = createStore({
  modules: {
    auth,
    posts,
    users
  }
})

export default store
