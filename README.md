# ABN AMRO Shows

A TV-show dashboard built against the public [TVMaze API](https://www.tvmaze.com/api). Browse shows by genre, search across the full catalog, and drill into details for cast and episodes. Keyboard-navigable throughout, no UI libraries, no scaffolding kits.

> Take-home for the **Senior Frontend Developer** role at ABN AMRO. The brief: TVMaze data, horizontal genre rows sorted by rating, search by name, responsive, unit-tested, minimal dependencies.

## Stack

Vue 3 (Composition API, `<script setup lang="ts">`) · TypeScript strict with `noUncheckedIndexedAccess` · Vite 8 · Pinia 3 · Vue Router 5 · Tailwind CSS 4 (theme via `@theme`, no JS config) · Vitest 4 + `@vue/test-utils` (jsdom)

## Requirements

Node `^20.19.0 || >=22.12.0` (enforced via `engines` in `package.json`) and pnpm. If you don't have pnpm:

```sh
npm install -g pnpm
```

## Run

```sh
pnpm install
pnpm dev           # http://localhost:5173 (5174 if 5173 is taken)
pnpm build         # type-check + production build to ./dist
pnpm preview       # serve the production build
pnpm test:unit     # watch-mode tests
pnpm test:unit run # one-shot tests
pnpm test:coverage # one-shot tests with v8 coverage report
pnpm lint          # oxlint + eslint --fix
pnpm format        # oxfmt rewrite of src/
pnpm type-check    # vue-tsc --build
```

## Architecture

### Data: streaming progressive loader, normalized store

TVMaze has no genre endpoint. `/shows?page=N` returns 250 shows per page ordered by id, and 404s past the last page (around 75 pages). Two naive approaches both fall short: fetching every page upfront means several seconds before first paint, and fetching only page 0 leaves most genre rows looking empty.

`useShowsStore` fetches page 0 first, paints the dashboard, then fires a background paginator that streams pages 1, 2, 3... with 300ms between requests (well under the 20 req/10s rate limit). Genre rows grow reactively as data arrives. A progress indicator in the footer reflects how far along the paginator is.

The store is normalized: `byId: Record<number, TvMazeShow>` is the single source of truth. `genreIndex: Record<string, number[]>` maps lowercased genre keys to id arrays, built incrementally in `ingestShows`. The `showsByGenre(key)` getter skips full traversal, indexes through `genreIndex`, and sorts the slice with a stable `sortByRating` (rating desc, nulls last, weight desc, id asc).

### API client (~120 LOC, no axios)

`src/api/tvmazeClient.ts` is a thin native-`fetch` wrapper. It retries on `429` and `5xx` (max 3, exponential backoff at 500/1000/2000ms, honors `Retry-After` up to 5s). A `404` becomes a typed `EndOfPagesError` so the paginator knows when to stop. Concurrent identical GETs are deduped via an in-flight Map keyed by URL. It also recursively rewrites `http://` URLs on `api.tvmaze.com` and `static.tvmaze.com` to `https://` — TVMaze still emits some plain-HTTP image URLs that browsers block as mixed content.

`axios` was deliberately skipped. The wrapper is smaller, has zero runtime weight, and the retry/dedupe logic is more interesting to read than axios interceptors anyway.

### Filters: typed registry, AND-composed predicates

`src/filters/` has a `FilterDefinition<P>` interface with three implementations: `genre`, `minRating`, `language`. Each knows how to produce a `predicate(params): (show) => boolean`, report whether it's active, and round-trip via `serialize`/`deserialize` for URL state.

`composeFilters(active)` AND-composes those predicates. Adding a fourth filter (say, `network`) is a one-file change: register it in `FILTER_REGISTRY` and it's wired into the URL, the filter bar, and predicate composition automatically.

### Search: hybrid local + remote

`useShowSearch(queryRef)` debounces the query 300ms, scores it locally against `byId` (exact match: 100, starts-with: 60, contains: 30), and only calls `/search/shows` when local results come back with fewer than 5 hits. Results merge local-first, deduped by id. Stale remote requests are cancelled via `AbortController` when the query changes. `<mark>` highlighting is handled by `splitForHighlight`.

### Virtual scroll: horizontal windowing, self-built

`useVirtualList<T>` is a fixed-size windowing composable: `requestAnimationFrame`-throttled scroll handler, `ResizeObserver` for viewport changes, inner spacer plus `transform: translateX(...)` for offset. `<LazyMount>` (built on `IntersectionObserver` with `rootMargin: 400px`) defers row mounting, and placeholders hold estimated height to avoid CLS.

`@tanstack/vue-virtual` wasn't added. Writing the windowing yourself is the point of a skills assessment.

### Accessibility (WCAG 2.1 AA)

The European Accessibility Act entered into force on 28 June 2025 for financial services in the EU, making WCAG 2.1 AA a legal requirement for banking customer-facing software. This wasn't in the brief. It should have been.

What's covered: skip-to-main-content link; semantic landmarks (`<header>`, `<main id="main" tabindex="-1">`, `<footer>`, `role="region"` per genre row with `aria-labelledby`); route-change focus moves to `[data-route-heading]`; all interactive elements have `:focus-visible` rings (`outline: none` appears nowhere); search supports Enter and Escape; genre rows scroll horizontally via native keyboard; `<AppImage>` enforces alt text via required prop; `prefers-reduced-motion` disables shimmer animations and route scroll smoothing; color contrast verified at AA for all brand color choices.

### URL-driven state

`useUrlState()` syncs `useUiStore` with `route.query` bidirectionally. `?q=`, `?genre=`, `?minRating=`, `?language=` reflect the full UI state, so refresh, share links, and browser back/forward all work as expected. Writes are 250ms debounced and use `router.replace` (not `push`) to avoid polluting history.

## Testing

`pnpm test:unit run` runs 119 tests across:

| Layer | What's tested |
|---|---|
| `utils/` | sortByRating, score, highlight, stripHtml, formatDate, httpsRewrite |
| `filters/` | each predicate, isActive, serialize/deserialize round-trip; composeFilters AND-mode |
| `api/` | fetch wrapper retry/abort/dedupe/https-rewrite; endpoint URL building |
| `stores/` | ingestShows + genreIndex; paginator stop on 404; SWR; reset |
| `composables/` | debounced ref; virtual list windowing; keyboard grid; URL-state hydration; show search local+remote+abort |
| `components/` | ShowCard, SearchInput, Rating, AppImage, LazyMount |

`pnpm test:coverage` produces an HTML report under `coverage/`.

## What I'd do with more time

**DOMPurify** in place of the regex `stripHtml`. The regex handles TVMaze's actual summary HTML correctly, but a production app should use a DOM-based sanitizer for anything user-facing.

**Playwright e2e tests** covering the full user journey (browse → search → detail → back), plus a screen-reader smoke check. Unit tests don't catch the interaction gaps.

**i18n scaffolding** with `vue-i18n`. Strings are currently English-only and inline; extracting to a translation layer is a one-time investment that pays off fast on a banking product.

**Genre-by-genre lazy fetching** as an alternative to streaming all pages. Fetch detail data when a row first becomes visible, trading early completeness for less upfront network. Worth benchmarking on slower connections.

**`Set`-backed `genreIndex` buckets** in the store. Arrays + `includes`-check for dedup works fine at around 6k shows and 30 genres, but `Set` is O(1) and the change is trivial.

**Visual regression tests** (Chromatic or Percy).

## Deliberate omissions

No icon library. Inline SVG only, zero bundle weight. No date library either — `Intl.DateTimeFormat` and `new Date()` cover everything needed. No `lodash`, `vueuse`, or `fuse.js` — each equivalent was 10–30 LOC. No UI kit — every component is Tailwind utilities and auditable custom code.

## Project layout

```
src/
  api/           # tvmazeClient + endpoints
  components/    # presentational + composite components
  composables/   # useVirtualList, useShowSearch, useUrlState, etc.
  filters/       # filter registry + 3 filter implementations
  stores/        # Pinia stores (shows, ui)
  types/         # TVMaze + filter + ui types
  utils/         # pure functions (sort, score, highlight, strip-html, ...)
  views/         # route-level components
  router/        # vue-router config
  __tests__/     # global test setup + fixtures
  App.vue        # root: skip link, header, RouterView, footer
  main.ts        # app bootstrap
  main.css       # Tailwind import + @theme + base styles
```

Tests are colocated with their modules in `__tests__/` directories per the `tsconfig.vitest.json` glob.

## License

Take-home assessment — not for redistribution.
