import {
  createRouter,
  createWebHistory,
  type RouteLocationNormalized,
  type RouteRecordRaw,
} from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'dashboard',
    component: () => import('@/views/DashboardView.vue'),
    meta: { title: 'Browse' },
  },
  {
    path: '/shows/:id(\\d+)',
    name: 'show',
    component: () => import('@/views/ShowDetailView.vue'),
    meta: { title: 'Show' },
    props: (route) => ({ id: Number(route.params.id) }),
  },
  {
    path: '/search',
    name: 'search',
    component: () => import('@/views/SearchResultsView.vue'),
    meta: { title: 'Search' },
  },
  {
    path: '/:catchAll(.*)*',
    name: 'not-found',
    component: () => import('@/views/NotFoundView.vue'),
    meta: { title: 'Not found' },
  },
]

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, saved) {
    if (saved) return saved
    if (to.path === from.path) return undefined
    return { top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' }
  },
})

router.afterEach((to: RouteLocationNormalized) => {
  if (typeof document === 'undefined') return
  const meta = (to.meta as { title?: string }).title ?? 'TV Shows'
  document.title = `${meta} · ABN AMRO Shows`
})

export default router
