# ABN AMRO Shows

A TV-show dashboard built against the public [TVMaze API](https://www.tvmaze.com/api). Browse shows grouped by genre, search across the catalog, and drill into details for cast and episodes — all keyboard-navigable, accessibility-first, and built without UI libraries or scaffolding kits.

> Take-home for the **Senior Frontend Developer** role at ABN AMRO. The brief: TVMaze data, horizontal genre rows sorted by rating, search by name, responsive, unit-tested, minimal dependencies.

## Stack

- **Vue 3** (Composition API, `<script setup lang="ts">`)
- **TypeScript** (strict, `noUncheckedIndexedAccess`)
- **Vite 8** for dev/build
- **Pinia 3** for state
- **Vue Router 5**
- **Tailwind CSS 4** (no JS config; theme via `@theme`)
- **Vitest 4** + **@vue/test-utils** for unit tests, jsdom environment

## Requirements

- **Node**: `^20.19.0 || >=22.12.0` (enforced via `engines` in `package.json`)
- **pnpm**: any recent version (lockfile is `pnpm-lock.yaml`)

If you don't have pnpm:
```sh
npm install -g pnpm
```

## Run

```sh
pnpm install
pnpm dev          # http://localhost:5173 (5174 if 5173 is taken)
pnpm build        # type-check + production build to ./dist
pnpm preview      # serve the production build
pnpm test:unit    # watch-mode tests
pnpm test:unit run # one-shot tests
pnpm test:coverage # one-shot tests with v8 coverage report
pnpm lint         # oxlint + eslint --fix
pnpm format       # oxfmt rewrite of src/
pnpm type-check   # vue-tsc --build
```

## Architecture

### Data: streaming progressive loader, normalized store

TVMaze offers no genre endpoint. The `/shows?page=N` index returns 250 shows per page, ordered by id, and 404s past the last page (~75 pages). Two naïve approaches both fail the bar:

- **Fetch every page upfront** — multi-second load before first paint.
- **Fetch only one page** — incomplete dataset; many genres look empty.

Instead, `useShowsStore` fetches **page 0** first, paints the dashboard, and then fires a **background paginator** that streams pages 1, 2, 3 … with a 300 ms delay between requests (well under the 20 req / 10 s rate limit). Genre rows reactively grow as more pages arrive. A subtle progress bar in the footer reflects loaded pages.

The store is **normalized**: `byId: Record<number, TvMazeShow>` is the single source of truth; `genreIndex: Record<string, number[]>` maps lowercased genre keys to id arrays, built **incrementally** in `ingestShows`. The `showsByGenre(key)` getter does no full traversal — it indexes through `genreIndex` and sorts the resulting slice with a stable `sortByRating` (rating desc, nulls last, weight desc, id asc).

### API client: retry, dedupe, abort, https-rewrite (~120 LOC, no axios)

`src/api/tvmazeClient.ts` is a thin native-`fetch` wrapper. It:

- Retries on `429` and `5xx` (max 3, exponential 500/1000/2000 ms; honors `Retry-After` up to 5 s).
- Treats `404` as a typed `EndOfPagesError` (used by the paginator to know when to stop).
- Dedupes concurrent identical GETs via an in-flight Map keyed by URL.
- Recursively rewrites `http://` URLs on `api.tvmaze.com` and `static.tvmaze.com` to `https://` (TVMaze still emits some `http://` image URLs, which would be blocked as mixed content).
- Surfaces a typed `TvMazeApiError(status, statusText, url)` for non-retryable failures.

`axios` was deliberately not added — the wrapper is smaller, has zero runtime weight, and demonstrates the underlying primitives.

### Filters: typed registry, AND-composed predicates

`src/filters/` contains a `FilterDefinition<P>` interface and three implementations: `genre`, `minRating`, `language`. Each filter knows how to:

- Produce a `predicate(params): (show) => boolean`
- Tell whether it's `isActive(params)`
- Round-trip via `serialize` / `deserialize` for URL state

`composeFilters(active)` AND-composes the predicates. Adding a fourth filter (say, `network`) is a one-file change — register it in `FILTER_REGISTRY` and it's automatically wired into the URL, the filter bar, and the predicate composition.

### Search: hybrid local + remote, debounced + abortable

`useShowSearch(queryRef)` (in `src/composables/`) debounces the query 300 ms, scores it locally against `byId` (exact 100, starts-with 60, contains 30), and **only fires `/search/shows`** when local results are sparse (< 5). Results merge with local first, deduped by id. Stale remote requests are cancelled via `AbortController` whenever the query changes. `<mark>` highlighting uses `splitForHighlight`.

### Virtual scroll: self-implemented horizontal windowing

`useVirtualList<T>` is a fixed-size windowing composable: `requestAnimationFrame`-throttled scroll handler, `ResizeObserver` for viewport changes, inner spacer + `transform: translateX(...)` for offset. `<LazyMount>` (built on `IntersectionObserver`, `rootMargin: 400px`) defers row mounting; placeholders preserve estimated height to prevent CLS.

`@tanstack/vue-virtual` was not added — implementing windowing is the whole point of demonstrating skill on this assessment.

### Accessibility (WCAG 2.1 AA)

The **European Accessibility Act** entered into force on **28 June 2025** for financial services in the EU, making WCAG 2.1 AA compliance a legal requirement for banking customer-facing software. Building with this in mind, unprompted, was a deliberate choice:

- Skip-to-main-content link.
- Semantic landmarks (`<header>`, `<main id="main" tabindex="-1">`, `<footer>`, `role="region"` on each genre row with `aria-labelledby` to its heading).
- Route-change focus moves to `[data-route-heading]` (the new view's `<h1>`).
- All interactive elements have `:focus-visible` rings (never `outline: none`).
- Keyboard support throughout: search has Enter / Escape; genre rows scroll horizontally with the native keyboard; clear button has `aria-label`.
- Image alt text is always present (`<AppImage>` enforces it via required prop).
- `prefers-reduced-motion` media query disables shimmer animations and route scroll smoothing.
- Color contrast verified against AA at brand color choices.

### URL-driven shareable state

`useUrlState()` syncs `useUiStore` ↔ `route.query` bidirectionally. `?q=`, `?genre=`, `?minRating=`, `?language=` reflect the entire UI state — refresh, share, browser back/forward all work. Writes are 250 ms debounced and use `router.replace` (not `push`) to avoid history spam.

## Testing

`pnpm test:unit run` runs **119 tests** across:

| Layer | What's tested |
|---|---|
| `utils/` | sortByRating, score, highlight, stripHtml, formatDate, httpsRewrite |
| `filters/` | each predicate, isActive, serialize/deserialize round-trip; composeFilters AND-mode |
| `api/` | fetch wrapper retry/abort/dedupe/https-rewrite; endpoint URL building |
| `stores/` | ingestShows + genreIndex; paginator stop on 404; SWR; reset |
| `composables/` | debounced ref; virtual list windowing; keyboard grid; URL-state hydration; show search local+remote+abort |
| `components/` | ShowCard, SearchInput, Rating, AppImage, LazyMount |

Run `pnpm test:coverage` for an HTML coverage report under `coverage/`.

## What I'd do with more time

- **DOMPurify** in place of the regex `stripHtml`. The regex is correct for TVMaze's known summary HTML but a real production app should run a DOM-based sanitizer.
- **e2e tests** with Playwright covering the golden user journey (browse → search → detail → back), plus a screen-reader smoke check.
- **i18n** scaffolding (`vue-i18n`) — strings are currently English-only inline; would extract to a translation layer.
- **Genre-by-genre lazy data fetching** — could fetch detail data when a row first becomes visible rather than streaming all pages, trading initial completeness for less network.
- **`Set`-backed `genreIndex` buckets** in the store — currently arrays + `includes`-check for dedup, fine at our scale (~6k shows, 30 genres) but `Set` is `O(1)`.
- **Visual regression tests** (Chromatic / Percy).

## Decisions deliberately not made

- **No icon library** — inline SVG only. Adds zero bundle weight.
- **No date library** — `Intl.DateTimeFormat` and `new Date()` are sufficient.
- **No `lodash`/`vueuse`/`fuse.js`** — the equivalent code we needed was 10–30 LOC each.
- **No UI kit** — Tailwind utilities + custom components. Every component is auditable.

## Project layout

```
src/
  api/           # tvmazeClient + endpoints
  components/    # presentational + composite components
  composables/   # useVirtualList, useShowSearch, useUrlState, etc.
  filters/       # filter registry + 3 filter implementations
  stores/        # Pinia stores (shows, ui)
  types/         # TVMaze + filter + ui types
  utils/         # pure functions (sort, score, highlight, strip-html, …)
  views/         # route-level components
  router/        # vue-router config
  __tests__/     # global test setup + fixtures
  App.vue        # root: skip link, header, RouterView, footer
  main.ts        # app bootstrap
  main.css       # Tailwind import + @theme + base styles
```

Tests are colocated with their modules in `__tests__/` directories per the existing `tsconfig.vitest.json` glob.

## License

Take-home assessment — not for redistribution.
