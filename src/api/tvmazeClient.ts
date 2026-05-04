import { rewriteHttpsDeep } from '@/utils/httpsRewrite'

export const BASE_URL = 'https://api.tvmaze.com'
const RETRY_DELAYS_MS = [500, 1000, 2000]
const MAX_RETRY_AFTER_MS = 5000

export interface RequestOptions {
  signal?: AbortSignal
  retry?: boolean
}

export class TvMazeApiError extends Error {
  readonly status: number
  readonly statusText: string
  readonly url: string
  constructor(status: number, statusText: string, url: string) {
    super(`TVMaze ${status} ${statusText} at ${url}`)
    this.name = 'TvMazeApiError'
    this.status = status
    this.statusText = statusText
    this.url = url
  }
}

export class EndOfPagesError extends Error {
  readonly url: string
  constructor(url: string) {
    super(`End of pages at ${url}`)
    this.name = 'EndOfPagesError'
    this.url = url
  }
}

export function buildUrl(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  return `${BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`
}

export function shouldRetry(status: number): boolean {
  return status === 429 || (status >= 500 && status < 600)
}

export function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'))
      return
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort)
      resolve()
    }, ms)
    const onAbort = (): void => {
      clearTimeout(timer)
      reject(new DOMException('Aborted', 'AbortError'))
    }
    signal?.addEventListener('abort', onAbort, { once: true })
  })
}

function parseRetryAfter(headerValue: string | null): number | null {
  if (!headerValue) return null
  const seconds = Number(headerValue)
  if (Number.isFinite(seconds)) {
    return Math.min(seconds * 1000, MAX_RETRY_AFTER_MS)
  }
  const date = new Date(headerValue).getTime()
  if (!Number.isNaN(date)) {
    const ms = date - Date.now()
    if (ms > 0) return Math.min(ms, MAX_RETRY_AFTER_MS)
  }
  return null
}

const inFlight = new Map<string, Promise<unknown>>()

export function _resetInFlightForTests(): void {
  inFlight.clear()
}

export async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const url = buildUrl(path)
  const cacheKey = `GET ${url}`

  const existing = inFlight.get(cacheKey)
  if (existing) return existing as Promise<T>

  const promise = (async (): Promise<T> => {
    const retryEnabled = opts.retry !== false
    let attempt = 0
    while (true) {
      let response: Response
      try {
        response = await fetch(url, { signal: opts.signal })
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') throw err
        if (!retryEnabled || attempt >= RETRY_DELAYS_MS.length) throw err
        await delay(RETRY_DELAYS_MS[attempt]!, opts.signal)
        attempt++
        continue
      }

      if (response.ok) {
        const json = (await response.json()) as unknown
        return rewriteHttpsDeep(json) as T
      }

      if (response.status === 404) {
        throw new EndOfPagesError(url)
      }

      if (retryEnabled && shouldRetry(response.status) && attempt < RETRY_DELAYS_MS.length) {
        const retryAfter = parseRetryAfter(response.headers.get('Retry-After'))
        const wait = retryAfter ?? RETRY_DELAYS_MS[attempt]!
        await delay(wait, opts.signal)
        attempt++
        continue
      }

      throw new TvMazeApiError(response.status, response.statusText, url)
    }
  })()

  inFlight.set(cacheKey, promise)
  const cleanup = (): void => {
    if (inFlight.get(cacheKey) === promise) inFlight.delete(cacheKey)
  }
  // Use two-arg .then so the chained promise never rejects (no unhandled rejection),
  // while the caller still receives the original `promise` with its rejection intact.
  void promise.then(cleanup, cleanup)
  return promise
}
