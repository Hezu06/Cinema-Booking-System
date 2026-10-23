import express from 'express'

import { MovieController } from '../controllers/movie.controller.js'
import { MovieService } from '../../business/services/movie.service.js'
import { PrismaMovieRepository } from '../../data-access/repositories/movie.repository.js'
import { tmdbGateway } from '../../data-access/gateways/tmdb.gateway.js'
import { PrismaShowtimeRepository } from '../../data-access/repositories/showtime.repository.js'
import { PrismaRoomRepository } from '../../data-access/repositories/room.repository.js'
import { authMiddleware } from '../middlewares/auth.middleware.js'
import { requireAdmin } from '../middlewares/role.middleware.js'

const movieRouter = express.Router()

const movieRepository = new PrismaMovieRepository()
const showtimeRepository = new PrismaShowtimeRepository()
const roomRepository = new PrismaRoomRepository()
const movieService = new MovieService(movieRepository, tmdbGateway, showtimeRepository, roomRepository)
const movieController = new MovieController(movieService)

// Public endpoints (Customer & Admin xem danh sách và chi tiết phim - UC-03, UC-04)
movieRouter.get('/', movieController.getAllMovies)
movieRouter.get('/:id', movieController.getMovieById)

// Protected Admin endpoints (Chỉ Admin mới có quyền CRUD phim & sync - UC-10, BR-03)
movieRouter.post('/sync', authMiddleware, requireAdmin, movieController.syncMovies)
movieRouter.post('/', authMiddleware, requireAdmin, movieController.createMovie)
movieRouter.put('/:id', authMiddleware, requireAdmin, movieController.updateMovie)
movieRouter.delete('/:id', authMiddleware, requireAdmin, movieController.deleteMovie)

export default movieRouter
