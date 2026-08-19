<!--
  PostFilters - Search bar + priority filter controls.
  Debounced search (300ms) and priority toggle buttons.
  Updates Vuex filters which trigger a re-fetch.
-->
<template>
  <div class="flex flex-col sm:flex-row gap-3">
    <!-- Search input -->
    <div class="relative flex-1">
      <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        v-model="searchValue"
        type="text"
        placeholder="Search posts..."
        class="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
      />
      <!-- Clear search button -->
      <button
        v-if="searchValue"
        class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 transition-colors"
        @click="searchValue = ''"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <!-- Priority filter buttons -->
    <div class="flex gap-1.5">
      <!-- "All" button -->
      <button
        :class="[
          'px-3 py-2 rounded-lg text-xs font-medium border transition-all duration-200 cursor-pointer',
          activePriority === null
            ? 'bg-indigo-600/20 text-indigo-600 border-indigo-500/30'
            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
        ]"
        @click="setPriority(null)"
      >
        All
      </button>

      <!-- Priority level buttons -->
      <button
        v-for="p in PRIORITIES"
        :key="p.value"
        :class="[
          'px-3 py-2 rounded-lg text-xs font-medium border transition-all duration-200 cursor-pointer',
          activePriority === p.value
            ? `${p.bgClass} ${p.textClass} ${p.borderClass}`
            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
        ]"
        @click="setPriority(p.value)"
      >
        {{ p.label }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed, watch } from 'vue'
import { useStore } from 'vuex'
import { useDebounce } from '@/composables/useDebounce'
import { PRIORITIES } from '@/utils/constants'

const store = useStore()

/** Debounced search — fires after 300ms of inactivity */
const { value: searchValue, debouncedValue: debouncedSearch } = useDebounce('', 300)

/** Current active priority filter from Vuex */
const activePriority = computed(() => store.state.posts.filters.priority)

/** Set priority filter in Vuex (triggers re-fetch) */
const setPriority = (priority) => {
  store.dispatch('posts/setFilters', { priority })
}

/** Watch debounced search and update Vuex filters */
watch(debouncedSearch, (newSearch) => {
  store.dispatch('posts/setFilters', { search: newSearch })
})
</script>
