import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import LazyMount from '../LazyMount.vue'

let observerInstances: Array<{
  cb: IntersectionObserverCallback
  observe: ReturnType<typeof vi.fn>
  disconnect: ReturnType<typeof vi.fn>
  unobserve: ReturnType<typeof vi.fn>
}>

class FakeIntersectionObserver {
  readonly root = null
  readonly rootMargin = ''
  readonly scrollMargin = ''
  readonly thresholds: ReadonlyArray<number> = []
  observe = vi.fn<() => void>()
  disconnect = vi.fn<() => void>()
  unobserve = vi.fn<() => void>()
  takeRecords(): IntersectionObserverEntry[] {
    return []
  }
  cb: IntersectionObserverCallback
  constructor(cb: IntersectionObserverCallback) {
    this.cb = cb
    observerInstances.push({
      cb,
      observe: this.observe,
      disconnect: this.disconnect,
      unobserve: this.unobserve,
    })
  }
}

beforeEach(() => {
  observerInstances = []
  ;(
    globalThis as unknown as { IntersectionObserver: typeof IntersectionObserver }
  ).IntersectionObserver = FakeIntersectionObserver as unknown as typeof IntersectionObserver
})

afterEach(() => {
  observerInstances = []
})

describe('LazyMount', () => {
  it('does not mount the slot until intersect', async () => {
    const wrapper = mount(LazyMount, {
      props: { estimatedHeight: '300px' },
      slots: { default: '<span data-test="content">hello</span>' },
    })
    await nextTick()
    expect(wrapper.find('[data-test="content"]').exists()).toBe(false)
  })

  it('preserves estimated height before mount', async () => {
    const wrapper = mount(LazyMount, {
      props: { estimatedHeight: '300px' },
      slots: { default: '<span>x</span>' },
    })
    await nextTick()
    expect(wrapper.attributes('style')).toContain('min-height: 300px')
  })

  it('mounts the slot after intersection and stays mounted', async () => {
    const wrapper = mount(LazyMount, {
      props: { estimatedHeight: '300px' },
      slots: { default: '<span data-test="content">hello</span>' },
    })
    await nextTick()
    const obs = observerInstances[0]!
    obs.cb(
      [{ isIntersecting: true } as IntersectionObserverEntry],
      obs as unknown as IntersectionObserver,
    )
    await nextTick()
    expect(wrapper.find('[data-test="content"]').exists()).toBe(true)
    // observer disconnected after first hit
    expect(obs.disconnect).toHaveBeenCalled()
  })
})
