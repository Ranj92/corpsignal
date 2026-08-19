<!--
  AppSidebar - Navigation sidebar.
  Shows navigation links based on user role.
  Collapsible on mobile via overlay.
-->
<template>
  <!-- Mobile overlay -->
  <div
    v-if="isOpen"
    class="fixed inset-0 z-30 bg-slate-900/30 lg:hidden"
    @click="$emit('close')"
  />

  <!-- Sidebar -->
  <aside
    :class="[
      'fixed top-16 left-0 z-30 h-[calc(100vh-4rem)] w-64 bg-white/95 backdrop-blur-xl border-r border-slate-200',
      'transform transition-transform duration-300 ease-in-out',
      'lg:translate-x-0 lg:static lg:z-auto',
      isOpen ? 'translate-x-0' : '-translate-x-full'
    ]"
  >
    <nav class="p-4 space-y-1">
      <!-- Posts link — visible to all roles -->
      <router-link
        to="/posts"
        class="nav-link"
        active-class="nav-link-active"
        @click="$emit('close')"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
        </svg>
        <span>Posts</span>
      </router-link>

      <!-- Users link — Manager only -->
      <router-link
        v-if="canEditUsers"
        to="/users"
        class="nav-link"
        active-class="nav-link-active"
        @click="$emit('close')"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
        <span>Users</span>
      </router-link>
    </nav>

    <!-- Version info at bottom -->
    <div class="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-200">
      <p class="text-xs text-slate-400 text-center">CorpSignal v1.0</p>
    </div>
  </aside>
</template>

<script setup>
import { useAuth } from '@/composables/useAuth'

defineProps({
  /** Whether the sidebar is visible on mobile */
  isOpen: { type: Boolean, default: false }
})

defineEmits(['close'])

const { canEditUsers } = useAuth()
</script>

<style scoped>
@reference "tailwindcss";
.nav-link {
  @apply flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all duration-200;
}
.nav-link-active {
  @apply bg-indigo-600/10 text-indigo-600 border border-indigo-500/20;
}
</style>
