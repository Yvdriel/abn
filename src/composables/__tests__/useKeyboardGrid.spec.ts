import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { useKeyboardGrid } from '../useKeyboardGrid'

function key(name: string): KeyboardEvent {
  return new KeyboardEvent('keydown', { key: name })
}

describe('useKeyboardGrid', () => {
  it('ArrowRight increments col within bounds', () => {
    const grid = useKeyboardGrid({
      rowCount: ref(2),
      itemsPerRow: ref([3, 3]),
    })
    grid.setActive(0, 0)
    grid.onKeydown(key('ArrowRight'))
    expect(grid.active.value).toEqual({ row: 0, col: 1 })
  })

  it('ArrowDown increments row', () => {
    const grid = useKeyboardGrid({
      rowCount: ref(2),
      itemsPerRow: ref([3, 3]),
    })
    grid.setActive(0, 1)
    grid.onKeydown(key('ArrowDown'))
    expect(grid.active.value).toEqual({ row: 1, col: 1 })
  })

  it('Home jumps to col 0; End jumps to last col', () => {
    const grid = useKeyboardGrid({
      rowCount: ref(1),
      itemsPerRow: ref([5]),
    })
    grid.setActive(0, 2)
    grid.onKeydown(key('Home'))
    expect(grid.active.value.col).toBe(0)
    grid.onKeydown(key('End'))
    expect(grid.active.value.col).toBe(4)
  })

  it('Enter calls onActivate with current cell', () => {
    const onActivate = vi.fn<(row: number, col: number) => void>()
    const grid = useKeyboardGrid({
      rowCount: ref(1),
      itemsPerRow: ref([3]),
      onActivate,
    })
    grid.setActive(0, 1)
    grid.onKeydown(key('Enter'))
    expect(onActivate).toHaveBeenCalledWith(0, 1)
  })

  it('clamps at row/col boundaries', () => {
    const grid = useKeyboardGrid({
      rowCount: ref(2),
      itemsPerRow: ref([3, 3]),
    })
    grid.setActive(0, 0)
    grid.onKeydown(key('ArrowLeft'))
    expect(grid.active.value).toEqual({ row: 0, col: 0 })
    grid.setActive(1, 2)
    grid.onKeydown(key('ArrowRight'))
    expect(grid.active.value).toEqual({ row: 1, col: 2 })
    grid.onKeydown(key('ArrowDown'))
    expect(grid.active.value).toEqual({ row: 1, col: 2 })
  })

  it('PageDown skips by page step', () => {
    const grid = useKeyboardGrid({
      rowCount: ref(1),
      itemsPerRow: ref([20]),
    })
    grid.setActive(0, 2)
    grid.onKeydown(key('PageDown'))
    expect(grid.active.value.col).toBe(7)
  })
})
