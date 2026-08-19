<!--
  AppHeader - Top navigation bar.
  Displays app name, current user info, and logout button.
  Responsive design with mobile-friendly layout.
-->
<template>
  <header class="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur-xl">
    <div class="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
      <!-- Left: Logo + App name -->
      <div class="flex items-center gap-3">
        <!-- Mobile menu toggle -->
        <button
          class="lg:hidden text-slate-600 hover:text-slate-900 transition-colors p-1.5 rounded-lg hover:bg-slate-100"
          @click="$emit('toggle-sidebar')"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <!-- Logo -->
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <svg class="w-4.5 h-4.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h1 class="text-lg font-bold text-slate-900 tracking-tight">
            Corp<span class="text-indigo-600">Signal</span>
          </h1>
        </div>
      </div>

      <!-- Right: User info + Logout -->
      <div v-if="isAuthenticated" class="flex items-center gap-4">
        <!-- User badge -->
        <div class="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200">
          <div class="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white">
            {{ username.charAt(0).toUpperCase() }}
          </div>
          <div class="text-sm">
            <span class="text-slate-800 font-medium">{{ username }}</span>
            <span class="text-slate-500 ml-1.5 text-xs">{{ userRole }}</span>
          </div>
        </div>

        <!-- Logout button -->
        <button
          class="text-slate-600 hover:text-rose-600 transition-colors p-2 rounded-lg hover:bg-slate-100"
          title="Logout"
          @click="handleLogout"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>
    </div>
  </header>
</template>

<script setup>
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

defineEmits(['toggle-sidebar'])

const store = useStore()
const router = useRouter()
const { isAuthenticated, username, userRole } = useAuth()

/** Logs out and redirects to login page */
const handleLogout = async () => {
  await store.dispatch('auth/logout')
  router.push('/login')
}
</script>
