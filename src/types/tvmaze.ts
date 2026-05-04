export type TvMazeShowStatus =
  | 'Running'
  | 'Ended'
  | 'To Be Determined'
  | 'In Development'
  | (string & {})

export interface TvMazeRating {
  average: number | null
}

export interface TvMazeImage {
  medium: string | null
  original: string | null
}

export interface TvMazeCountry {
  name: string
  code: string
  timezone: string
}

export interface TvMazeNetwork {
  id: number
  name: string
  country: TvMazeCountry | null
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
