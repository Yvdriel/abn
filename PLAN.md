# PLAN — ABN AMRO Senior Frontend Take-home: TV Show Dashboard

> Plan-mode constraint: this file is written to `/Users/yoran/.claude/plans/claude-code-planning-agile-pnueli.md`. The user's prompt asks for `./PLAN.md` at the project root. After exiting plan mode, copy this file to `/Users/yoran/Projects/abn-amro/abn-amro/PLAN.md` (or have me rewrite it there in the first implementation turn).

## Context

The project at `/Users/yoran/Projects/abn-amro/abn-amro` is a fresh Vue 3 + TS + Vite + Pinia + Tailwind v4 + Vitest scaffold. We are implementing the TVMaze dashboard described in the user's briefing under hard constraints: **no scaffolding kits, no UI libraries, no `lodash`/`vueuse`/`fuse.js`/`dompurify`/virtualization libs/date libs**, with WCAG 2.1 AA + URL-driven shareable state as bonus features. The bar is "defensible to a senior reviewer at a Dutch bank."

This plan freezes file paths, type shapes, function signatures, component contracts, routing, tests, sequencing, and risks. Implementation phase should be mostly mechanical translation of this document.

---

## 1. Repo audit

### 1.1 Project location

The Vue project is **nested**: `/Users/yoran/Projects/abn-amro/abn-amro/`. The outer `abn-amro/` directory only contains `.zed/` and the nested project. All work happens inside the nested folder; do not flatten unless instructed (would break `.zed` workspace and pnpm lockfile relative paths).

### 1.2 Stack already installed (no changes needed)

`vue@3.5.32`, `vue-router@5.0.4`, `pinia@3.0.4`, `vite@8.0.8`, `@vitejs/plugin-vue@6.0.6`, `vite-plugin-vue-devtools@8.1.1`, `tailwindcss@4.2.4` + `@tailwindcss/vite@4.2.4`, `typescript@~6.0.0`, `vue-tsc@3.2.6`, `vitest@4.1.4`, `@vue/test-utils@2.4.6`, `jsdom@29.0.2`, `@types/jsdom`, `@types/node@24.12.2`, `@tsconfig/node24`, `@vue/tsconfig`. Linting: `eslint`, `oxlint`, `oxfmt`, `eslint-config-prettier`, `eslint-plugin-vue`, `@vue/eslint-config-typescript`, `@vitest/eslint-plugin`, `eslint-plugin-oxlint`. Build helpers: `npm-run-all2`, `jiti`.

Package manager: **pnpm** (`pnpm-lock.yaml` present). Use `pnpm` everywhere, never `npm`.

Node engines: `^20.19.0 || >=22.12.0`. README/run instructions must mirror this.

### 1.3 Config in place

- `tsconfig.app.json`: extends `@vue/tsconfig/tsconfig.dom.json` (which sets `strict: true`), adds `noUncheckedIndexedAccess: true`, alias `@/* → ./src/*`, **excludes** `src/**/__tests__/*`.
- `tsconfig.vitest.json`: extends `tsconfig.app.json`, **only includes** `src/**/__tests__/*` and `env.d.ts`, types `["node", "jsdom"]`.
- `tsconfig.node.json`: for config files only (`vite.config.*`, etc.).
- `vite.config.ts`: plugins `vue()`, `vueDevTools()`, `tailwindcss()`; alias `@ → ./src`. No test block (vitest has its own config).
- `vitest.config.ts`: `mergeConfig(viteConfig, …)`, environment `jsdom`, excludes `e2e/**`. **No `setupFiles`, no coverage block** — both must be added.
- Tailwind v4: no `tailwind.config.*` file; activated via `@tailwindcss/vite` and `@import 'tailwindcss';` in `src/main.css`. v4 customisation is via `@theme` CSS blocks, not a JS config — plan accordingly.
- `eslint.config.ts`: flat config combining vue-ts + oxlint plugin + vitest plugin + prettier-disable. Will lint our new code as-is.
- `.oxfmtrc.json`: `semi: false`, `singleQuote: true`. **All new code must be no-semicolon + single-quote** to pass `pnpm format`. Existing `main.ts` is inconsistent (uses semicolons + double quotes) — leave it; oxfmt will rewrite when run.
- `.editorconfig`: 2 spaces, LF, max 100 cols, trim trailing.

### 1.4 Code in place (all replaceable / extendable)

- `src/App.vue`: "You did it!" placeholder.
- `src/main.ts`: bootstraps Pinia, router, `main.css`. Keep, do not rewrite.
- `src/main.css`: only `@import 'tailwindcss';`. Will append `@theme`, base resets, focus styles.
- `src/router/index.ts`: `createWebHistory` + empty `routes: []`. Replace `routes` with our route table.
- `src/stores/counter.ts`: example store. **Delete during cleanup.**
- `src/__tests__/App.spec.ts`: trivial mount test. **Delete or replace** when App is rewritten.
- `index.html`: title `"Vite App"`, `lang=""`. Update `lang="en"` and meaningful title.
- `public/favicon.ico`: keep.

### 1.5 Required additions to config

| Change | File | Reason |
|---|---|---|
| Add `coverage` block (provider `v8`, `reportsDirectory: 'coverage'`, `exclude` boilerplate) | `vitest.config.ts` | Coverage isn't wired; README will reference `pnpm test:unit -- --coverage`. |
| Add `setupFiles: ['./src/__tests__/setup.ts']` | `vitest.config.ts` | Centralise `IntersectionObserver`/`ResizeObserver`/`fetch` mocks for jsdom. |
| Add `script: "test:coverage": "vitest run --coverage"` | `package.json` | Convenience. |
| Add `script: "test:ui": "vitest --ui"` | `package.json` | Skip — would require adding `@vitest/ui` dep. **Do not add.** |
| Update `index.html` `<title>` and `<html lang="en">` | `index.html` | Accessibility + branding. |

### 1.6 Proposed new dependencies

**`@vitest/coverage-v8`** (devDependency) — only addition. Justification: required for coverage reports cited in the README. ~80 KB devDep, stays out of the runtime bundle, official Vitest package. Without it, `--coverage` flag errors out.

**Nothing else.** No `axios` (native `fetch` is sufficient — wrapper is ~40 LOC including retry+abort+https-rewrite). No date library (`Intl.DateTimeFormat` + `new Date()`). No icon library (inline SVG). No virtualization, fuzzy-search, debounce, sanitize, or UI-kit packages, per section 3 of the briefing.

---

## 2. Final folder structure

All paths relative to `/Users/yoran/Projects/abn-amro/abn-amro/`.

```
src/
├── main.ts                              [keep — bootstraps app]
├── main.css                             [extend — add @theme, base styles, focus rings]
├── App.vue                              [rewrite — AppShell with skip link, header, <RouterView>, footer]
├── env.d.ts                             [keep at repo root — already present]
│
├── api/
│   ├── tvmazeClient.ts                  [fetch wrapper: retry, abort, dedupe, https-rewrite]
│   ├── endpoints.ts                     [typed TVMaze endpoint functions]
│   └── __tests__/
│       ├── tvmazeClient.spec.ts
│       └── endpoints.spec.ts
│
├── types/
│   ├── tvmaze.ts                        [TvMazeShow, TvMazeCast, TvMazeEpisode, embed types]
│   ├── filter.ts                        [FilterDefinition<P>, ActiveFilter, FilterId]
│   └── ui.ts                            [SearchScore, GenreBucket, ProgressState]
│
├── stores/
│   ├── shows.ts                         [useShowsStore: byId, pages, genreIndex, inFlight, detailMeta, paginator]
│   ├── ui.ts                            [useUiStore: searchQuery, activeFilters]
│   └── __tests__/
│       ├── shows.spec.ts
│       └── ui.spec.ts
│
├── filters/
│   ├── registry.ts                      [FILTER_REGISTRY, getFilter(id)]
│   ├── compose.ts                       [composeFilters(active): (show) => boolean]
│   ├── genreFilter.ts
│   ├── minRatingFilter.ts
│   ├── languageFilter.ts
│   └── __tests__/
│       ├── compose.spec.ts
│       ├── genreFilter.spec.ts
│       ├── minRatingFilter.spec.ts
│       └── languageFilter.spec.ts
│
├── composables/
│   ├── useDebouncedRef.ts               [debounce primitive — replaces external util]
│   ├── useVirtualList.ts                [horizontal windowing, RAF + ResizeObserver]
│   ├── useKeyboardGrid.ts               [roving tabindex grid, arrow/Home/End/Enter]
│   ├── useUrlState.ts                   [bidirectional sync of UI store ↔ ?q,genres,minRating,languages]
│   ├── useFocusOnRouteChange.ts         [moves focus to new view's <h1 tabindex="-1">]
│   ├── usePrefersReducedMotion.ts       [reactive media-query]
│   ├── useShowSearch.ts                 [hybrid local+remote search, AbortController]
│   └── __tests__/
│       ├── useDebouncedRef.spec.ts
│       ├── useVirtualList.spec.ts
│       ├── useKeyboardGrid.spec.ts
│       ├── useUrlState.spec.ts
│       └── useShowSearch.spec.ts
│
├── utils/
│   ├── sortByRating.ts                  [stable desc sort, nulls last]
│   ├── score.ts                         [scoreShowAgainstQuery(show, q): number]
│   ├── highlight.ts                     [splitForHighlight(text, q): Array<{text, match}>]
│   ├── stripHtml.ts                     [allow-list HTML stripper for `summary` field]
│   ├── httpsRewrite.ts                  [walk object, replace http:// with https://]
│   ├── formatDate.ts                    [Intl.DateTimeFormat helpers]
│   └── __tests__/
│       ├── sortByRating.spec.ts
│       ├── score.spec.ts
│       ├── highlight.spec.ts
│       ├── stripHtml.spec.ts
│       └── formatDate.spec.ts
│
├── components/
│   ├── AppShell.vue                     [renders into App.vue: skip link, header, RouterView, footer w/ progress]
│   ├── AppHeader.vue                    [logo wordmark, SearchInput, nav]
│   ├── AppFooter.vue                    [pages-loaded progress bar, attribution]
│   ├── SearchInput.vue                  [debounced input, clear button, Enter routes, Escape clears]
│   ├── GenreRow.vue                     [horizontal virtualized strip; props: genreKey, displayName, showIds]
│   ├── ShowCard.vue                     [poster, title, rating, genre badges; handles null fields]
│   ├── AppImage.vue                     [<img> with placeholder, lazy, decoding=async, aspect-ratio reserve]
│   ├── Skeleton.vue                     [shimmer placeholder, respects prefers-reduced-motion]
│   ├── Rating.vue                       [renders rating w/ star icon + accessible label]
│   ├── LazyMount.vue                    [IntersectionObserver wrapper, rootMargin 400px, height-preserving]
│   ├── BackLink.vue                     [router-link "← Back" with focus management]
│   ├── EmptyState.vue                   [no-results / no-data illustration + message]
│   ├── ErrorState.vue                   [retryable error block]
│   ├── ProgressBar.vue                  [0..1 progress, aria-valuenow]
│   └── __tests__/
│       ├── ShowCard.spec.ts
│       ├── GenreRow.spec.ts
│       ├── SearchInput.spec.ts
│       ├── Rating.spec.ts
│       ├── LazyMount.spec.ts
│       └── AppImage.spec.ts
│
├── views/
│   ├── DashboardView.vue                [/ — list of GenreRows, filter bar]
│   ├── ShowDetailView.vue               [/shows/:id — header, summary, cast, episodes]
│   ├── SearchResultsView.vue            [/search?q=… — grid of ShowCards]
│   └── NotFoundView.vue                 [catch-all, focusable h1]
│
├── router/
│   └── index.ts                         [routes table, scrollBehavior, route-change focus hook]
│
└── __tests__/
    └── setup.ts                         [global mocks: IntersectionObserver, ResizeObserver, fetch]
```

`tests/` directory is **not** introduced. Tests are colocated under `__tests__/` per existing `tsconfig.vitest.json` include glob (`src/**/__tests__/*`). Changing this would require re-tuning two tsconfigs for marginal benefit.

---

## 3. Type definitions

All types in `src/types/`. Source of truth for TVMaze fields: TVMaze v1 API documented at `https://www.tvmaze.com/api`. Sample show payload was inspected mentally; field names below match the wire shape.

### 3.1 `types/tvmaze.ts`

```ts
export type TvMazeShowStatus = 'Running' | 'Ended' | 'To Be Determined' | 'In Development' | string

export interface TvMazeRating {
  average: number | null
}

export interface TvMazeImage {
  medium: string | null
  original: string | null
}

export interface TvMazeNetwork {
  id: number
  name: string
  country: { name: string; code: string; timezone: string } | null
}

export interface TvMazeSchedule {
  time: string
  days: string[]
}

export interface TvMazeShow {
  id: number
  url: string
  name: string
  type: string
  language: string | null
  genres: string[]
  status: TvMazeShowStatus
  runtime: number | null
  averageRuntime: number | null
  premiered: string | null
  ended: string | null
  officialSite: string | null
  schedule: TvMazeSchedule
  rating: TvMazeRating
  weight: number
  network: TvMazeNetwork | null
  webChannel: TvMazeNetwork | null
  image: TvMazeImage | null
  summary: string | null
  updated: number
  _embedded?: {
    cast?: TvMazeCastMember[]
    episodes?: TvMazeEpisode[]
  }
}

export interface TvMazePerson {
  id: number
  name: string
  image: TvMazeImage | null
}

export interface TvMazeCharacter {
  id: number
  name: string
  image: TvMazeImage | null
}

export interface TvMazeCastMember {
  person: TvMazePerson
  character: TvMazeCharacter
  self: boolean
  voice: boolean
}

export interface TvMazeEpisode {
  id: number
  name: string
  season: number
  number: number | null
  type: string
  airdate: string | null
  airtime: string | null
  airstamp: string | null
  runtime: number | null
  rating: TvMazeRating
  image: TvMazeImage | null
  summary: string | null
}

export interface TvMazeSearchResult {
  score: number
  show: TvMazeShow
}

export type EmbedKey = 'cast' | 'episodes' | 'seasons' | 'images'
```

### 3.2 `types/filter.ts`

```ts
export type FilterId = 'genre' | 'minRating' | 'language'

export interface FilterDefinition<P> {
  id: FilterId
  label: string
  defaultParams: P
  predicate: (params: P) => (show: TvMazeShow) => boolean
  serialize: (params: P) => string | undefined  // returns undefined when "inactive" so URL stays clean
  deserialize: (raw: string | undefined) => P
}

export interface ActiveFilter<P = unknown> {
  id: FilterId
  params: P
}

export type GenreFilterParams = { values: string[] }                 // lowercase keys
export type MinRatingFilterParams = { min: number }                  // 0..10, 0 = inactive
export type LanguageFilterParams = { values: string[] }
```

### 3.3 `types/ui.ts`

```ts
export interface PageMeta {
  status: 'idle' | 'loading' | 'loaded' | 'error' | 'end'
  fetchedAt: number | null
  error?: string
}

export interface PaginatorState {
  status: 'idle' | 'streaming' | 'done' | 'paused' | 'error'
  loadedPages: number
  endPage: number | null         // first 404 we hit; null until known
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
  genreIndex: Record<string, number[]>          // lowercase genre key → ids; ids deduped within a bucket
  genreDisplayName: Record<string, string>      // lowercase → first-seen original casing
  inFlight: Record<string, Promise<unknown>>
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
```

---

## 4. Function signatures and module contracts

### 4.1 `api/tvmazeClient.ts`

```ts
const BASE_URL = 'https://api.tvmaze.com'
const RETRY_DELAYS_MS = [500, 1000, 2000]   // exponential, max 3 retries

export interface RequestOptions {
  signal?: AbortSignal
  retry?: boolean                            // default true
}

// Single request with retry on 429/5xx, abort propagation, dedupe on identical URLs.
export function request<T>(path: string, opts?: RequestOptions): Promise<T>

// Lower-level building blocks (exported for tests):
export function buildUrl(path: string): string
export function rewriteHttps<T>(value: T): T          // deep walk, replace http:// → https://
export function shouldRetry(status: number): boolean   // 429 || 5xx
export function delay(ms: number, signal?: AbortSignal): Promise<void>
```

Behavior contract:
- Treats `404` as a typed end-of-pagination signal: throws `EndOfPagesError` (custom class exported from this file).
- Retries on `429` and `5xx` up to 3 times with `RETRY_DELAYS_MS`. On `Retry-After` header, prefers that value (capped at 5 s).
- Dedupes via in-flight `Map<string, Promise>`; cleared on settle.
- Recursively rewrites every string field starting with `http://api.tvmaze.com` or `http://static.tvmaze.com` to `https://`. (Don't blanket rewrite all `http://` — could corrupt unrelated URLs in show summaries.)
- All non-OK responses (non-404, non-retry-eligible) throw `TvMazeApiError(status, statusText, url)`.

### 4.2 `api/endpoints.ts`

```ts
export function getShowsPage(page: number, opts?: RequestOptions): Promise<TvMazeShow[]>
// GET /shows?page=N — returns 250 ascending-by-id, throws EndOfPagesError on 404.

export function getShow(id: number, embed?: EmbedKey[], opts?: RequestOptions): Promise<TvMazeShow>
// GET /shows/:id?embed[]=cast&embed[]=episodes etc.

export function searchShows(q: string, opts?: RequestOptions): Promise<TvMazeSearchResult[]>
// GET /search/shows?q=… — server-side fuzzy, returns up to 10 with score.

export function getShowCast(id: number, opts?: RequestOptions): Promise<TvMazeCastMember[]>
export function getShowEpisodes(id: number, opts?: RequestOptions): Promise<TvMazeEpisode[]>
```

### 4.3 `stores/shows.ts` — `useShowsStore`

State (typed `ShowsState`): `byId`, `pages`, `genreIndex`, `genreDisplayName`, `inFlight`, `detailMeta`, `paginator`.

Actions:
```ts
async fetchFirstPage(): Promise<void>
async fetchPage(page: number): Promise<void>
async startBackgroundPaginator(opts?: { intervalMs?: number }): Promise<void>  // default 300 ms
pauseBackgroundPaginator(): void
resumeBackgroundPaginator(): void
async fetchShowDetail(id: number): Promise<void>          // SWR: serves stale, refetches
ingestShows(shows: TvMazeShow[]): void                    // upserts byId, updates genreIndex incrementally
reset(): void                                             // for tests
```

Getters:
```ts
showsByGenre(genreKey: string): TvMazeShow[]              // sorted by rating desc, nulls last; cached
genreKeysSorted(): string[]                               // alphabetical by displayName
totalShows(): number
isPaginating(): boolean
progressFraction(): number                                // loadedPages / endPage (or asymptote 0.95 if unknown)
```

Behavior contract:
- `ingestShows` updates `genreIndex` incrementally: for each new show, push id into each `genres[i].toLowerCase().trim()` bucket; record `displayName` only on first sight. Empty `genres` → `'uncategorized'` bucket with displayName `'Uncategorized'` (decision: include, with footnote). Within a bucket, dedupe by id (set semantics).
- `showsByGenre` does **not** re-traverse `byId`; it maps `genreIndex[key]` through `byId`, then sorts by `rating.average` desc with nulls last (stable sort via `sortByRating`).
- `fetchPage` is dedupe-keyed by `pages[page].status`; concurrent calls return the in-flight promise.
- Background paginator: `setTimeout` loop (not interval; reset on completion to honor backpressure). Stops on `EndOfPagesError`, sets `endPage`. On `TvMazeApiError`, sets `paginator.status = 'error'` and emits a one-shot toast event (via `pinia` plugin? — keep simple: surface in `ProgressBar` aria-live).
- `fetchShowDetail`: SWR — if `byId[id]` exists with `_embedded.cast/episodes` and `detailMeta[id].fetchedAt` < 5 minutes old, return synchronously; otherwise refetch.

### 4.4 `stores/ui.ts` — `useUiStore`

State: `searchQuery: ''`, `activeFilters: []`.

Actions:
```ts
setSearchQuery(q: string): void
setFilter<P>(id: FilterId, params: P): void               // upsert
clearFilter(id: FilterId): void
clearAllFilters(): void
hydrateFromUrl(query: LocationQuery): void
```

Getters:
```ts
hasActiveFilters(): boolean
filterById(id: FilterId): ActiveFilter | undefined
combinedPredicate(): (show: TvMazeShow) => boolean        // calls composeFilters(activeFilters)
```

### 4.5 `filters/`

```ts
// registry.ts
export const FILTER_REGISTRY: ReadonlyArray<FilterDefinition<unknown>>
export function getFilter<P>(id: FilterId): FilterDefinition<P>

// compose.ts
export function composeFilters(active: ActiveFilter[]): (show: TvMazeShow) => boolean
// AND mode by default. TODO comment: "switch .every → .some for OR mode"

// genreFilter.ts
export const genreFilter: FilterDefinition<GenreFilterParams>
// matches if any of params.values is in show.genres (case-insensitive); empty values = inactive

// minRatingFilter.ts
export const minRatingFilter: FilterDefinition<MinRatingFilterParams>
// matches if (show.rating.average ?? 0) >= params.min; min=0 = inactive

// languageFilter.ts
export const languageFilter: FilterDefinition<LanguageFilterParams>
// matches if show.language is in params.values; empty values = inactive
```

### 4.6 `composables/`

```ts
// useDebouncedRef.ts
export function useDebouncedRef<T>(source: Ref<T>, delayMs: number): Ref<T>
// returns a ref whose value trails source by delayMs; cancels pending timeout on unmount.

// useVirtualList.ts
export interface UseVirtualListOptions<T> {
  items: Ref<readonly T[]>
  itemSize: number                    // px, fixed
  containerRef: Ref<HTMLElement | null>
  axis?: 'x' | 'y'                    // default 'y'
  buffer?: number                     // default 3
  gap?: number                        // default 0
}
export interface UseVirtualListReturn<T> {
  windowItems: ComputedRef<Array<{ index: number; item: T }>>
  contentSize: ComputedRef<number>    // total px along axis
  offset: ComputedRef<number>         // translate value of window
  scrollTo: (index: number, behavior?: ScrollBehavior) => void
}
export function useVirtualList<T>(opts: UseVirtualListOptions<T>): UseVirtualListReturn<T>

// useKeyboardGrid.ts
export interface UseKeyboardGridOptions {
  rowsRef: Ref<HTMLElement[]>            // each row is a tablist-like region
  itemsPerRow: Ref<number[]>             // dynamic per-row counts
  onActivate: (rowIndex: number, colIndex: number) => void
}
export function useKeyboardGrid(opts: UseKeyboardGridOptions): {
  active: Ref<{ row: number; col: number }>
  setActive: (row: number, col: number) => void
}
// roving tabindex; ArrowLeft/Right move col, ArrowUp/Down move row, Home/End jump within row,
// Enter calls onActivate. PageUp/PageDown skip 5 cols. Wraps at row boundaries: no.

// useUrlState.ts
export function useUrlState(): void
// side-effect composable: bidirectional sync between useUiStore and route.query.
// debounce 250 ms on writes, uses router.replace, parses on mount and on route changes.

// useFocusOnRouteChange.ts
export function useFocusOnRouteChange(headingSelector?: string): void
// default selector: '[data-route-heading]'; also moves focus to body if not found.

// usePrefersReducedMotion.ts
export function usePrefersReducedMotion(): Ref<boolean>

// useShowSearch.ts
export function useShowSearch(query: Ref<string>): {
  results: Ref<ScoredShow[]>
  loading: Ref<boolean>
  error: Ref<Error | null>
}
// debounces 300 ms (consumes useDebouncedRef), runs local scoring against shows store,
// fires remote /search/shows when local results < 5, merges deduped, cancels stale via AbortController.
```

### 4.7 `utils/`

```ts
// sortByRating.ts
export function sortByRating(a: TvMazeShow, b: TvMazeShow): number
// descending; nulls last. Tie-breaker: weight desc, then id asc.

// score.ts
export function scoreShowAgainstQuery(show: TvMazeShow, q: string): number
// 0 if no match; 100 exact (case-insensitive name === q); 60 starts-with; 30 contains. q length < 1 → 0.

// highlight.ts
export function splitForHighlight(text: string, q: string): Array<{ text: string; match: boolean }>

// stripHtml.ts
export function stripHtml(html: string | null | undefined): string
// Allow-list: <p>, <b>, <i>, <em>, <strong>, <br>; everything else removed.
// Naïve regex pass — README must note "would prefer DOMPurify in production".

// httpsRewrite.ts
export function rewriteHttpsDeep<T>(value: T): T
// in-place clone-rewrite of strings starting with http://(api|static).tvmaze.com.

// formatDate.ts
export function formatDate(iso: string | null | undefined, locale?: string): string
// '2025-03-04' → 'Mar 4, 2025' via Intl.DateTimeFormat.
export function formatYear(iso: string | null | undefined): string
```

---

## 5. Component contracts

All `<script setup lang="ts">`. Tailwind v4 utility classes, **no `<style>` blocks** unless absolutely required (e.g., `@keyframes` for shimmer; even then prefer CSS variable + utility).

### 5.1 `App.vue`
- No props. Renders `<AppShell>`.
- Mounts `useUrlState()` and `useFocusOnRouteChange()` at root.
- Triggers `showsStore.fetchFirstPage().then(() => showsStore.startBackgroundPaginator())` on mount.

### 5.2 `AppShell.vue`
- No props. Slots: default (overridden by route in our case via RouterView).
- Renders skip-link `<a href="#main">Skip to main content</a>` (visually hidden until focused), `<AppHeader />`, `<main id="main" tabindex="-1">…</main>`, `<AppFooter />`.

### 5.3 `AppHeader.vue`
- No props. Contains brand wordmark (`<router-link to="/">…</router-link>`) and `<SearchInput />`.

### 5.4 `AppFooter.vue`
- No props. Reads `showsStore.progressFraction` and `showsStore.paginator.status`. Renders `<ProgressBar :value="…">` with aria-label, plus attribution "Data: TVMaze".

### 5.5 `SearchInput.vue`
- Props: none (reads/writes `useUiStore.searchQuery`).
- Emits: none.
- Behavior: input value bound bidirectionally with 300 ms debounce. `Enter` → `router.push({ name: 'search', query: { q: store.searchQuery } })`. `Escape` → clears + `input.blur()`. Clear button (`✕`) when non-empty. `aria-label="Search shows"`. `role="searchbox"`.

### 5.6 `GenreRow.vue`
- Props: `{ genreKey: string; displayName: string; showIds: number[] }`.
- Emits: none.
- Behavior: Wraps content in `<LazyMount :estimated-height="…">`. Inside: `<h2>` with `displayName`, then horizontal `useVirtualList` rendering `<ShowCard>` per visible item, ordered already by sorted ids passed in. Roving-tabindex registration via `useKeyboardGrid`. ARIA `role="region" :aria-label="`${displayName} shows`"`.

### 5.7 `ShowCard.vue`
- Props: `{ show: TvMazeShow; rowIndex: number; colIndex: number; queryHighlight?: string }`.
- Emits: `(e: 'activate', show: TvMazeShow): void`.
- Behavior: `<router-link :to="{ name: 'show', params: { id: show.id } }">`. Inside: `<AppImage>` (poster, fixed aspect), title (with `splitForHighlight` when `queryHighlight`), `<Rating :value="show.rating.average">`, genre badges (max 2). Handles `image: null` (placeholder), `rating.average: null` ("—"), missing name (fallback `'Untitled'`).

### 5.8 `AppImage.vue`
- Props: `{ src: string | null; alt: string; aspect?: 'poster' | 'square'; sizes?: string }`.
- Behavior: when `src` null, renders themed placeholder div with same aspect. Else `<img loading="lazy" decoding="async" :alt :src>`. `aspect-ratio: 2/3` for `poster` to reserve layout (zero CLS).

### 5.9 `Skeleton.vue`
- Props: `{ width?: string; height?: string; radius?: string; lines?: number }`.
- Renders one or more shimmer placeholders. Disables shimmer animation when `usePrefersReducedMotion()` is true.

### 5.10 `Rating.vue`
- Props: `{ value: number | null }`.
- Renders inline SVG star + `value.toFixed(1)` or `'—'`. `<span aria-label="Rating: 8.4 out of 10">`.

### 5.11 `LazyMount.vue`
- Props: `{ estimatedHeight: string; rootMargin?: string }` (default `'400px'`).
- Slots: default.
- Behavior: renders a `<div :style="{ minHeight: estimatedHeight }">`; mounts slot when `IntersectionObserver` reports intersection. Stays mounted once seen (no unmount on scroll-away — "scroll restoration" requirement).

### 5.12 `ShowDetailView.vue`
- No props (reads `route.params.id`).
- On mount: `showsStore.fetchShowDetail(+route.params.id)`. Renders header (poster, name, genres, rating, network, premiered), summary (via `stripHtml` then `v-html` — narrowed surface), `<CastList>`, `<EpisodeList>`. Has `<BackLink to="/">`, focuses `<h1 data-route-heading tabindex="-1">` on mount.

### 5.13 `CastList.vue`
- Props: `{ cast: TvMazeCastMember[] }`. Renders `<ul>` of person + character. Show top 12, "Show more" expands.

### 5.14 `EpisodeList.vue`
- Props: `{ episodes: TvMazeEpisode[] }`. Group by season, collapsible per season; first season expanded by default. Each item: SxxEyy, name, airdate.

### 5.15 `SearchResultsView.vue`
- No props (reads `route.query.q`).
- Calls `useShowSearch(toRef(...))`. Renders responsive grid of `<ShowCard>`s. Empty state when no results.

### 5.16 `EmptyState.vue`, `ErrorState.vue`, `BackLink.vue`, `ProgressBar.vue`, `NotFoundView.vue`
- Standard small primitives. `ErrorState` props: `{ message: string; onRetry?: () => void }`. `ProgressBar` props: `{ value: number; label: string; indeterminate?: boolean }` with `role="progressbar"` + aria-valuenow.

---

## 6. Routing plan

`src/router/index.ts`:

```ts
const routes: RouteRecordRaw[] = [
  { path: '/',            name: 'dashboard', component: () => import('@/views/DashboardView.vue'),    meta: { title: 'Browse' } },
  { path: '/shows/:id',   name: 'show',      component: () => import('@/views/ShowDetailView.vue'),   meta: { title: 'Show' },     props: route => ({ id: Number(route.params.id) }) },
  { path: '/search',      name: 'search',    component: () => import('@/views/SearchResultsView.vue'),meta: { title: 'Search' } },
  { path: '/:catchAll(.*)*', name: 'not-found', component: () => import('@/views/NotFoundView.vue'),  meta: { title: 'Not found' } },
]
```

- All views are dynamically imported (code-splitting; Vite handles chunking).
- `scrollBehavior(to, from, saved)`: if `saved` (popstate) return `saved`; if same route, no scroll; else `{ top: 0 }` with `behavior: usePrefersReducedMotion ? 'auto' : 'smooth'`.
- Global `afterEach`: update `document.title = `${to.meta.title ?? 'TV Shows'} · ABN AMRO Shows`` (prefix our brand last).
- No route guards — TVMaze API is public, no auth.
- Focus management: `useFocusOnRouteChange()` mounted in `App.vue` watches route changes and focuses `[data-route-heading]` after `nextTick`.

---

## 7. Testing plan

Target: ~16 test files, ~80 cases. All in `__tests__/` colocated. Setup file `src/__tests__/setup.ts` provides `IntersectionObserver`, `ResizeObserver`, `matchMedia` shims and a `vi.fn()`-backed `fetch`.

| File | Type | Cases |
|---|---|---|
| `src/utils/__tests__/sortByRating.spec.ts` | pure | (1) descending order; (2) null rating last; (3) two nulls keep stable order; (4) tie broken by weight desc; (5) weight tie broken by id asc; (6) handles empty array |
| `src/utils/__tests__/score.spec.ts` | pure | (1) exact match=100 case-insensitive; (2) starts-with=60; (3) contains=30; (4) no match=0; (5) empty query=0; (6) name with diacritics still matches |
| `src/utils/__tests__/highlight.spec.ts` | pure | (1) splits around match; (2) handles no match; (3) case-insensitive; (4) handles empty query (returns whole text); (5) handles overlapping repeats (first match only) |
| `src/utils/__tests__/stripHtml.spec.ts` | pure | (1) strips `<script>`; (2) keeps `<p><b><i><em><strong><br>`; (3) strips attributes from allowed tags; (4) handles null/undefined → ''; (5) strips `<img onerror=…>` payload |
| `src/utils/__tests__/formatDate.spec.ts` | pure | (1) ISO → "Mar 4, 2025"; (2) null → ''; (3) invalid → ''; (4) formatYear extracts year |
| `src/api/__tests__/tvmazeClient.spec.ts` | unit (fetch mocked) | (1) success returns parsed JSON; (2) 404 throws EndOfPagesError; (3) 429 retries with backoff; (4) 500 retries 3× then throws; (5) Retry-After honored; (6) abort signal cancels mid-flight; (7) dedupes identical concurrent URLs; (8) http→https rewrite on image URLs in response |
| `src/api/__tests__/endpoints.spec.ts` | unit (fetch mocked) | (1) `getShowsPage(0)` calls `/shows?page=0`; (2) `getShow(1, ['cast','episodes'])` builds correct query; (3) `searchShows('q')` returns scored results |
| `src/stores/__tests__/shows.spec.ts` | store | (1) ingestShows upserts byId; (2) ingestShows builds genreIndex (lowercase); (3) preserves displayName casing first-seen; (4) duplicate ids deduped per bucket; (5) empty genres → 'uncategorized'; (6) `showsByGenre` returns sorted by rating; (7) paginator stops on EndOfPagesError and sets endPage; (8) paginator skips fetch when status=loaded; (9) fetchShowDetail SWR returns cached + refetches when stale; (10) reset() clears state |
| `src/stores/__tests__/ui.spec.ts` | store | (1) setFilter upserts; (2) clearFilter removes; (3) hydrateFromUrl parses ?q,genres,minRating,languages; (4) combinedPredicate AND-composes |
| `src/filters/__tests__/compose.spec.ts` | pure | (1) empty list → identity true; (2) all-true → true; (3) one-false → false; (4) order independent |
| `src/filters/__tests__/genreFilter.spec.ts` | pure | (1) match any value; (2) case-insensitive; (3) empty params = inactive (always true); (4) serialize/deserialize round-trip |
| `src/filters/__tests__/minRatingFilter.spec.ts` | pure | (1) above threshold; (2) at threshold (>=); (3) null rating → 0 → fails; (4) min=0 inactive; (5) round-trip |
| `src/filters/__tests__/languageFilter.spec.ts` | pure | (1) match; (2) null language fails; (3) empty inactive; (4) round-trip |
| `src/composables/__tests__/useDebouncedRef.spec.ts` | composable (vi fake timers) | (1) trails source; (2) cancels pending on rapid changes; (3) cleans up on unmount |
| `src/composables/__tests__/useVirtualList.spec.ts` | composable (jsdom + ResizeObserver shim) | (1) windowItems contains correct slice; (2) responds to scroll; (3) buffer applied; (4) contentSize = items × itemSize + gaps; (5) scrollTo updates offset |
| `src/composables/__tests__/useKeyboardGrid.spec.ts` | composable | (1) ArrowRight increments col; (2) ArrowDown row; (3) Home → col 0; (4) End → last col; (5) Enter calls onActivate; (6) clamps at boundaries |
| `src/composables/__tests__/useUrlState.spec.ts` | composable | (1) hydrates store from initial query; (2) router.replace called with serialized state; (3) debounced; (4) unsubscribes on unmount |
| `src/composables/__tests__/useShowSearch.spec.ts` | composable | (1) returns local results; (2) fires remote when local < 5; (3) cancels stale remote on new query; (4) merges dedup by id; (5) loading flips to false on settle |
| `src/components/__tests__/ShowCard.spec.ts` | component | (1) renders name; (2) renders rating; (3) null image → placeholder; (4) null rating → "—"; (5) router-link target; (6) highlights matched substring |
| `src/components/__tests__/GenreRow.spec.ts` | component | (1) renders heading with displayName; (2) renders only window items; (3) sorts by rating desc; (4) ARIA region+label present |
| `src/components/__tests__/SearchInput.spec.ts` | component | (1) debounces store write; (2) Enter routes to /search; (3) Escape clears + blurs; (4) clear button visible only when value present |
| `src/components/__tests__/Rating.spec.ts` | component | (1) renders value to 1 dp; (2) null → "—"; (3) aria-label includes value |
| `src/components/__tests__/LazyMount.spec.ts` | component (IO mocked) | (1) does not mount slot until intersect; (2) preserves height before mount; (3) stays mounted after first intersect |
| `src/components/__tests__/AppImage.spec.ts` | component | (1) renders img with lazy/decoding; (2) null src → placeholder; (3) alt always present |

`src/__tests__/setup.ts` content sketch:
- `globalThis.IntersectionObserver = class { observe(){}; disconnect(){}; … }`
- Same for `ResizeObserver`.
- `globalThis.matchMedia = (q) => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })`
- `globalThis.fetch = vi.fn()` reset in `beforeEach`.

---

## 8. Open questions

These are the points where I want a yes/no or a steer before implementation. Defaults are listed; I will follow the default unless you push back.

1. **Plan file location** — Plan-mode forced this file to `/Users/yoran/.claude/plans/…`. The user prompt asks for `./PLAN.md`. **Default**: in the first implementation turn I will copy this file to `/Users/yoran/Projects/abn-amro/abn-amro/PLAN.md` (same content) before any source edits.
2. **Project root nesting** — Real Vue project lives in `/Users/yoran/Projects/abn-amro/abn-amro/`, not the user-stated CWD. **Default**: keep nesting; do not flatten.
3. **`Uncategorized` bucket** — Shows with empty `genres` are bucketed under `'uncategorized'` and rendered last. **Default**: include with displayName "Uncategorized" so no data is hidden; document choice in README.
4. **Tests location** — Existing `tsconfig.vitest.json` glob is `src/**/__tests__/*`. The user prompt mentions `tests/unit/...` paths. **Default**: colocate under `__tests__/` per existing convention; do not introduce a parallel `tests/` tree.
5. **Coverage tool** — Add `@vitest/coverage-v8` (only new dep). **Default**: yes.
6. **Tailwind v4 customization** — v4 uses `@theme` CSS blocks, not a JS config. **Default**: keep zero customization initially; add `@theme` only for brand colors and focus-ring color when actually needed.
7. **Search-results route vs panel** — User briefing says "Pressing Enter routes to a full search results page". **Default**: dedicated `/search` route — confirmed, no question.
8. **`stripHtml` allow-list vs DOMPurify mention** — User briefing mandates self-rolled stripper + README mention. **Default**: tiny regex stripper + explicit README footnote.
9. **Page interval** — Briefing says 300 ms between background page fetches. With 250 shows/page and ~25 pages typical (≈6,000 shows), that's ~7.5 s of background traffic. **Default**: keep 300 ms; no question.
10. **Detail embed** — `getShow(id, ['cast', 'episodes'])` brings everything in one request; faster + fewer round-trips than separate `/cast` and `/episodes` calls. **Default**: use embed.
11. **Disagreement with section 4 of the briefing** — None significant. One minor caveat noted in §1.5: I am narrowing the http→https rewrite to TVMaze hostnames only, not all URLs in the response, to avoid corrupting unrelated links inside `summary` HTML (e.g., a show whose summary references an `http://` external article). The briefing said "all `http://` URLs returned by the API"; I am tightening that to "all TVMaze API/static URLs". Flagging here per instruction.

---

## 9. Implementation order

Ten phases. Each ≈30–90 min focused work. Phase 1 must finish before any others. Phases 4–5 can swap. Tests are written in the same phase as the code they cover — don't batch.

1. **Foundation (≈30 min)** — Copy PLAN.md to repo. Add `@vitest/coverage-v8`. Create `src/__tests__/setup.ts`, wire into `vitest.config.ts`. Add `test:coverage` script. Update `index.html` (`lang="en"`, title). Delete `stores/counter.ts` + `__tests__/App.spec.ts`. Stub `src/types/{tvmaze,filter,ui}.ts` from §3. Verify `pnpm type-check && pnpm test:unit` green.
2. **Pure utils + filters (≈60 min)** — `sortByRating`, `score`, `highlight`, `stripHtml`, `formatDate`, `httpsRewrite`. All four filter modules + registry + compose. Full test coverage for all of these (≈30 cases). All pure, fast feedback loop.
3. **API layer (≈45 min)** — `tvmazeClient.ts` with retry/abort/dedupe/https rewrite + custom error classes. `endpoints.ts`. Tests with mocked `fetch`.
4. **Stores (≈60 min)** — `useShowsStore` with paginator, genreIndex, SWR. `useUiStore` with filter management + URL hydrate. Store tests.
5. **Composables: data (≈45 min)** — `useDebouncedRef`, `useShowSearch`, `useUrlState`. Tests with fake timers + AbortController.
6. **Composables: a11y/UI (≈60 min)** — `useVirtualList`, `useKeyboardGrid`, `useFocusOnRouteChange`, `usePrefersReducedMotion`. Tests with IO/RO shims.
7. **Atoms (≈45 min)** — `AppImage`, `Skeleton`, `Rating`, `ProgressBar`, `LazyMount`, `BackLink`, `EmptyState`, `ErrorState`. Tests for the non-trivial ones.
8. **Composites + shell (≈75 min)** — `ShowCard`, `GenreRow`, `SearchInput`, `AppShell`, `AppHeader`, `AppFooter`. Wire `App.vue` to mount paginator + url-state. Tests for ShowCard, GenreRow, SearchInput.
9. **Views + routing (≈60 min)** — `DashboardView` (filter bar + genre rows), `ShowDetailView` (header, cast, episodes), `SearchResultsView`, `NotFoundView`. Update `router/index.ts` with routes + scrollBehavior + title hook. Smoke-test by running `pnpm dev` and clicking through the three routes.
10. **Polish + README (≈60 min)** — `main.css` `@theme` for brand color + focus ring, base `:focus-visible` styles, skeletons during initial load. Manual a11y pass with keyboard + screen reader (VoiceOver). Write README: stack, decisions (§4 of briefing), Node/pnpm versions, run/test/coverage commands, EAA justification, "what I'd do with more time" section listing DOMPurify, e2e tests, i18n. Verify `pnpm build` produces a clean dist.

---

## 10. Risk register

| Risk | Mitigation in plan |
|---|---|
| Adding any forbidden dep slips through | Hard list in §1.6; only `@vitest/coverage-v8` proposed. Reviewer audit `package.json` will be clean. |
| `noUncheckedIndexedAccess` breaks intuitive code (e.g., `arr[0]` is `T \| undefined`) | Plan all signatures with this in mind; use `.at()` returning `\| undefined` and explicit guards. |
| Vue Router 5 / Vite 8 / TypeScript 6 — unusual versions | Don't pin to v3/v4 idioms. Read installed versions before writing route definitions. Use `RouteRecordRaw` from the actually-installed `vue-router`. |
| Tailwind v4 (no JS config) confusion | Customisation via `@theme` in `main.css`, not `tailwind.config.js`. Don't propose v3 plugin syntax. |
| oxfmt's no-semis / single-quote rule violated | All new files written without semicolons, with single quotes. CI check via `pnpm lint`. |
| TVMaze rate limiting (20/10s) | 300 ms gap = max ~3.3 req/s, well under. Retry-After on 429 honored. |
| Mixed-content (`http://` images) | `rewriteHttpsDeep` in `tvmazeClient`. |
| CLS from images and lazy-mounted rows | `aspect-ratio` on `<AppImage>`; `LazyMount` `estimatedHeight`. |
| Virtual scroll mis-measurement on resize | `ResizeObserver` recomputes window size; debounced. |
| Stale closures in scroll/IO handlers | All handlers use refs, no captured values; teardown in `onScopeDispose`. |
| `<h1>` tabindex="-1" focus is jarring | Apply `data-route-heading` only to single h1 per view; visually no change, only programmatic focus. |
| `v-html` for show summary is XSS-vulnerable | `stripHtml` allow-list + README disclosure that DOMPurify is the production answer. |
| `prefers-reduced-motion` ignored | `usePrefersReducedMotion` consumed in `Skeleton`, scrollBehavior, hover transforms. |
| URL state explodes route history | `router.replace` (not `push`) + 250 ms debounce. |
| Background paginator runs forever on bad network | Stops on `EndOfPagesError` (404), surfaces error state on `TvMazeApiError`, never silently retries past 3. |
| Genre bucketing of empty `genres` hides shows | Synthetic `'uncategorized'` bucket — documented in README. |
| Detail data ages out (cast/episodes) | SWR — 5 min freshness window with background refetch. |
| Reviewer time is finite | README leads with the 5 strongest decisions: streaming paginator, normalized store, filter registry, self-rolled virtual scroll, EAA-aware a11y. |

---

## 11. Verification (pre-merge checklist)

Run after Phase 10:
- `pnpm install` — clean, lockfile delta only `@vitest/coverage-v8`.
- `pnpm type-check` — 0 errors.
- `pnpm lint` — 0 errors.
- `pnpm format` — no diff (idempotent).
- `pnpm test:unit run --coverage` — all tests green; coverage on `src/{utils,filters,api,stores,composables}` ≥ 90% lines.
- `pnpm dev` — `/`, `/shows/:id`, `/search?q=…` render; refresh restores filter state from URL; arrow-key navigation works in genre rows; tab focus is always visible.
- DevTools network tab — initial load fires `/shows?page=0`, paints, then trickles `?page=1`, `?page=2`, … at ~300 ms intervals; stops on 404.
- Lighthouse on `/` (mobile) — Performance ≥ 90, Accessibility = 100, Best Practices ≥ 95.
- VoiceOver pass on `/`: skip link, region announcements, search announce, focus moved on route change.
- Mobile responsive at 360 / 768 / 1280 widths.
