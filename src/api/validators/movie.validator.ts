import { MovieStatus } from "../../business/models/movie.model.js"

export function validateCreateMovie(data: any): string[] {
  const errors: string[] = []

  if (!data.title || typeof data.title !== 'string') {
    errors.push('title is required and must be a string')
  }

  if (!data.description || typeof data.description !== 'string') {
    errors.push('description is required and must be a string')
  }

  if (
    data.durationMinutes == undefined ||
    typeof data.durationMinutes !== 'number' ||
    data.durationMinutes <= 0
  ) {
    errors.push('durationMinutes is required and must be a positive number')
  }

  if (!data.genre || typeof data.genre !== 'string') {
    errors.push('genre is required and must be a string')
  }

  if (!data.releaseDate) {
    errors.push('releaseDate is required')
  }

  if (!data.posterUrl || typeof data.posterUrl !== 'string') {
    errors.push('posterUrl is required and must be a string')
  }

  if (!Object.values(MovieStatus).includes(data.status)) {
    errors.push('status is invalid')
  }

  return errors
}

export function validateUpdateMovie(data: any): string[] {
  const errors: string[] = []

  if (
      data.durationMinutes !== undefined &&
      (
        typeof data.durationMinutes !== 'number' ||
        data.durationMinutes <= 0
      )
  ) {
    errors.push('durationMinutes must be a positive number')
  }

  if (
    data.status !== undefined &&
    !Object.values(MovieStatus).includes(data.status)
  ) {
    errors.push('status is invalid')
  }

  if (
    data.title !== undefined &&
    typeof data.title !== 'string'
  ) {
    errors.push('title must be a string')
  }

  return errors
}