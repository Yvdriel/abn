import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { effectScope, nextTick, ref } from 'vue'
import { useVirtualList } from '../useVirtualList'

function makeContainer(width: number, height: number): HTMLElement {
  const el = document.createElement('div')
  Object.defineProperty(el, 'clientWidth', { configurable: true, value: width })
  Object.defineProperty(el, 'clientHeight', { configurable: true, value: height })
  let left = 0
  let top = 0
  Object.defineProperty(el, 'scrollLeft', {
    configurable: true,
    get: () => left,
    set: (v: number) => {
      left = v
    },
  })
  Object.defineProperty(el, 'scrollTop', {
    configurable: true,
    get: () => top,
    set: (v: number) => {
      top = v
    },
  })
  el.scrollTo = (opts) => {
    if (typeof opts === 'object' && opts) {
      if (opts.left !== undefined) left = opts.left
      if (opts.top !== undefined) top = opts.top
    }
  }
  return el
}

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useVirtualList', () => {
  it('windowItems is a slice based on viewport + buffer', async () => {
    const scope = effectScope()
    const container = ref<HTMLElement | null>(makeContainer(500, 0))
    const items = ref(Array.from({ length: 50 }, (_, i) => `item-${i}`))
    let v!: ReturnType<typeof useVirtualList<string>>
    scope.run(() => {
      v = useVirtualList({
        items,
        itemSize: 100,
        containerRef: container,
        axis: 'x',
        buffer: 2,
      })
    })
    await nextTick()
    // viewport 500 / itemSize 100 = 5 visible, plus buffer 2*2 = 9 max
    expect(v.windowItems.value.length).toBeLessThanOrEqual(9)
    expect(v.windowItems.value[0]?.index).toBe(0)
    scope.stop()
  })

  it('contentSize equals items × itemSize + gaps', () => {
    const scope = effectScope()
    const container = ref<HTMLElement | null>(makeContainer(500, 0))
    const items = ref(Array.from({ length: 10 }, (_, i) => i))
    let v!: ReturnType<typeof useVirtualList<number>>
    scope.run(() => {
      v = useVirtualList({
        items,
        itemSize: 100,
        gap: 8,
        containerRef: container,
        axis: 'x',
      })
    })
    expect(v.contentSize.value).toBe(10 * 100 + 9 * 8)
    scope.stop()
  })

  it('scrollTo updates the container scroll position', () => {
    const scope = effectScope()
    const el = makeContainer(500, 0)
    const container = ref<HTMLElement | null>(el)
    const items = ref(Array.from({ length: 50 }, (_, i) => i))
    let v!: ReturnType<typeof useVirtualList<number>>
    scope.run(() => {
      v = useVirtualList({
        items,
        itemSize: 100,
        containerRef: container,
        axis: 'x',
      })
    })
    v.scrollTo(10)
    expect(el.scrollLeft).toBe(1000)
    scope.stop()
  })
})
