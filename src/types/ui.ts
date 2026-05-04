import type { TvMazeShow } from './tvmaze'
import type { ActiveFilter } from './filter'

export interface PageMeta {
  status: 'idle' | 'loading' | 'loaded' | 'error' | 'end'
  fetchedAt: number | null
  error?: string
}

export interface PaginatorState {
  status: 'idle' | 'streaming' | 'done' | 'paused' | 'error'
  loadedPages: number
  endPage: number | null
  lastError?: string
}

export interface DetailMeta {
  status: 'idle' | 'loading' | 'fresh' | 'stale' | 'error'
  fetchedAt: number | null
  error?: string
}

export interface ShowsState {
  byId: Record<number, TvMazeShow>
  pages: Record<number, PageMeta>
  genreIndex: Record<string, number[]>
  genreDisplayName: Record<string, string>
  // Precomputed sorted slice per genre key. Reassigned in `ingestShows` only for
  // genres whose bucket changed, so reactive consumers (GenreRow) only re-run
  // for the rows whose data actually changed.
  sortedByGenre: Record<string, TvMazeShow[]>
  // Set-like record of distinct languages seen, populated incrementally so
  // `FilterBar` doesn't have to iterate `byId` on every change.
  languages: Record<string, true>
  detailMeta: Record<number, DetailMeta>
  paginator: PaginatorState
}

export interface UiState {
  searchQuery: string
  activeFilters: ActiveFilter[]
}

export interface ScoredShow {
  show: TvMazeShow
  score: number
  source: 'local' | 'remote'
}
