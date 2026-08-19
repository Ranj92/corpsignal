<!--
  BaseCard - Reusable card container with optional header, hover effects, and padding control.
-->
<template>
  <div
    :class="[
      'rounded-xl border border-slate-200 bg-white backdrop-blur-sm',
      'transition-all duration-300',
      hoverable ? 'hover:border-slate-300 hover:shadow-lg hover:shadow-slate-200/80' : '',
      noPadding ? '' : 'p-5'
    ]"
  >
    <slot />
  </div>
</template>

<script setup>
defineProps({
  /** Enable hover effects (border highlight + shadow) */
  hoverable: { type: Boolean, default: false },
  /** Remove default padding (for custom layouts) */
  noPadding: { type: Boolean, default: false }
})
</script>
