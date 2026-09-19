export enum MovieStatus {
  COMING_SOON = 'COMING_SOON',
  NOW_SHOWING = 'NOW_SHOWING',
  ENDED = 'ENDED'
}

export interface Movie {
  id: string,
  title: string,
  description: string,
  durationMinutes: number, // find a way to change to int later
  genre: string,
  releaseDate: Date,
  posterUrl: string,
  status: MovieStatus
}