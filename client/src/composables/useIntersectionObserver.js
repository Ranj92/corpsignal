/**
 * Composable: useIntersectionObserver
 * Wraps the browser IntersectionObserver API for tracking when elements scroll into view.
 * Used by PostCard to trigger read receipts when ≥50% of the card is visible for ≥1 second.
 */
import { onUnmounted, ref } from 'vue'

/**
 * @param {Function} callback - Called once when the element becomes visible
 * @param {Object} options - IntersectionObserver options
 * @param {number} options.threshold - Visibility threshold (0-1), default 0.5 (50%)
 * @param {number} options.delay - Milliseconds the element must stay visible, default 1000
 */
export function useIntersectionObserver(callback, options = {}) {
  const { threshold = 0.5, delay = 1000 } = options

  /** Whether the callback has fired (one-time trigger) */
  const hasTriggered = ref(false)
  let timer = null
  let observer = null

  /**
   * Starts observing a DOM element.
   * Call with the template ref's value after mount.
   */
  const observe = (element) => {
    if (!element || hasTriggered.value) return

    observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]

        if (entry.isIntersecting && !hasTriggered.value) {
          // Element is visible — start the delay timer
          timer = setTimeout(() => {
            if (!hasTriggered.value) {
              hasTriggered.value = true
              callback()
              // Stop observing after trigger
              if (observer) observer.disconnect()
            }
          }, delay)
        } else {
          // Element scrolled out of view — cancel the timer
          clearTimeout(timer)
        }
      },
      { threshold }
    )

    observer.observe(element)
  }

  /** Stops observing and cleans up */
  const disconnect = () => {
    clearTimeout(timer)
    if (observer) {
      observer.disconnect()
      observer = null
    }
  }

  // Cleanup on component unmount
  onUnmounted(() => {
    disconnect()
  })

  return {
    observe,
    disconnect,
    hasTriggered
  }
}
