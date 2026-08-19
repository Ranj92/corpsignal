<!--
  BaseBadge - Reusable badge/pill component for labels and statuses.
  Used for priority labels, role badges, and read status indicators.
-->
<template>
  <span
    :class="[
      'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold',
      'border transition-colors',
      variantClasses
    ]"
  >
    <!-- Optional dot indicator -->
    <span v-if="dot" :class="['w-1.5 h-1.5 rounded-full', dotClass]" />
    <slot />
  </span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  /** Color variant: 'emerald' | 'amber' | 'rose' | 'indigo' | 'slate' */
  variant: { type: String, default: 'slate' },
  /** Show a small dot indicator before the text */
  dot: { type: Boolean, default: false }
})

const variantClasses = computed(() => ({
  emerald: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30',
  amber: 'bg-amber-500/10 text-amber-700 border-amber-500/30',
  rose: 'bg-rose-500/10 text-rose-600 border-rose-500/30',
  indigo: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/30',
  slate: 'bg-slate-500/10 text-slate-600 border-slate-500/30'
}[props.variant] || 'bg-slate-500/10 text-slate-600 border-slate-500/30'))

const dotClass = computed(() => ({
  emerald: 'bg-emerald-400',
  amber: 'bg-amber-400',
  rose: 'bg-rose-400',
  indigo: 'bg-indigo-400',
  slate: 'bg-slate-400'
}[props.variant] || 'bg-slate-400'))
</script>
