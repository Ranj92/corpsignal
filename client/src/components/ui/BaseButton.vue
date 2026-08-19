<!--
  BaseButton - Reusable button component.
  Props control variant (primary/secondary/danger/ghost), size, loading state, and disabled state.
  Emits native click event. Accepts slot content for label.
-->
<template>
  <button
    :class="[baseClasses, variantClasses, sizeClasses, { 'opacity-50 cursor-not-allowed': disabled || loading }]"
    :disabled="disabled || loading"
    @click="$emit('click', $event)"
  >
    <!-- Loading spinner -->
    <svg v-if="loading" class="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
    <slot />
  </button>
</template>

<script setup>
defineProps({
  /** Visual style: 'primary' | 'secondary' | 'danger' | 'ghost' */
  variant: { type: String, default: 'primary' },
  /** Size: 'sm' | 'md' | 'lg' */
  size: { type: String, default: 'md' },
  /** Shows spinner and disables interaction */
  loading: { type: Boolean, default: false },
  /** Disables the button */
  disabled: { type: Boolean, default: false }
})

defineEmits(['click'])

const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-50 cursor-pointer'

const variantClasses = {
  primary: 'bg-indigo-600 text-white hover:bg-indigo-500 focus:ring-indigo-500 shadow-lg shadow-indigo-500/20',
  secondary: 'bg-slate-100 text-slate-800 hover:bg-slate-200 focus:ring-slate-500 border border-slate-300',
  danger: 'bg-rose-600 text-white hover:bg-rose-500 focus:ring-rose-500 shadow-lg shadow-rose-500/20',
  ghost: 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:ring-slate-500'
}

const sizeClasses = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base'
}
</script>
