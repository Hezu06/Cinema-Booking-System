import type {
  MovieRepository,
  CreateMovieData,
  UpdateMovieData,
} from '../interfaces/movie.interface.js'

export class MovieService {
  constructor(private readonly movieRepository: MovieRepository) {}

  async getAllMovies() {
    return this.movieRepository.findAll()
  }

  async getMovieById(id: string) {
    return this.movieRepository.findById(id)
  }

  async createMovie(data: CreateMovieData) {
    const releaseDate = new Date(data.releaseDate)
    const trimmedTitle = data.title.trim()

    const existingMovie = await this.movieRepository.findByTitleAndReleaseDate(
      trimmedTitle,
      releaseDate
    )

    if (existingMovie) {
      throw new Error(
        `Phim '${trimmedTitle}' với ngày giờ phát hành này đã tồn tại trong hệ thống`
      )
    }

    const newMovie: CreateMovieData = {
      ...data,
      title: trimmedTitle,
      releaseDate: releaseDate,
    }

    return this.movieRepository.create(newMovie)
  }

  async updateMovie(id: string, data: UpdateMovieData) {
    const currentMovie = await this.movieRepository.findById(id)
    if (!currentMovie) {
      return null
    }

    const targetTitle =
      data.title !== undefined ? data.title.trim() : currentMovie.title
    const targetReleaseDate =
      data.releaseDate !== undefined
        ? new Date(data.releaseDate)
        : currentMovie.releaseDate

    // Nếu tiêu đề hoặc ngày giờ phát hành thay đổi, kiểm tra xung đột với các phim khác
    if (
      targetTitle !== currentMovie.title ||
      targetReleaseDate.getTime() !== currentMovie.releaseDate.getTime()
    ) {
      const conflictMovie = await this.movieRepository.findByTitleAndReleaseDate(
        targetTitle,
        targetReleaseDate
      )

      if (conflictMovie && conflictMovie.id !== id) {
        throw new Error(
          `Phim '${targetTitle}' với ngày giờ phát hành này đã tồn tại trong hệ thống`
        )
      }
    }

    const updatedData: UpdateMovieData = {
      ...data,
      ...(data.title !== undefined ? { title: targetTitle } : {}),
      ...(data.releaseDate !== undefined ? { releaseDate: targetReleaseDate } : {}),
    }

    return this.movieRepository.update(id, updatedData)
  }

  async deleteMovie(id: string) {
    return this.movieRepository.delete(id)
  }
}