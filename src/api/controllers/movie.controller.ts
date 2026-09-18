import type { Request, Response } from 'express'

const getAllMovies = async (request: Request, response: Response) => {
  // const movies = await movieService.getAllMovies()

  response.status(200).json({
    message: 'Get all movies'
  })
}

const getMovieById = async (request: Request, response: Response) => {
  const { id } = request.params

  // const movie = movieService.getMovieById(id)

  response.status(200).json({
    message: `Get movie ${id}`
  })
}

const createMovie = async (request: Request, response: Response) => {
  const movieData = request.body

  // const movie = await movieService.createMovie(movieData)

  response.status(201).json({
    message: 'Movie created',
    data: movieData
  })
}

const updateMovie = async (request: Request, response: Response) => {
  const { id } = request.params
  const newMovieData = request.body

  // const movie = await movieService.updateMovie(id, newMovieData)

  response.status(200).json({
    id,
    ...newMovieData
  })
}

const deleteMovie = async (request: Request, response: Response) => {
  const { id } = request.params

  // await movieService.deleteMovie(id)

  response.status(204).send()
}

export default {
  getAllMovies,
  getMovieById,
  createMovie,
  updateMovie,
  deleteMovie
}

