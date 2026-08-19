<!--
  BaseAlert - Inline alert/message component for feedback.
  Used for form errors, success messages, and informational notices.
-->
<template>
  <div
    :class="[
      'rounded-lg border px-4 py-3 text-sm flex items-start gap-3',
      variantClasses
    ]"
    role="alert"
  >
    <!-- Icon -->
    <svg class="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path v-if="type === 'error'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      <path v-else-if="type === 'success'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      <path v-else-if="type === 'warning'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
      <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>

    <div class="flex-1">
      <slot />
    </div>

    <!-- Dismiss button -->
    <button
      v-if="dismissible"
      class="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
      @click="$emit('dismiss')"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  /** Alert type: 'info' | 'success' | 'warning' | 'error' */
  type: { type: String, default: 'info' },
  /** Show a dismiss button */
  dismissible: { type: Boolean, default: false }
})

defineEmits(['dismiss'])

const variantClasses = computed(() => ({
  info: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-700',
  success: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800',
  warning: 'bg-amber-500/10 border-amber-500/30 text-amber-800',
  error: 'bg-rose-500/10 border-rose-500/30 text-rose-800'
}[props.type] || 'bg-indigo-500/10 border-indigo-500/30 text-indigo-700'))
</script>
