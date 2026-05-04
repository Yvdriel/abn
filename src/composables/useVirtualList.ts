import { computed, onScopeDispose, ref, watch, type ComputedRef, type Ref } from 'vue'

export interface UseVirtualListOptions<T> {
  items: Ref<readonly T[]>
  itemSize: number
  containerRef: Ref<HTMLElement | null>
  axis?: 'x' | 'y'
  buffer?: number
  gap?: number
}

export interface VirtualWindowItem<T> {
  index: number
  item: T
}

export interface UseVirtualListReturn<T> {
  windowItems: ComputedRef<VirtualWindowItem<T>[]>
  contentSize: ComputedRef<number>
  offset: ComputedRef<number>
  scrollTo: (index: number, behavior?: ScrollBehavior) => void
}

export function useVirtualList<T>(opts: UseVirtualListOptions<T>): UseVirtualListReturn<T> {
  const axis = opts.axis ?? 'y'
  const buffer = opts.buffer ?? 3
  const gap = opts.gap ?? 0
  const stride = opts.itemSize + gap

  const scrollPos = ref(0)
  const viewport = ref(0)

  let rafId: number | null = null
  let resizeObserver: ResizeObserver | null = null

  function readScroll(el: HTMLElement): void {
    scrollPos.value = axis === 'x' ? el.scrollLeft : el.scrollTop
  }
  function readViewport(el: HTMLElement): void {
    viewport.value = axis === 'x' ? el.clientWidth : el.clientHeight
  }

  function onScroll(): void {
    const el = opts.containerRef.value
    if (!el) return
    if (rafId !== null) return
    rafId = requestAnimationFrame(() => {
      rafId = null
      readScroll(el)
    })
  }

  watch(
    () => opts.containerRef.value,
    (el, prevEl) => {
      if (prevEl) {
        prevEl.removeEventListener('scroll', onScroll)
      }
      if (resizeObserver) {
        resizeObserver.disconnect()
        resizeObserver = null
      }
      if (!el) return
      readScroll(el)
      readViewport(el)
      el.addEventListener('scroll', onScroll, { passive: true })
      if (typeof ResizeObserver !== 'undefined') {
        resizeObserver = new ResizeObserver(() => readViewport(el))
        resizeObserver.observe(el)
      }
    },
    { immediate: true, flush: 'post' },
  )

  const startIndex = computed(() => {
    if (stride <= 0) return 0
    return Math.max(0, Math.floor(scrollPos.value / stride) - buffer)
  })

  const endIndex = computed(() => {
    if (stride <= 0) return opts.items.value.length
    const visible = Math.ceil(viewport.value / stride)
    return Math.min(opts.items.value.length, startIndex.value + visible + buffer * 2)
  })

  const windowItems = computed<VirtualWindowItem<T>[]>(() => {
    const result: VirtualWindowItem<T>[] = []
    const items = opts.items.value
    for (let i = startIndex.value; i < endIndex.value; i++) {
      const item = items[i]
      if (item !== undefined) result.push({ index: i, item })
    }
    return result
  })

  const contentSize = computed(() => {
    const n = opts.items.value.length
    if (n === 0) return 0
    return n * opts.itemSize + (n - 1) * gap
  })

  const offset = computed(() => startIndex.value * stride)

  function scrollTo(index: number, behavior: ScrollBehavior = 'auto'): void {
    const el = opts.containerRef.value
    if (!el) return
    const target = index * stride
    if (axis === 'x') el.scrollTo({ left: target, behavior })
    else el.scrollTo({ top: target, behavior })
  }

  onScopeDispose(() => {
    if (rafId !== null) cancelAnimationFrame(rafId)
    if (resizeObserver) resizeObserver.disconnect()
    const el = opts.containerRef.value
    if (el) el.removeEventListener('scroll', onScroll)
  })

  return { windowItems, contentSize, offset, scrollTo }
}
