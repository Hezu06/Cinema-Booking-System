import { 
  type Movie,
  MovieStatus 
} from '../models/movie.model.js'

export interface MovieRepository {
  findAll(): Promise<Movie[]>
  findById(id: string): Promise<Movie | null>
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

// '?' means optional. It is not neccessary to update all fields of a movie. 
export interface UpdateMovieData {
  title?: string,
  description?: string,
  durationMinutes?: number, 
  genre?: string,
  releaseDate?: Date,
  posterUrl?: string,
  status?: MovieStatus
}