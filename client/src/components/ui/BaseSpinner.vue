<!--
  BaseSpinner - Animated loading spinner with configurable size.
-->
<template>
  <div :class="['flex items-center justify-center', containerClass]">
    <svg
      :class="['animate-spin text-indigo-500', sizeClass]"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
    <span v-if="label" class="ml-3 text-sm text-slate-600">{{ label }}</span>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  /** Size preset: 'sm' | 'md' | 'lg' */
  size: { type: String, default: 'md' },
  /** Optional text label next to the spinner */
  label: { type: String, default: '' },
  /** Additional classes for the container div */
  containerClass: { type: String, default: '' }
})

const sizeClass = computed(() => ({
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-10 h-10'
}[props.size] || 'w-6 h-6'))
</script>
