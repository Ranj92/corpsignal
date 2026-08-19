<!--
  BaseModal - Reusable modal dialog component.
  Uses teleport to render at the document body level.
  Closes on backdrop click and Escape key press.
-->
<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="modelValue" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <!-- Backdrop -->
        <div
          class="absolute inset-0 bg-black/60 backdrop-blur-sm"
          @click="close"
        />

        <!-- Modal content -->
        <div
          :class="[
            'relative bg-white rounded-xl border border-slate-200 shadow-2xl',
            'w-full transform transition-all',
            sizeClass
          ]"
          @keydown.escape="close"
        >
          <!-- Header -->
          <div v-if="title || $slots.header" class="flex items-center justify-between px-6 py-4 border-b border-slate-200">
            <slot name="header">
              <h3 class="text-lg font-semibold text-slate-900">{{ title }}</h3>
            </slot>
            <button
              class="text-slate-600 hover:text-slate-900 transition-colors p-1 rounded-lg hover:bg-slate-100"
              @click="close"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Body -->
          <div class="px-6 py-4">
            <slot />
          </div>

          <!-- Footer -->
          <div v-if="$slots.footer" class="px-6 py-4 border-t border-slate-200 flex justify-end gap-3">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  /** v-model controls visibility */
  modelValue: { type: Boolean, default: false },
  /** Modal title displayed in the header */
  title: { type: String, default: '' },
  /** Width preset: 'sm' | 'md' | 'lg' | 'xl' */
  size: { type: String, default: 'md' }
})

const emit = defineEmits(['update:modelValue'])

const sizeClass = computed(() => ({
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl'
}[props.size] || 'max-w-lg'))

const close = () => emit('update:modelValue', false)
</script>

<style scoped>
/* Modal enter/leave transition */
.modal-enter-active, .modal-leave-active {
  transition: opacity 0.2s ease;
}
.modal-enter-active > div:last-child, .modal-leave-active > div:last-child {
  transition: transform 0.2s ease, opacity 0.2s ease;
}
.modal-enter-from, .modal-leave-to {
  opacity: 0;
}
.modal-enter-from > div:last-child {
  transform: scale(0.95);
  opacity: 0;
}
.modal-leave-to > div:last-child {
  transform: scale(0.95);
  opacity: 0;
}
</style>
