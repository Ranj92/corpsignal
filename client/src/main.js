/**
 * Application entry point.
 * Initializes Vue 3 with Vuex store, Vue Router, and global styles.
 */
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import './style.css'

async function bootstrap() {
  await store.dispatch('auth/initialize')

  const app = createApp(App)
  app.use(store)
  app.use(router)
  app.mount('#app')
}

bootstrap()
