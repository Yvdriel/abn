import { onScopeDispose, ref, type Ref } from 'vue'

export function usePrefersReducedMotion(): Ref<boolean> {
  const reduced = ref(false)
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return reduced
  }
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
  reduced.value = mq.matches

  const handler = (e: MediaQueryListEvent): void => {
    reduced.value = e.matches
  }

  if (typeof mq.addEventListener === 'function') {
    mq.addEventListener('change', handler)
    onScopeDispose(() => mq.removeEventListener('change', handler))
  }
  return reduced
}
