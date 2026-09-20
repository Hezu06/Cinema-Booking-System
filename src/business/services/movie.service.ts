import type {
  MovieRepository,
  CreateMovieData,
  UpdateMovieData,
} from '../interfaces/movie.interface.js'

export class MovieService {

  // 'private' means the property is only accessible inside the class.
  // 'readonly' means we don't intend to replace the repository later.
  constructor(
    private readonly movieRepository: MovieRepository
  ) {}

  async getAllMovies() {
    return this.movieRepository.findAll()
  }

  async getMovieById(id: string) {
    return this.movieRepository.findById(id)
  }

  async createMovie(data: CreateMovieData) {
    const newMovie = {
      ...data,
      releaseDate: new Date(data.releaseDate) 
      // JSON has no Date type => Need to handle conversion from string to Date
    }

    return this.movieRepository.create(newMovie)
  }

  async updateMovie(
    id: string,
    data: UpdateMovieData
  ) {
    const updatedData = {
      ...data,
      ...(data.releaseDate ? { releaseDate: new Date(data.releaseDate) } : {})
    }

    return this.movieRepository.update(id, updatedData)
  }

  async deleteMovie(
    id: string
  ) {
    return this.movieRepository.delete(id)
  }
}