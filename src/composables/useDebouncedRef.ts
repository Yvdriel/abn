import { onScopeDispose, ref, watch, type Ref } from 'vue'

export function useDebouncedRef<T>(source: Ref<T>, delayMs: number): Ref<T> {
  const debounced = ref(source.value) as Ref<T>
  let timer: ReturnType<typeof setTimeout> | null = null

  const stop = watch(source, (value) => {
    if (timer !== null) clearTimeout(timer)
    timer = setTimeout(() => {
      debounced.value = value
      timer = null
    }, delayMs)
  })

  onScopeDispose(() => {
    if (timer !== null) clearTimeout(timer)
    stop()
  })

  return debounced
}
