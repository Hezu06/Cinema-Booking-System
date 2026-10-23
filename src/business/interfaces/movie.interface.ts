import type { 
  Movie,
  MovieStatus 
} from '../models/movie.model.js'

export interface MovieRepository {
  findAll(): Promise<Movie[]>
  findById(id: string): Promise<Movie | null>
  findByTitle(title: string): Promise<Movie | null>
  findByTitleAndReleaseDate(title: string, releaseDate: Date): Promise<Movie | null>
  findOldMovies(beforeDate: Date): Promise<Movie[]>
  create(data: CreateMovieData): Promise<Movie>
  update(id: string, data: UpdateMovieData): Promise<Movie | null>
  delete(id: string): Promise<Movie | null>
}

export interface CreateMovieData {
  title: string,
  description: string,
  durationMinutes: number, 
  genre: string,
  releaseDate: Date,
  posterUrl: string,
  status: MovieStatus
}

// '?' means optional. With exactOptionalPropertyTypes: true, '| undefined' allows values parsed from partial DTOs
export interface UpdateMovieData {
  title?: string | undefined,
  description?: string | undefined,
  durationMinutes?: number | undefined, 
  genre?: string | undefined,
  releaseDate?: Date | undefined,
  posterUrl?: string | undefined,
  status?: MovieStatus | undefined
}

export interface ExternalMovieData {
  title: string;
  description: string;
  durationMinutes: number;
  genre: string;
  releaseDate: Date;
  posterUrl: string;
  status: MovieStatus;
}

export interface ExternalMovieGateway {
  getNowPlayingMovies(): Promise<ExternalMovieData[]>;
}

export interface SyncMoviesOptions {
  autoCreateShowtimes?: boolean | undefined;
  markEndedOlderThanDays?: number | undefined;
}

export interface SyncMovieDetail {
  title: string;
  action: "CREATED" | "UPDATED" | "SKIPPED";
  status: MovieStatus;
  showtimesCount?: number | undefined;
}

export interface SyncMoviesResult {
  totalFetched: number;
  added: number;
  updated: number;
  markedEnded: number;
  showtimesCreated: number;
  details: SyncMovieDetail[];
}
