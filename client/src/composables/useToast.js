/**
 * Composable: useToast
 * Simple toast notification system using reactive state.
 * Toasts auto-dismiss after a configurable duration.
 */
import { reactive } from 'vue'

/** Global toast state — shared across all components that use this composable */
const toasts = reactive([])

let toastId = 0

export function useToast() {
  /**
   * Shows a toast notification.
   * @param {string} message - The message to display
   * @param {'success'|'error'|'info'|'warning'} type - Toast type for styling
   * @param {number} duration - Auto-dismiss delay in ms (default: 3000)
   */
  const showToast = (message, type = 'info', duration = 3000) => {
    const id = ++toastId

    toasts.push({ id, message, type })

    // Auto-dismiss after duration
    setTimeout(() => {
      removeToast(id)
    }, duration)
  }

  /** Manually dismiss a toast */
  const removeToast = (id) => {
    const index = toasts.findIndex(t => t.id === id)
    if (index !== -1) {
      toasts.splice(index, 1)
    }
  }

  // Convenience methods
  const success = (msg, duration) => showToast(msg, 'success', duration)
  const error = (msg, duration) => showToast(msg, 'error', duration || 5000)
  const info = (msg, duration) => showToast(msg, 'info', duration)
  const warning = (msg, duration) => showToast(msg, 'warning', duration)

  return {
    toasts,
    showToast,
    removeToast,
    success,
    error,
    info,
    warning
  }
}
