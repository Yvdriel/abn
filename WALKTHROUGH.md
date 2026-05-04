# Code walkthrough

A guided tour of the codebase for review before handing it over. Read this in order. Each section says **what to read**, **what to verify**, and **rough edges to flag**.

---

## 0. Quick sanity (2 min)

```sh
pnpm install
pnpm type-check    # 0 errors
pnpm lint          # 0 errors
pnpm test:unit run # 119 passing
pnpm build         # ~25 KB gzipped main JS, ~6 KB CSS
pnpm dev           # http://localhost:5173 (or 5174)
```

If any of these fail on your machine, that's the first thing to fix — don't read further until they pass.

---

## 1. Read `PLAN.md` first

`./PLAN.md` is the document we agreed on before implementing. It contains the architectural decisions, the type shapes, and the open questions. The implementation should match it. **Where the implementation diverges, I've noted it below in §8.**

---

## 2. Bottom-up tour

Read in this order. Each layer only depends on layers above it, so you can validate each in isolation.

### 2.1 Types (`src/types/`)

- `tvmaze.ts` — wire types for the TVMaze API. **Verify against** [TVMaze API docs](https://www.tvmaze.com/api). The `_embedded` shape on `TvMazeShow` is what `GET /shows/:id?embed[]=cast&embed[]=episodes` returns.
- `filter.ts` — `FilterDefinition<P>` is the contract every filter satisfies. `serialize` returns `undefined` when inactive so the URL stays clean.
- `ui.ts` — `ShowsState` includes `sortedByGenre` and `languages` which are **precomputed at write-time** for performance (see §6).

### 2.2 Pure utils (`src/utils/`)

Each file is pure and individually testable. Read the file then its `__tests__/`. Six files, ~40 LOC each:

- `sortByRating.ts` — descending by rating, nulls last, tiebreak weight desc → id asc.
- `score.ts` — exact 100 / starts-with 60 / contains 30 / 0.
- `highlight.ts` — case-insensitive substring split for `<mark>` rendering.
- `stripHtml.ts` — allow-list HTML stripper for show summaries. **This is intentionally not DOMPurify** — see README's "what I'd do with more time."
- `httpsRewrite.ts` — recursively replaces `http://(api|static).tvmaze.com` with `https://`. Narrowed to TVMaze hosts only (deviation from PLAN — see §8).
- `formatDate.ts` — `Intl.DateTimeFormat` wrapper.

**Verify**: read 2-3 test files. The cases should be the spec.

### 2.3 Filters (`src/filters/`)

- `genreFilter.ts`, `minRatingFilter.ts`, `languageFilter.ts` — three implementations of `FilterDefinition<P>`. Each is ~25 LOC.
- `registry.ts` — registers them; `getFilter(id)` is the lookup.
- `compose.ts` — AND-composes active filters into a single predicate. `TODO` comment marks where to switch to OR mode.

**Verify**: each filter has 4 cases — predicate match, predicate miss, `isActive` correctness, serialize/deserialize round-trip.

### 2.4 API layer (`src/api/`)

- `tvmazeClient.ts` — the heart of the network layer. Read the whole file (~120 LOC). It does:
  - **Retry** on `429` and `5xx` (max 3, delays 500/1000/2000 ms, honors `Retry-After` capped at 5 s).
  - **404 → `EndOfPagesError`** (typed; the paginator catches this to know when to stop).
  - **Dedupe** of concurrent identical GETs via an in-flight `Map`.
  - **HTTPS rewrite** of the response (calls `rewriteHttpsDeep`).
  - **Abort** propagation via `signal`.
- `endpoints.ts` — five thin functions: `getShowsPage`, `getShow`, `searchShows`, `getShowCast`, `getShowEpisodes`. Trivial.

**Verify**: `tvmazeClient.spec.ts` has 8 cases covering retry, dedupe, abort, https-rewrite. The cases are the contract.

### 2.5 Stores (`src/stores/`)

This is where the bulk of the logic lives. Read carefully.

- `ui.ts` (~80 LOC) — straightforward. State is `searchQuery` + `activeFilters`. Has a `serializeToQuery` ↔ `hydrateFromUrl` round-trip used by `useUrlState`.

- `shows.ts` (~220 LOC) — the most important file in the codebase. Read top to bottom:
  - `emptyState()` defines the shape.
  - `ingestShows` (lines 30–62) is the hot path. **Note `markRaw(show)`** — shows are immutable wire data, so we skip Vue's deep proxying. Without this, every paginator tick deep-proxies hundreds of fields × hundreds of shows = perf disaster (this is what the user reported).
  - `ingestShows` also rebuilds `sortedByGenre[key]` only for genre keys that were touched this batch. **Untouched `<GenreRow>` components don't re-render** because their reactive dep wasn't reassigned. This is the second perf optimization.
  - `ingestShows` populates `state.languages[lang] = true` incrementally (third perf optimization — `FilterBar` no longer iterates all of `byId`).
  - `startBackgroundPaginator` uses a self-rescheduling `setTimeout` chain (not `setInterval`) so each tick waits for the previous to settle. Stops on `EndOfPagesError`, surfaces error otherwise.
  - `fetchShowDetail` is **SWR**: serves cached if present + embedded + < 5 min old; otherwise refetches.
  - `showsByGenre` is now O(1) — just `state.sortedByGenre[key.toLowerCase()]`.

**Verify**: `shows.spec.ts` has 12 cases. The most load-bearing are the genre indexing tests, the paginator-stop test, and the SWR test.

### 2.6 Composables (`src/composables/`)

Each is self-contained. Read in this order:

- `useDebouncedRef.ts` (~20 LOC) — primitive, used by search and URL writeback.
- `usePrefersReducedMotion.ts` (~20 LOC) — reactive `matchMedia` wrapper.
- `useFocusOnRouteChange.ts` (~17 LOC) — moves focus to `[data-route-heading]` on route change.
- `useUrlState.ts` (~55 LOC) — bidirectional UI store ↔ `route.query`. **Read carefully** — the write side is debounced 250 ms and uses `router.replace` to avoid history spam.
- `useShowSearch.ts` (~95 LOC) — hybrid local + remote search with `AbortController`. Local first (debounced 300 ms), remote fires only when local < 5.
- `useVirtualList.ts` (~100 LOC) — fixed-size horizontal/vertical windowing, RAF-throttled scroll, ResizeObserver, `transform: translateX(...)`.
- `useKeyboardGrid.ts` (~70 LOC) — arrow/Home/End/PageUp/PageDown/Enter handler with bounds clamping. **WARNING**: built but **not actually wired into `GenreRow`** — see §8.

### 2.7 Components (`src/components/`)

Atoms (read briefly):
- `AppImage.vue`, `Skeleton.vue`, `Rating.vue`, `ProgressBar.vue`, `LazyMount.vue`, `BackLink.vue`, `EmptyState.vue`, `ErrorState.vue`.
- `Skeleton.vue` is named `AppSkeleton` and `Rating.vue` is named `ShowRating` via `defineOptions({ name: ... })` to satisfy `vue/multi-word-component-names`.

Composites (read in detail):
- `ShowCard.vue` — handles null image (placeholder), null rating ("—"), empty name ("Untitled"), search highlight via `splitForHighlight`.
- `GenreRow.vue` — wraps content in `LazyMount`, then horizontal virtualized strip via `useVirtualList`. Note: the row's `shows` is just `store.showsByGenre(key)` — O(1).
- `SearchInput.vue` — debounced two-way binding with the UI store. Enter → push `/search?q=…`. Escape → clear + blur. Clear button.
- `FilterBar.vue` — uses `<details>` for genre + language dropdowns. Min-rating is a native `<input type="range">`.
- `CastList.vue`, `EpisodeList.vue` — used by `ShowDetailView`. Cast collapses past 12; episodes are grouped by season.
- `AppHeader.vue`, `AppFooter.vue`, `AppShell.vue` — layout chrome. AppShell has the skip-link.

### 2.8 Views (`src/views/`)

- `DashboardView.vue` (~50 LOC) — `<h1>` + `FilterBar` + N × `<GenreRow>`. **Has a fast path** for the no-active-filters case to avoid `.filter(predicate)` iteration.
- `ShowDetailView.vue` (~75 LOC) — header + summary + `CastList` + `EpisodeList`. Loads via `store.fetchShowDetail(id)` on mount/id-change.
- `SearchResultsView.vue` (~45 LOC) — reads `?q=`, calls `useShowSearch`, renders responsive grid.
- `NotFoundView.vue` — catch-all.

### 2.9 Router (`src/router/index.ts`)

~50 LOC. Routes are dynamically imported (code-splitting). `scrollBehavior` honors `prefers-reduced-motion`. `afterEach` updates `document.title` from `meta.title`.

### 2.10 Bootstrap

- `src/main.ts` — Pinia + router + `main.css`. Untouched from scaffold (intentional — minimal boilerplate).
- `src/App.vue` — mounts `useUrlState()` + `useFocusOnRouteChange()`, kicks off `fetchFirstPage().then(startBackgroundPaginator)`.
- `src/main.css` — Tailwind v4 import + `@theme` block + base focus styles + `prefers-reduced-motion` override.
- `index.html` — `<html lang="en">`, branded title, viewport, description meta.

---

## 3. What to demo in the browser

Run `pnpm dev`, open the URL. In order:

1. **Initial paint** — within ~500 ms, you should see the dashboard with one or two genre rows of cards. Footer shows a progress bar that creeps right.
2. **Streaming** — leave the page alone for ~25 seconds. Watch the footer progress reach 100%, more rows appear, existing rows fill out. **The page should stay responsive throughout** (this is what the perf fix in §6 is for).
3. **Click a card** — should route to `/shows/:id`. Cast and episodes load. Click "Back" — return to dashboard. Page focus moves to the new view's `<h1>` on each route change (use Tab to verify — the focus ring should be on the heading).
4. **Search** — type in the header search box. After 300 ms, results appear inline against the catalog. Press Enter — routes to `/search?q=…`. Refresh that page. URL preserves query. Results re-render.
5. **Filters** — open the Genres dropdown, check 1–2 boxes. Rows that don't match disappear. URL updates with `?genre=…`. Drag the rating slider. URL updates `?minRating=…`. Refresh the page — filters restored.
6. **Browser back/forward** — should work like a normal SPA.
7. **Keyboard test** — press Tab from the URL bar. The first focused element should be the "Skip to main content" link. Then header → search → cards. Visible focus ring everywhere.
8. **Mobile/responsive** — open DevTools, switch to mobile width (360 px). Layout adapts; cards still readable; horizontal scroll still works on rows.
9. **DevTools Network tab** — reload. You should see `/shows?page=0` first, then `?page=1`, `?page=2`, … at ~300 ms intervals, ending in a 404 that the app handles cleanly (no error toast).
10. **Reduced motion** — in macOS System Settings → Accessibility → Display → Reduce Motion. Reload. Skeletons no longer pulse, scrolling on route change is instant.

---

## 4. Test coverage at a glance

`pnpm test:coverage` produces an HTML report under `coverage/index.html`. Quick read:

| Layer | Coverage | Notes |
|---|---|---|
| `utils/` | ~98% | All pure functions exhaustively tested |
| `filters/` | ~100% | Predicates + serialize round-trips |
| `api/` | ~79% | Retry/abort/dedupe/https-rewrite all tested |
| `stores/` | ~78% | Genre indexing + paginator + SWR |
| `composables/` | ~75% | Debounce, virtual list, keyboard grid, URL state, search |
| `components/` | ~30% | Only the high-leverage ones tested (ShowCard, SearchInput, AppImage, Rating, LazyMount) |
| `views/` | 0% | Integration concerns; not unit-tested |

If a reviewer wants to see specific tests, point them at `src/utils/__tests__/sortByRating.spec.ts` (illustrates style) and `src/api/__tests__/tvmazeClient.spec.ts` (most non-trivial).

---

## 5. The package discipline argument

In your README and (if asked) cover note, lean on this. The brief explicitly preferred candidates who avoid scaffolding/plugins. **One** non-trivial dependency was added: `@vitest/coverage-v8` (devDep, for the coverage report cited in this doc). Everything else is core (vue, pinia, vue-router, vite, tailwind, vitest).

Things deliberately not added — explain in the README why each was rejected:
- `axios` — native fetch + ~120 LOC wrapper does retry/abort/dedupe/https-rewrite.
- `lodash` / `vueuse` — debounce is 20 LOC.
- `fuse.js` — TVMaze `/search/shows` is server-side fuzzy; local scoring is 15 LOC.
- `dompurify` — allow-list regex stripper for the narrow use case (show summaries). Document the production answer.
- `vue-virtual-scroller` / `@tanstack/vue-virtual` — self-rolled `useVirtualList` is 100 LOC.
- `date-fns` / `dayjs` — `Intl.DateTimeFormat` is fine.
- Any UI library or icon library — Tailwind utilities + inline SVG.

---

## 6. The performance fix

If the reviewer asks about perf, here's the story. The original implementation streamed pages every 300 ms. Each page mutated `byId` and `genreIndex`, which in turn invalidated three reactive layers:

1. Vue 3's deep proxy for `state.byId` was wrapping every nested field of every show — hundreds of proxies per show × thousands of shows = the dominant ingest cost.
2. `showsByGenre(key)` rebuilt + sorted the bucket on every call, and `DashboardView.filteredGenres` invoked it for all 30 genres on every paginator tick.
3. `FilterBar.allLanguages` iterated all of `byId` on every change.

The fix (committed in this codebase) was three coordinated changes:

1. **`markRaw(show)` on insert** in `ingestShows`. Shows are wire data; we never mutate them in place.
2. **Precomputed `state.sortedByGenre`** at write-time. `ingestShows` collects touched genre keys and rebuilds those sorted slices only. Reads are O(1). Untouched `<GenreRow>` components don't re-render.
3. **Precomputed `state.languages`** at write-time, populated incrementally during ingest.

Plus a fast path in `DashboardView.filteredGenres` to skip `.filter(predicate)` iteration when no filters are active.

If asked "would you do anything different?": yes — this is the kind of thing I'd profile first in a real codebase rather than relying on intuition. With Chrome's Performance panel + Vue DevTools' performance tab, you'd see the deep-proxy creation as the top hot frame.

---

## 7. Accessibility argument (the EAA hook)

The European Accessibility Act entered force on **28 June 2025** for financial services in the EU, making WCAG 2.1 AA a legal requirement for ABN AMRO's customer-facing products. Building with this in mind, unprompted, is the strongest senior signal you can send. Mention it in the README. Specifics implemented:

- Skip-to-main-content link (`AppShell.vue`).
- Semantic landmarks (`<header>`, `<main id="main" tabindex="-1">`, `<footer>`, `role="region"` on each genre row with `aria-labelledby`).
- Route-change focus management (`useFocusOnRouteChange`).
- `:focus-visible` rings everywhere; `outline: none` is never used without replacement.
- Image alt text required by the `<AppImage>` prop type.
- `prefers-reduced-motion` honored in `Skeleton`, `usePrefersReducedMotion`, the router's `scrollBehavior`, and a global CSS rule in `main.css`.
- Color contrast: emerald-600 on white = ~4.7:1 (passes AA for normal text).

What's NOT done that you might want to add:
- Real screen-reader QA (VoiceOver / NVDA pass).
- Lighthouse / axe-core automated audit run.
- High-contrast mode test.

---

## 8. Rough edges — read this before submitting

These are the legitimate gaps. A reviewer will spot some of them; better to lead with awareness in your cover note than be caught off-guard.

### Functional gaps

1. **Filters don't filter the contents of genre rows** — only whether each row renders. If a user enables `minRating: 8`, drama row still shows all drama shows, not just those rated ≥ 8. Fix: add a filter step in `GenreRow.vue` between `store.showsByGenre(key)` and the virtual list, or expose a `filteredShowsByGenre(key, predicate)` getter from the store. Note: this would re-introduce per-row predicate iteration, so cache the result if you do this.

2. **`useKeyboardGrid` is built and tested but not actually consumed** — it's not imported into `GenreRow` or `DashboardView`. Native horizontal-scroll keyboard nav (Tab through cards) works, but there's no roving-tabindex grid as the PLAN promised. Either wire it in (~30 LOC across `DashboardView` and `GenreRow`) or trim it from the plan/README claims.

3. **`useFocusOnRouteChange` may steal focus on initial load** — `App.vue` mounts it, and the watcher fires once on the initial route. Test by tabbing into the page and checking whether focus ends up on the dashboard `<h1>` immediately. If so, change the composable to skip the first invocation (`let first = true` guard).

### Quality / polish gaps

4. **No view-level tests** — `DashboardView`, `ShowDetailView`, `SearchResultsView` have 0% coverage. They're integration concerns, but a senior reviewer might want at least a smoke-mount test per view.

5. **`stripHtml` is regex-based, not DOM-based** — documented as a known limitation, but the regex isn't bulletproof against pathological inputs (nested malformed tags, etc.). For an actual bank, use DOMPurify. Mentioned in the README's "what I'd do with more time."

6. **Unusual versions in `package.json`**: TypeScript `~6.0.0`, Vite `^8.0.8`, vue-router `^5.0.4`. These are inherited from the scaffold the assessment was started in. **Verify they install cleanly on a fresh machine** — `pnpm install` from a cold cache. If any package isn't published yet, downgrade to the latest published. (vue-router 5 was the announced major; verify it's GA.)

7. **`@vitest/coverage-v8` is a new dep** — the only one added. Justify in the README as "required for the coverage report."

8. **Coverage report excludes `src/main.ts`, `src/router/**`, `src/types/**`** — set in `vitest.config.ts`. If reviewer challenges low view coverage, point at this exclusion list and the integration argument.

### Spec deviations from PLAN.md

9. **HTTPS rewrite is narrowed to TVMaze hostnames only** (`utils/httpsRewrite.ts`). The PLAN said "all `http://` URLs in responses." Rationale: TVMaze sometimes embeds external `http://` links in show summaries (e.g., references to external articles), and blanket rewriting could corrupt those. Documented in PLAN §8.11.

10. **Tests live in `src/**/__tests__/`, not `tests/unit/`** — matches the existing `tsconfig.vitest.json` glob in the scaffold. PLAN §8.4 documents the choice.

11. **`Uncategorized` bucket** — shows with empty `genres[]` are bucketed under `'uncategorized'` and rendered last. Documented in PLAN §8.3 and the README.

### Code-style observations

12. **`oxfmt` style is no-semicolons + single-quote**. All code conforms; `pnpm format` is idempotent. Don't switch to Prettier without removing oxfmt.

13. **`!` non-null assertions** appear in a few places (e.g., `RETRY_DELAYS_MS[attempt]!`, `state.genreIndex[key]!`). They're justified by `noUncheckedIndexedAccess: true` + control-flow guarantees, but a strict reviewer might prefer explicit `if (x === undefined) throw …` checks. Personal taste.

14. **`<details>` for filter dropdowns isn't a true menu pattern** — keyboard arrow nav within the dropdown is native checkbox tab order, not a menu pattern with `role="menu"` / arrow keys. For a banking product, consider a real disclosure menu component. For a take-home, fine.

---

## 9. Things you might want to change before submission

In rough priority order:

1. **Wire `useKeyboardGrid` into `GenreRow` and `DashboardView`** (or remove the claim). High signal-to-effort. ~30 LOC.
2. **Apply filters to genre row contents** (#1 in §8). Real UX bug.
3. **Add 1–2 view-level smoke tests** (`DashboardView` mounts and renders genre rows from a seeded store; `ShowDetailView` shows a loading skeleton then a populated header).
4. **Verify version numbers in `package.json` install cleanly on a fresh `pnpm install`**. If anything's unpublished, downgrade.
5. **Run a quick Lighthouse audit on the deployed `/`** — Performance and Accessibility scores are talking points.
6. **Re-record the coverage table in the README** after changes, with the actual numbers from your machine.
7. **Cover note**: lead with the five strongest decisions (streaming paginator, normalized store + `markRaw`, filter registry, self-rolled virtual scroll, EAA-aware a11y). Don't bury them in the README.

---

## 10. If a reviewer asks "what would you do with more time"

This is essentially the README's "what I'd do with more time" section. Memorize it:

- **DOMPurify** for the show-summary HTML (replace the regex stripper).
- **e2e tests** with Playwright — the golden journey (browse → search → detail → back) plus a screen-reader smoke check.
- **i18n** scaffolding — `vue-i18n`, extract strings, support `en` + `nl`.
- **IndexedDB cache** with 24h TTL — second-visit instant load, eliminates the streaming wait entirely.
- **Lazy genre-page fetching** instead of streaming all 75 pages — fetch on demand as user scrolls (trade completeness for less network).
- **Per-row sort caching** in the store (already done) but also per-genre filter caching (memoize `filteredShowsByGenre(key, predicateId)`).
- **Visual regression tests** (Chromatic / Percy).
- **Real keyboard grid** with full roving tabindex semantics (currently the composable exists but isn't wired in).
- **Web Vitals** instrumentation (CLS, LCP, INP) so you can prove the perf claims.
