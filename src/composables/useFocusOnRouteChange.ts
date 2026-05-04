import { nextTick, watch } from 'vue'
import { useRoute } from 'vue-router'

export function useFocusOnRouteChange(selector = '[data-route-heading]'): void {
  const route = useRoute()
  watch(
    () => route.fullPath,
    async () => {
      await nextTick()
      if (typeof document === 'undefined') return
      const target = document.querySelector<HTMLElement>(selector)
      if (target) {
        target.focus({ preventScroll: false })
      } else {
        document.body.focus()
      }
    },
  )
}
