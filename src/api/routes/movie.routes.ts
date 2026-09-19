import express from 'express'

import { MovieController } from '../controllers/movie.controller.js'
import { MovieService } from '../../business/services/movie.service.js'
import { PrismaMovieRepository } from '../../data-access/repositories/movie.repository.js'

const movieRouter = express.Router()

const movieRepository = new PrismaMovieRepository()
const movieService = new MovieService(movieRepository)
const movieController = new MovieController(movieService)

movieRouter.get(
  '/', 
  movieController.getAllMovies
)

movieRouter.get(
  '/:id', 
  movieController.getMovieById
)

movieRouter.post(
  '/', 
  movieController.createMovie
)

movieRouter.put(
  '/:id', 
  movieController.updateMovie
)

movieRouter.delete(
  '/:id', 
  movieController.deleteMovie
)

export default movieRouter