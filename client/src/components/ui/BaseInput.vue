<!--
  BaseInput - Reusable text input component.
  Supports v-model, labels, error messages, icons, and password toggle.
-->
<template>
  <div class="space-y-1.5">
    <!-- Label -->
    <label v-if="label" :for="inputId" class="block text-sm font-medium text-slate-700">
      {{ label }}
    </label>

    <div class="relative">
      <!-- Input field -->
      <input
        :id="inputId"
        :type="computedType"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :class="[
          'w-full rounded-lg border bg-white px-4 py-2.5 text-sm text-slate-900',
          'placeholder-slate-500 transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-slate-50',
          error
            ? 'border-rose-500/50 focus:ring-rose-500/30'
            : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/30',
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        ]"
        @input="$emit('update:modelValue', $event.target.value)"
      />

      <!-- Password visibility toggle -->
      <button
        v-if="type === 'password'"
        type="button"
        class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 transition-colors"
        @click="showPassword = !showPassword"
      >
        <!-- Eye icon -->
        <svg v-if="!showPassword" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
        <!-- Eye-off icon -->
        <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
        </svg>
      </button>
    </div>

    <!-- Error message -->
    <p v-if="error" class="text-xs text-rose-600">{{ error }}</p>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  modelValue: { type: [String, Number], default: '' },
  label: { type: String, default: '' },
  type: { type: String, default: 'text' },
  placeholder: { type: String, default: '' },
  disabled: { type: Boolean, default: false },
  error: { type: String, default: '' },
  /** Unique ID for label association */
  inputId: { type: String, default: () => `input-${Math.random().toString(36).slice(2, 9)}` }
})

defineEmits(['update:modelValue'])

const showPassword = ref(false)
const computedType = computed(() => {
  if (props.type === 'password') return showPassword.value ? 'text' : 'password'
  return props.type
})
</script>
