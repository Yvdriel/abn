import type { TvMazeShow } from '@/types/tvmaze'

const DEFAULTS: TvMazeShow = {
  id: 1,
  url: 'https://www.tvmaze.com/shows/1',
  name: 'Test Show',
  type: 'Scripted',
  language: 'English',
  genres: ['Drama'],
  status: 'Running',
  runtime: 60,
  averageRuntime: 60,
  premiered: '2020-01-01',
  ended: null,
  officialSite: null,
  schedule: { time: '21:00', days: ['Monday'] },
  rating: { average: 8 },
  weight: 50,
  network: null,
  webChannel: null,
  image: { medium: 'https://example.test/m.jpg', original: 'https://example.test/o.jpg' },
  summary: null,
  updated: 0,
}

export function makeShow(overrides: Partial<TvMazeShow> = {}): TvMazeShow {
  return { ...DEFAULTS, ...overrides }
}
