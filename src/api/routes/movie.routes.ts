import express from 'express'

import { MovieController } from '../controllers/movie.controller.js'
import { MovieService } from '../../business/services/movie.service.js'
import { PrismaMovieRepository } from '../../data-access/repositories/movie.repository.js'
import { authMiddleware } from '../middlewares/auth.middleware.js'
import { requireAdmin } from '../middlewares/role.middleware.js'

const movieRouter = express.Router()

const movieRepository = new PrismaMovieRepository()
const movieService = new MovieService(movieRepository)
const movieController = new MovieController(movieService)

// Public endpoints (Customer & Admin xem danh sách và chi tiết phim - UC-03, UC-04)
movieRouter.get('/', movieController.getAllMovies)
movieRouter.get('/:id', movieController.getMovieById)

// Protected Admin endpoints (Chỉ Admin mới có quyền CRUD phim - UC-10, BR-03)
movieRouter.post('/', authMiddleware, requireAdmin, movieController.createMovie)
movieRouter.put('/:id', authMiddleware, requireAdmin, movieController.updateMovie)
movieRouter.delete('/:id', authMiddleware, requireAdmin, movieController.deleteMovie)

export default movieRouter