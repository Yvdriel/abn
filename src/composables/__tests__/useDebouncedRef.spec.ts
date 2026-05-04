import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { effectScope, ref } from 'vue'
import { useDebouncedRef } from '../useDebouncedRef'

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useDebouncedRef', () => {
  it('trails source after delay', async () => {
    const scope = effectScope()
    const source = ref('a')
    let debounced!: { value: string }
    scope.run(() => {
      debounced = useDebouncedRef(source, 100)
    })
    expect(debounced.value).toBe('a')
    source.value = 'b'
    await vi.advanceTimersByTimeAsync(50)
    expect(debounced.value).toBe('a')
    await vi.advanceTimersByTimeAsync(60)
    expect(debounced.value).toBe('b')
    scope.stop()
  })

  it('cancels pending update on rapid changes', async () => {
    const scope = effectScope()
    const source = ref('a')
    let debounced!: { value: string }
    scope.run(() => {
      debounced = useDebouncedRef(source, 100)
    })
    source.value = 'b'
    await vi.advanceTimersByTimeAsync(50)
    source.value = 'c'
    await vi.advanceTimersByTimeAsync(50)
    expect(debounced.value).toBe('a')
    await vi.advanceTimersByTimeAsync(60)
    expect(debounced.value).toBe('c')
    scope.stop()
  })

  it('cleans up the timer on scope dispose', async () => {
    const scope = effectScope()
    const source = ref('a')
    let debounced!: { value: string }
    scope.run(() => {
      debounced = useDebouncedRef(source, 100)
    })
    source.value = 'b'
    scope.stop()
    await vi.advanceTimersByTimeAsync(200)
    expect(debounced.value).toBe('a')
  })
})
