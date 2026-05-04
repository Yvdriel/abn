import { afterEach, beforeEach, vi } from 'vitest'

class MockIntersectionObserver {
  readonly root = null
  readonly rootMargin = ''
  readonly thresholds: ReadonlyArray<number> = []
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
  takeRecords(): IntersectionObserverEntry[] {
    return []
  }
}

class MockResizeObserver {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

;(
  globalThis as unknown as { IntersectionObserver: typeof IntersectionObserver }
).IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver

;(globalThis as unknown as { ResizeObserver: typeof ResizeObserver }).ResizeObserver =
  MockResizeObserver as unknown as typeof ResizeObserver

if (typeof window !== 'undefined' && !window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn<() => void>(),
      removeEventListener: vi.fn<() => void>(),
      addListener: vi.fn<() => void>(),
      removeListener: vi.fn<() => void>(),
      dispatchEvent: vi.fn<() => boolean>(),
    }),
  })
}

if (typeof globalThis.requestAnimationFrame !== 'function') {
  globalThis.requestAnimationFrame = (cb: FrameRequestCallback): number => {
    return setTimeout(() => cb(performance.now()), 16) as unknown as number
  }
  globalThis.cancelAnimationFrame = (id: number): void => {
    clearTimeout(id as unknown as ReturnType<typeof setTimeout>)
  }
}

beforeEach(() => {
  globalThis.fetch = vi.fn<typeof fetch>() as unknown as typeof fetch
})

afterEach(() => {
  vi.restoreAllMocks()
})
