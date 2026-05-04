import type {
  TvMazeShow,
  TvMazeSearchResult,
  TvMazeCastMember,
  TvMazeEpisode,
  EmbedKey,
} from '@/types/tvmaze'
import { request, type RequestOptions } from './tvmazeClient'

export function getShowsPage(page: number, opts?: RequestOptions): Promise<TvMazeShow[]> {
  return request<TvMazeShow[]>(`/shows?page=${page}`, opts)
}

export function getShow(
  id: number,
  embed?: EmbedKey[],
  opts?: RequestOptions,
): Promise<TvMazeShow> {
  const query = embed && embed.length > 0 ? `?${embed.map((k) => `embed[]=${k}`).join('&')}` : ''
  return request<TvMazeShow>(`/shows/${id}${query}`, opts)
}

export function searchShows(q: string, opts?: RequestOptions): Promise<TvMazeSearchResult[]> {
  return request<TvMazeSearchResult[]>(`/search/shows?q=${encodeURIComponent(q)}`, opts)
}

export function getShowCast(id: number, opts?: RequestOptions): Promise<TvMazeCastMember[]> {
  return request<TvMazeCastMember[]>(`/shows/${id}/cast`, opts)
}

export function getShowEpisodes(id: number, opts?: RequestOptions): Promise<TvMazeEpisode[]> {
  return request<TvMazeEpisode[]>(`/shows/${id}/episodes`, opts)
}
