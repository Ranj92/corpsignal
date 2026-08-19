<!--
  PostCard - Individual post card in the feed list.
  Features:
  - Collapsed at 3 lines by default, expandable on click
  - Unread indicator (left border accent)
  - IntersectionObserver triggers read receipt when card scrolls into view
  - Edit/Delete actions for Manager/Admin
  - Read receipt counter for Manager/Admin
-->
<template>
  <div
    ref="cardRef"
    :class="[
      'rounded-xl border bg-white backdrop-blur-sm transition-all duration-300',
      'hover:shadow-lg hover:shadow-slate-200/80',
      post.isRead
        ? 'border-slate-200'
        : `border-l-2 ${priorityConfig.borderClass} border-t-slate-200 border-r-slate-200 border-b-slate-200`
    ]"
  >
    <div class="p-5">
      <!-- Header: Priority badge + Author + Time + Actions -->
      <div class="flex items-start justify-between gap-3 mb-3">
        <div class="flex items-center gap-2 flex-wrap">
          <!-- Priority badge -->
          <BaseBadge :variant="priorityConfig.color" dot>
            {{ priorityConfig.label }}
          </BaseBadge>

          <!-- Author -->
          <span class="text-xs text-slate-500">
            by <span class="text-slate-600">{{ post.createdByUsername }}</span>
          </span>

          <!-- Timestamp -->
          <span
            class="text-xs text-slate-400"
            :title="formatFullDateTime(post.createdAt)"
          >
            · {{ formatRelativeTime(post.createdAt) }}
          </span>

          <!-- Unread dot -->
          <span
            v-if="!post.isRead"
            class="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"
            title="Unread"
          />
        </div>

        <!-- Action buttons (Manager/Admin only) -->
        <div v-if="canEditPosts" class="flex items-center gap-1 shrink-0">
          <button
            class="p-1.5 rounded-md text-slate-500 hover:text-indigo-600 hover:bg-slate-100 transition-colors"
            title="Edit post"
            @click="$emit('edit', post)"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            class="p-1.5 rounded-md text-slate-500 hover:text-rose-600 hover:bg-slate-100 transition-colors"
            title="Delete post"
            @click="$emit('delete', post.id)"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Post body (collapsible) -->
      <div
        :class="[
          'rich-content text-sm text-slate-800 transition-all duration-300 overflow-hidden',
          !isExpanded ? 'line-clamp-3' : ''
        ]"
        v-html="sanitizedBody"
      />

      <!-- Expand/Collapse toggle -->
      <button
        v-if="isLongContent"
        class="mt-2 text-xs text-indigo-600 hover:text-indigo-700 transition-colors cursor-pointer"
        @click="isExpanded = !isExpanded"
      >
        {{ isExpanded ? 'Show less' : 'Read more' }}
      </button>

      <!-- Footer: Read receipts (Manager/Admin only) -->
      <div v-if="canEditPosts" class="mt-3 pt-3 border-t border-slate-200">
        <ReadReceiptList
          :post-id="post.id"
          :read-count="post.readCount"
          :total-users="post.totalUsers"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import ReadReceiptList from './ReadReceiptList.vue'
import { useAuth } from '@/composables/useAuth'
import { useIntersectionObserver } from '@/composables/useIntersectionObserver'
import { getPriorityConfig } from '@/utils/constants'
import { formatRelativeTime, formatFullDateTime } from '@/utils/formatters'
import { useStore } from 'vuex'
import { sanitizeRichText } from '@/security/sanitizeRichText'

const props = defineProps({
  /** Post data object from the API */
  post: { type: Object, required: true }
})

defineEmits(['edit', 'delete'])

const store = useStore()
const { canEditPosts } = useAuth()

/** Template ref for the card DOM element (used by IntersectionObserver) */
const cardRef = ref(null)
/** Whether the post body is expanded */
const isExpanded = ref(false)

/** Get priority display config (label, color) from the numeric value */
const priorityConfig = computed(() => getPriorityConfig(props.post.priorityLevel))
const sanitizedBody = computed(() => sanitizeRichText(props.post.body))

/**
 * Detect if content exceeds 3 lines.
 * We use a heuristic: if the stripped text is > 200 chars or HTML contains images/lists,
 * we assume it needs collapsing.
 */
const isLongContent = computed(() => {
  const textContent = props.post.body.replace(/<[^>]*>/g, '')
  return textContent.length > 200 || props.post.body.includes('<img')
})

/**
 * IntersectionObserver for read receipts.
 * Fires when the card is ≥50% visible for ≥1 second.
 */
const { observe } = useIntersectionObserver(
  () => {
    store.dispatch('posts/markAsRead', props.post.id)
  },
  { threshold: 0.5, delay: 1000 }
)

/** Start observing when component mounts */
onMounted(() => {
  if (cardRef.value) {
    observe(cardRef.value)
  }
})
</script>

<style scoped>
/* Rich content styling for rendered HTML */
:deep(.rich-content img) {
  max-width: 100%;
  height: auto;
  border-radius: 0.5rem;
  margin: 0.5rem 0;
}
:deep(.rich-content p) {
  margin-bottom: 0.5rem;
}
:deep(.rich-content p:last-child) {
  margin-bottom: 0;
}
</style>
