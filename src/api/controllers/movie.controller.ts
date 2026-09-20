import type { Request, Response } from 'express'

import { MovieService } from '../../business/services/movie.service.js'

import {
  validateCreateMovie,
  validateUpdateMovie
} from '../validators/movie.validator.js'

export class MovieController {

  constructor(
    private readonly movieService: MovieService
  ) {}

  getAllMovies = async (_request: Request, response: Response) => {
    const movies = await this.movieService.getAllMovies()

    response.status(200).json({
      message: 'Get all movies',
      data: movies
    })
  }

  getMovieById = async (request: Request<{ id: string }>, response: Response) => {
    const { id } = request.params

    const movie = await this.movieService.getMovieById(id)

    if (!movie) {
      response.status(404).json({
        message: 'Movie not found'
      })

      return
    }

    response.status(200).json({
      message: `Get movie ${id}`,
      data: movie
    })
  }

  createMovie = async (request: Request, response: Response) => {
    const movieData = request.body

    const errors = validateCreateMovie(movieData)

    if (errors.length > 0) {
      response.status(400).json({
        message: 'validation failed',
        errors: errors
      })

      return
    }

    const movie = await this.movieService.createMovie(movieData)

    response.status(201).json({
      message: 'Movie created',
      movie: movie
    })
  }

  updateMovie = async (request: Request<{ id: string }>, response: Response) => {
    const { id } = request.params
    const newMovieData = request.body

    const errors = validateUpdateMovie(newMovieData)

    if (errors.length > 0) {
      response.status(400).json({
        message: 'validation failed',
        errors: errors
      })

      return
    }

    const movie = await this.movieService.updateMovie(id, newMovieData)

    if (!movie) {
      response.status(404).json({
        message: 'Movie not found'
      })
      return
    }

    response.status(200).json({
      message: 'Movie updated',
      movie: movie
    })
  }

  deleteMovie = async (request: Request<{ id: string }>, response: Response) => {
    const { id } = request.params

    const deletedMovie = await this.movieService.deleteMovie(id)

    if (!deletedMovie) {
      response.status(404).json({
        message: 'Movie not found'
      })

      return
    }

    response.status(200).json({
      message: 'Movie deleted successfully',
      movie: deletedMovie
    })
  }
}

