<!--
  ReadReceiptList - Displays who has read a post and when.
  Visible to Manager and Admin roles only.
  Shows user avatars, usernames, and read timestamps.
-->
<template>
  <div class="space-y-2">
    <button
      class="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
      @click="toggleOpen"
    >
      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
      <span>Read by {{ readCount }}/{{ totalUsers }}</span>
      <svg
        :class="['w-3 h-3 transition-transform', isOpen ? 'rotate-180' : '']"
        fill="none" stroke="currentColor" viewBox="0 0 24 24"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </button>

    <!-- Receipt list (collapsible) -->
    <Transition name="slide">
      <div v-if="isOpen && receipts.length > 0" class="pl-2 space-y-1.5">
        <div
          v-for="receipt in receipts"
          :key="receipt.id"
          class="flex items-center gap-2 text-xs"
        >
          <!-- User avatar -->
          <div class="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-700">
            {{ receipt.username.charAt(0).toUpperCase() }}
          </div>
          <span class="text-slate-700">{{ receipt.username }}</span>
          <span class="text-slate-400">·</span>
          <span class="text-slate-500" :title="formatFullDateTime(receipt.readAt)">
            {{ formatRelativeTime(receipt.readAt) }}
          </span>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import readReceiptsApi from '@/api/readReceiptsApi'
import { formatRelativeTime, formatFullDateTime } from '@/utils/formatters'

const props = defineProps({
  /** Post ID to fetch receipts for */
  postId: { type: String, required: true },
  /** Pre-computed read count */
  readCount: { type: Number, default: 0 },
  /** Total user count */
  totalUsers: { type: Number, default: 0 }
})

const isOpen = ref(false)
const receipts = ref([])
const loaded = ref(false)

/** Toggle receipt list — fetches on first open */
const toggleOpen = async () => {
  isOpen.value = !isOpen.value

  // Fetch receipts on first open
  if (isOpen.value && !loaded.value) {
    try {
      receipts.value = await readReceiptsApi.getReceipts(props.postId)
      loaded.value = true
    } catch {
      // Silently fail — non-critical feature
    }
  }
}

/** Reset when postId changes (e.g. list re-renders) */
watch(() => props.postId, () => {
  loaded.value = false
  receipts.value = []
  isOpen.value = false
})
</script>

<style scoped>
.slide-enter-active { transition: all 0.2s ease-out; }
.slide-leave-active { transition: all 0.15s ease-in; }
.slide-enter-from, .slide-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
