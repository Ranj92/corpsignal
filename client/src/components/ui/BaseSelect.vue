<!--
  BaseSelect - Reusable select dropdown component.
  Supports v-model, labels, error messages, and custom options.
-->
<template>
  <div class="space-y-1.5">
    <label v-if="label" :for="selectId" class="block text-sm font-medium text-slate-700">
      {{ label }}
    </label>

    <select
      :id="selectId"
      :value="modelValue"
      :disabled="disabled"
      :class="[
        'w-full rounded-lg border bg-white px-4 py-2.5 text-sm text-slate-900',
        'transition-all duration-200 appearance-none cursor-pointer',
        'focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-slate-50',
        error
          ? 'border-rose-500/50 focus:ring-rose-500/30'
          : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/30',
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      ]"
      @change="$emit('update:modelValue', $event.target.value)"
    >
      <option v-if="placeholder" value="" disabled>{{ placeholder }}</option>
      <option
        v-for="option in options"
        :key="option.value"
        :value="option.value"
        class="bg-white"
      >
        {{ option.label }}
      </option>
    </select>

    <p v-if="error" class="text-xs text-rose-600">{{ error }}</p>
  </div>
</template>

<script setup>
defineProps({
  modelValue: { type: [String, Number], default: '' },
  /** Array of { value, label } objects */
  options: { type: Array, default: () => [] },
  label: { type: String, default: '' },
  placeholder: { type: String, default: '' },
  disabled: { type: Boolean, default: false },
  error: { type: String, default: '' },
  selectId: { type: String, default: () => `select-${Math.random().toString(36).slice(2, 9)}` }
})

defineEmits(['update:modelValue'])
</script>
