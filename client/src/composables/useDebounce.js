/**
 * Composable: useDebounce
 * Returns a debounced ref that updates after the specified delay.
 * Useful for search inputs to avoid firing API calls on every keystroke.
 */
import { ref, watch } from 'vue'

export function useDebounce(initialValue = '', delay = 300) {
  /** The immediate value (updates on every keystroke) */
  const value = ref(initialValue)
  /** The debounced value (updates after delay ms of inactivity) */
  const debouncedValue = ref(initialValue)

  let timeout = null

  watch(value, (newValue) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => {
      debouncedValue.value = newValue
    }, delay)
  })

  return {
    value,
    debouncedValue
  }
}
