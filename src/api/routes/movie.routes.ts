import express from 'express'
import { container } from '../../config/container.js'
import { authMiddleware } from '../middlewares/auth.middleware.js'
import { requireAdmin } from '../middlewares/role.middleware.js'
import { validateRequest } from '../middlewares/validate.middleware.js'
import {
  createMovieSchema,
  updateMovieSchema,
  movieIdParamSchema,
} from '../validators/movie.validator.js'

const movieRouter = express.Router()

// Public endpoints (Customer & Admin xem danh sách và chi tiết phim - UC-03, UC-04)
movieRouter.get('/', container.movieController.getAllMovies)
movieRouter.get('/:id', validateRequest({ params: movieIdParamSchema }), container.movieController.getMovieById)

// Protected Admin endpoints (Chỉ Admin mới có quyền CRUD phim & sync - UC-10, BR-03)
movieRouter.post('/sync', authMiddleware, requireAdmin, container.movieController.syncMovies)
movieRouter.post('/', authMiddleware, requireAdmin, validateRequest({ body: createMovieSchema }), container.movieController.createMovie)
movieRouter.put('/:id', authMiddleware, requireAdmin, validateRequest({ params: movieIdParamSchema, body: updateMovieSchema }), container.movieController.updateMovie)
movieRouter.delete('/:id', authMiddleware, requireAdmin, validateRequest({ params: movieIdParamSchema }), container.movieController.deleteMovie)

export default movieRouter
