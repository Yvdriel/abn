import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  request,
  buildUrl,
  shouldRetry,
  EndOfPagesError,
  TvMazeApiError,
  _resetInFlightForTests,
} from '../tvmazeClient'

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
}

function errorResponse(status: number, headers: Record<string, string> = {}): Response {
  return new Response('', { status, statusText: `STATUS_${status}`, headers })
}

beforeEach(() => {
  _resetInFlightForTests()
  vi.useFakeTimers({ shouldAdvanceTime: true })
})

afterEach(() => {
  vi.useRealTimers()
})

describe('buildUrl', () => {
  it('joins relative paths to BASE_URL', () => {
    expect(buildUrl('/shows?page=0')).toBe('https://api.tvmaze.com/shows?page=0')
    expect(buildUrl('shows?page=0')).toBe('https://api.tvmaze.com/shows?page=0')
  })

  it('passes through absolute URLs', () => {
    expect(buildUrl('https://example.test/x')).toBe('https://example.test/x')
  })
})

describe('shouldRetry', () => {
  it('retries 429 and 5xx; not others', () => {
    expect(shouldRetry(429)).toBe(true)
    expect(shouldRetry(500)).toBe(true)
    expect(shouldRetry(502)).toBe(true)
    expect(shouldRetry(404)).toBe(false)
    expect(shouldRetry(401)).toBe(false)
    expect(shouldRetry(200)).toBe(false)
  })
})

describe('request', () => {
  it('returns parsed JSON on 200', async () => {
    const fetchMock = globalThis.fetch as unknown as ReturnType<typeof vi.fn>
    fetchMock.mockResolvedValueOnce(jsonResponse([{ id: 1 }]))
    const out = await request<unknown[]>('/shows?page=0')
    expect(out).toEqual([{ id: 1 }])
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('throws EndOfPagesError on 404', async () => {
    const fetchMock = globalThis.fetch as unknown as ReturnType<typeof vi.fn>
    fetchMock.mockResolvedValueOnce(errorResponse(404))
    await expect(request('/shows?page=999')).rejects.toBeInstanceOf(EndOfPagesError)
  })

  it('retries on 429 and succeeds', async () => {
    const fetchMock = globalThis.fetch as unknown as ReturnType<typeof vi.fn>
    fetchMock
      .mockResolvedValueOnce(errorResponse(429))
      .mockResolvedValueOnce(jsonResponse({ id: 1 }))

    const promise = request<{ id: number }>('/shows/1')
    await vi.runAllTimersAsync()
    expect(await promise).toEqual({ id: 1 })
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('retries 5xx up to 3 times then throws TvMazeApiError', async () => {
    const fetchMock = globalThis.fetch as unknown as ReturnType<typeof vi.fn>
    fetchMock.mockResolvedValue(errorResponse(500))

    const promise = request('/shows/1').catch((e) => e)
    await vi.runAllTimersAsync()
    const err = await promise
    expect(err).toBeInstanceOf(TvMazeApiError)
    expect(fetchMock).toHaveBeenCalledTimes(4) // 1 initial + 3 retries
  })

  it('honors Retry-After header', async () => {
    const fetchMock = globalThis.fetch as unknown as ReturnType<typeof vi.fn>
    fetchMock
      .mockResolvedValueOnce(errorResponse(429, { 'Retry-After': '2' }))
      .mockResolvedValueOnce(jsonResponse({ ok: true }))

    const promise = request('/x')
    await vi.runAllTimersAsync()
    await promise
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('aborts mid-flight', async () => {
    const fetchMock = globalThis.fetch as unknown as ReturnType<typeof vi.fn>
    fetchMock.mockImplementation(
      (_url, init: RequestInit) =>
        new Promise((_resolve, reject) => {
          init.signal?.addEventListener('abort', () => {
            reject(new DOMException('Aborted', 'AbortError'))
          })
        }),
    )
    const ctrl = new AbortController()
    const promise = request('/slow', { signal: ctrl.signal })
    ctrl.abort()
    await expect(promise).rejects.toMatchObject({ name: 'AbortError' })
  })

  it('dedupes concurrent identical requests', async () => {
    const fetchMock = globalThis.fetch as unknown as ReturnType<typeof vi.fn>
    fetchMock.mockResolvedValue(jsonResponse({ id: 1 }))
    const [a, b] = await Promise.all([request('/shows/1'), request('/shows/1')])
    expect(a).toEqual({ id: 1 })
    expect(b).toEqual({ id: 1 })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('rewrites http:// → https:// on tvmaze image hosts in response', async () => {
    const fetchMock = globalThis.fetch as unknown as ReturnType<typeof vi.fn>
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        image: {
          medium: 'http://static.tvmaze.com/x.jpg',
          original: 'http://static.tvmaze.com/o.jpg',
        },
      }),
    )
    const out = await request<{ image: { medium: string; original: string } }>('/shows/1')
    expect(out.image.medium).toBe('https://static.tvmaze.com/x.jpg')
    expect(out.image.original).toBe('https://static.tvmaze.com/o.jpg')
  })
})
