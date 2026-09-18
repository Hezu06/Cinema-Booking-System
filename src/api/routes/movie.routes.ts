import express from 'express'
import movieController from '../controllers/movie.controller.js'

const movieRouter = express.Router()

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