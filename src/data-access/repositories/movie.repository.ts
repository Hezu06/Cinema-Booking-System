import { prisma } from '../prisma/client.js'

import type {
  MovieRepository,
  CreateMovieData,
  UpdateMovieData
} from '../../business/interfaces/movie.interface.js'
import type { Movie } from '../../business/models/movie.model.js'

export class PrismaMovieRepository implements MovieRepository {

  async findAll(): Promise<Movie[]> {
    return prisma.movie.findMany({
      orderBy: {
        releaseDate: 'desc',
      }
    })
  }

  async findById(id: string): Promise<Movie | null> {
    return prisma.movie.findUnique({
      where: {
        id: id,
      }
    })
  }

  async create(data: CreateMovieData): Promise<Movie> {
    return prisma.movie.create({
      data: {
        title: data.title,
        description: data.description,
        durationMinutes: data.durationMinutes,
        genre: data.genre,
        releaseDate: data.releaseDate,
        posterUrl: data.posterUrl,
        status: data.status
      }
    })
  }

  async update(id: string, data: UpdateMovieData): Promise<Movie | null> {
    const movie = await prisma.movie.findUnique({
      where: {
        id: id,
      }
    })

    if (!movie) {
      return null
    }

    return prisma.movie.update({
      where: {
        id: id,
      },
      data: data,
    })
  }

  async delete(id: string): Promise<Movie | null> {
    const movie = await prisma.movie.findUnique({
      where: {
        id: id,
      },
    })

    if (!movie) {
      return null
    }

    return prisma.movie.delete({
      where: {
        id: id,
      },
    })
  }
}
