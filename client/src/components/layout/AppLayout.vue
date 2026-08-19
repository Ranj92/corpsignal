<!--
  AppLayout - Main application layout shell.
  Wraps all authenticated pages with header, sidebar, and content area.
  Includes toast notification container.
-->
<template>
  <div class="min-h-screen bg-slate-50">
    <!-- Header -->
    <AppHeader @toggle-sidebar="sidebarOpen = !sidebarOpen" />

    <div class="flex">
      <!-- Sidebar -->
      <AppSidebar :is-open="sidebarOpen" @close="sidebarOpen = false" />

      <!-- Main content area -->
      <main class="flex-1 min-h-[calc(100vh-4rem)] p-4 sm:p-6 lg:p-8 lg:ml-0">
        <div class="max-w-5xl mx-auto">
          <slot />
        </div>
      </main>
    </div>

    <!-- Toast notifications -->
    <div class="fixed bottom-4 right-4 z-50 space-y-2 max-w-sm">
      <TransitionGroup name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          :class="[
            'px-4 py-3 rounded-lg border shadow-xl backdrop-blur-sm text-sm flex items-center gap-2',
            toastClasses[toast.type]
          ]"
        >
          <span class="flex-1">{{ toast.message }}</span>
          <button class="opacity-60 hover:opacity-100" @click="removeToast(toast.id)">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </TransitionGroup>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import AppHeader from './AppHeader.vue'
import AppSidebar from './AppSidebar.vue'
import { useToast } from '@/composables/useToast'

/** Mobile sidebar open state */
const sidebarOpen = ref(false)
const { toasts, removeToast } = useToast()

/** Toast type → Tailwind classes mapping */
const toastClasses = {
  success: 'bg-emerald-50 border-emerald-500/30 text-emerald-800',
  error: 'bg-rose-50 border-rose-500/30 text-rose-800',
  info: 'bg-indigo-50 border-indigo-500/30 text-indigo-800',
  warning: 'bg-amber-50 border-amber-500/30 text-amber-800'
}
</script>

<style scoped>
/* Toast slide-in transition */
.toast-enter-active { transition: all 0.3s ease-out; }
.toast-leave-active { transition: all 0.2s ease-in; }
.toast-enter-from { transform: translateX(100%); opacity: 0; }
.toast-leave-to { transform: translateX(100%); opacity: 0; }
</style>
