import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getShowsPage, getShow, searchShows } from '../endpoints'
import { _resetInFlightForTests } from '../tvmazeClient'

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

beforeEach(() => {
  _resetInFlightForTests()
})

describe('endpoints', () => {
  it('getShowsPage builds /shows?page=N', async () => {
    const fetchMock = globalThis.fetch as unknown as ReturnType<typeof vi.fn>
    fetchMock.mockResolvedValueOnce(jsonResponse([]))
    await getShowsPage(2)
    expect(fetchMock).toHaveBeenCalledWith('https://api.tvmaze.com/shows?page=2', expect.anything())
  })

  it('getShow with embeds builds the right query', async () => {
    const fetchMock = globalThis.fetch as unknown as ReturnType<typeof vi.fn>
    fetchMock.mockResolvedValueOnce(jsonResponse({ id: 1 }))
    await getShow(1, ['cast', 'episodes'])
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.tvmaze.com/shows/1?embed[]=cast&embed[]=episodes',
      expect.anything(),
    )
  })

  it('searchShows url-encodes the query', async () => {
    const fetchMock = globalThis.fetch as unknown as ReturnType<typeof vi.fn>
    fetchMock.mockResolvedValueOnce(jsonResponse([]))
    await searchShows('the crown')
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.tvmaze.com/search/shows?q=the%20crown',
      expect.anything(),
    )
  })
})
