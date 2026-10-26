import { prisma } from '../prisma/client.js'
import type {
  MovieRepository,
  CreateMovieData,
  UpdateMovieData
} from '../../business/interfaces/movie.interface.js'
import type { Movie } from '../../business/models/movie.model.js'
import { ConflictError } from '../../shared/errors/index.js'

function isPrismaErrorWithCode(error: unknown, code: string): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as Record<string, unknown>).code === code
  )
}

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

  async findByTitle(title: string): Promise<Movie | null> {
    return prisma.movie.findFirst({
      where: {
        title: title.trim(),
      },
    })
  }

  async findByTitleAndReleaseDate(title: string, releaseDate: Date): Promise<Movie | null> {
    return prisma.movie.findUnique({
      where: {
        title_releaseDate: {
          title: title.trim(),
          releaseDate: releaseDate,
        },
      },
    })
  }

  async findOldMovies(beforeDate: Date): Promise<Movie[]> {
    return prisma.movie.findMany({
      where: {
        releaseDate: { lt: beforeDate },
        status: { not: 'ENDED' },
      },
    })
  }

  async create(data: CreateMovieData): Promise<Movie> {
    try {
      return await prisma.movie.create({
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
    } catch (error) {
      if (isPrismaErrorWithCode(error, 'P2002')) {
        throw new ConflictError(`Phim '${data.title}' với ngày phát hành này đã tồn tại trong hệ thống`)
      }
      throw error
    }
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

    try {
      return await prisma.movie.update({
        where: {
          id: id,
        },
        data: {
          ...(data.title !== undefined ? { title: data.title } : {}),
          ...(data.description !== undefined ? { description: data.description } : {}),
          ...(data.durationMinutes !== undefined ? { durationMinutes: data.durationMinutes } : {}),
          ...(data.genre !== undefined ? { genre: data.genre } : {}),
          ...(data.releaseDate !== undefined ? { releaseDate: data.releaseDate } : {}),
          ...(data.posterUrl !== undefined ? { posterUrl: data.posterUrl } : {}),
          ...(data.status !== undefined ? { status: data.status } : {}),
        },
      })
    } catch (error) {
      if (isPrismaErrorWithCode(error, 'P2025')) {
        return null
      }
      if (isPrismaErrorWithCode(error, 'P2002')) {
        throw new ConflictError('Phim với tiêu đề và ngày phát hành này đã tồn tại trong hệ thống')
      }
      throw error
    }
  }

  async delete(id: string): Promise<Movie | null> {
    const movie = await prisma.movie.findUnique({
      where: {
        id: id,
      }
    })

    if (!movie) {
      return null
    }

    try {
      return await prisma.movie.delete({
        where: {
          id: id,
        }
      })
    } catch (error) {
      if (isPrismaErrorWithCode(error, 'P2025')) {
        return null
      }
      if (isPrismaErrorWithCode(error, 'P2003')) {
        throw new ConflictError('Không thể xóa phim do có dữ liệu suất chiếu liên quan')
      }
      throw error
    }
  }
}
