<!--
  BasePagination - Page navigation component.
  Emits page change events; supports first/last/prev/next shortcuts.
-->
<template>
  <div v-if="totalPages > 1" class="flex items-center justify-center gap-1">
    <!-- Previous page -->
    <button
      :disabled="currentPage <= 1"
      class="px-3 py-2 text-sm rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      @click="$emit('page-change', currentPage - 1)"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
      </svg>
    </button>

    <!-- Page numbers -->
    <template v-for="page in visiblePages" :key="page">
      <span v-if="page === '...'" class="px-2 py-2 text-sm text-slate-500">...</span>
      <button
        v-else
        :class="[
          'px-3 py-2 text-sm rounded-lg transition-all duration-200',
          page === currentPage
            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
        ]"
        @click="$emit('page-change', page)"
      >
        {{ page }}
      </button>
    </template>

    <!-- Next page -->
    <button
      :disabled="currentPage >= totalPages"
      class="px-3 py-2 text-sm rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      @click="$emit('page-change', currentPage + 1)"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
      </svg>
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  currentPage: { type: Number, required: true },
  totalPages: { type: Number, required: true }
})

defineEmits(['page-change'])

/**
 * Computes which page numbers to show.
 * Shows first, last, current ±1, and ellipsis for gaps.
 */
const visiblePages = computed(() => {
  const pages = []
  const total = props.totalPages
  const current = props.currentPage

  if (total <= 7) {
    // Show all pages if 7 or fewer
    for (let i = 1; i <= total; i++) pages.push(i)
  } else {
    pages.push(1)
    if (current > 3) pages.push('...')

    const start = Math.max(2, current - 1)
    const end = Math.min(total - 1, current + 1)

    for (let i = start; i <= end; i++) pages.push(i)

    if (current < total - 2) pages.push('...')
    pages.push(total)
  }

  return pages
})
</script>
