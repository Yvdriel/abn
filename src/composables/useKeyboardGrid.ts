import { computed, ref, type Ref } from 'vue'

export interface UseKeyboardGridOptions {
  rowCount: Ref<number>
  itemsPerRow: Ref<number[]>
  onActivate?: (rowIndex: number, colIndex: number) => void
}

export interface UseKeyboardGridReturn {
  active: Ref<{ row: number; col: number }>
  setActive: (row: number, col: number) => void
  onKeydown: (event: KeyboardEvent) => void
  isActive: (row: number, col: number) => boolean
}

const PAGE_STEP = 5

export function useKeyboardGrid(opts: UseKeyboardGridOptions): UseKeyboardGridReturn {
  const active = ref({ row: 0, col: 0 })

  function clamp(row: number, col: number): { row: number; col: number } {
    const rows = Math.max(0, opts.rowCount.value - 1)
    const r = Math.max(0, Math.min(row, rows))
    const itemsInRow = opts.itemsPerRow.value[r] ?? 0
    const cols = Math.max(0, itemsInRow - 1)
    const c = Math.max(0, Math.min(col, cols))
    return { row: r, col: c }
  }

  function setActive(row: number, col: number): void {
    active.value = clamp(row, col)
  }

  function onKeydown(event: KeyboardEvent): void {
    let next: { row: number; col: number } | null = null
    const { row, col } = active.value
    switch (event.key) {
      case 'ArrowRight':
        next = clamp(row, col + 1)
        break
      case 'ArrowLeft':
        next = clamp(row, col - 1)
        break
      case 'ArrowDown':
        next = clamp(row + 1, col)
        break
      case 'ArrowUp':
        next = clamp(row - 1, col)
        break
      case 'Home':
        next = clamp(row, 0)
        break
      case 'End':
        next = clamp(row, Number.POSITIVE_INFINITY)
        break
      case 'PageDown':
        next = clamp(row, col + PAGE_STEP)
        break
      case 'PageUp':
        next = clamp(row, col - PAGE_STEP)
        break
      case 'Enter':
      case ' ':
        opts.onActivate?.(row, col)
        event.preventDefault()
        return
      default:
        return
    }
    if (next) {
      active.value = next
      event.preventDefault()
    }
  }

  function isActive(row: number, col: number): boolean {
    return active.value.row === row && active.value.col === col
  }

  return { active, setActive, onKeydown, isActive }
}

export interface UseSingleRowKeyboardNavOptions {
  itemCount: Ref<number>
  onActivate?: (col: number) => void
}

export interface UseSingleRowKeyboardNavReturn {
  active: Ref<number>
  setActive: (col: number) => void
  onKeydown: (event: KeyboardEvent) => void
  isActive: (col: number) => boolean
}

// Single-row convenience over `useKeyboardGrid` — used by `<GenreRow>` for
// per-row arrow-key navigation. Cross-row navigation is delegated to native
// Tab between rows; this intentionally stays narrow.
export function useSingleRowKeyboardNav(
  opts: UseSingleRowKeyboardNavOptions,
): UseSingleRowKeyboardNavReturn {
  const grid = useKeyboardGrid({
    rowCount: ref(1),
    itemsPerRow: computed(() => [opts.itemCount.value]),
    onActivate: opts.onActivate ? (_row, col) => opts.onActivate?.(col) : undefined,
  })

  const active = computed({
    get: () => grid.active.value.col,
    set: (col: number) => grid.setActive(0, col),
  })

  return {
    active,
    setActive: (col) => grid.setActive(0, col),
    onKeydown: grid.onKeydown,
    isActive: (col) => grid.isActive(0, col),
  }
}
