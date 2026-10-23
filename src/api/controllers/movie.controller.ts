import type { Request, Response } from "express";
import { MovieService } from "../../business/services/movie.service.js";
import {
  createMovieSchema,
  updateMovieSchema,
  movieIdParamSchema,
} from "../validators/movie.validator.js";
import { asyncHandler } from "../utils/async-handler.util.js";
import { NotFoundError, ValidationError } from "../../shared/errors/index.js";

export class MovieController {
  constructor(private readonly movieService: MovieService) {}

  getAllMovies = asyncHandler(async (_request: Request, response: Response) => {
    const movies = await this.movieService.getAllMovies();

    return response.status(200).json({
      success: true,
      message: "Get all movies",
      data: movies,
    });
  });

  getMovieById = asyncHandler(async (request: Request<{ id: string }>, response: Response) => {
    const paramResult = movieIdParamSchema.safeParse(request.params);
    if (!paramResult.success) {
      throw new ValidationError("Invalid movie ID", paramResult.error.issues);
    }

    const { id } = paramResult.data;
    const movie = await this.movieService.getMovieById(id);

    if (!movie) {
      throw new NotFoundError("Movie not found");
    }

    return response.status(200).json({
      success: true,
      message: `Get movie ${id}`,
      data: movie,
    });
  });

  createMovie = asyncHandler(async (request: Request, response: Response) => {
    const bodyResult = createMovieSchema.safeParse(request.body);
    if (!bodyResult.success) {
      throw new ValidationError("Validation failed", bodyResult.error.issues);
    }

    const movie = await this.movieService.createMovie(bodyResult.data);

    return response.status(201).json({
      success: true,
      message: "Movie created",
      data: movie,
    });
  });

  updateMovie = asyncHandler(async (request: Request<{ id: string }>, response: Response) => {
    const paramResult = movieIdParamSchema.safeParse(request.params);
    if (!paramResult.success) {
      throw new ValidationError("Invalid movie ID", paramResult.error.issues);
    }

    const bodyResult = updateMovieSchema.safeParse(request.body);
    if (!bodyResult.success) {
      throw new ValidationError("Validation failed", bodyResult.error.issues);
    }

    const { id } = paramResult.data;
    const updatedMovie = await this.movieService.updateMovie(id, bodyResult.data);

    if (!updatedMovie) {
      throw new NotFoundError("Movie not found");
    }

    return response.status(200).json({
      success: true,
      message: "Movie updated",
      data: updatedMovie,
    });
  });

  deleteMovie = asyncHandler(async (request: Request<{ id: string }>, response: Response) => {
    const paramResult = movieIdParamSchema.safeParse(request.params);
    if (!paramResult.success) {
      throw new ValidationError("Invalid movie ID", paramResult.error.issues);
    }

    const { id } = paramResult.data;
    const deletedMovie = await this.movieService.deleteMovie(id);

    if (!deletedMovie) {
      throw new NotFoundError("Movie not found");
    }

    return response.status(200).json({
      success: true,
      message: "Movie deleted successfully",
      data: deletedMovie,
    });
  });

  syncMovies = asyncHandler(async (request: Request, response: Response) => {
    const autoCreateShowtimes = request.body?.autoCreateShowtimes !== false;
    const markEndedOlderThanDays = typeof request.body?.markEndedOlderThanDays === "number"
      ? request.body.markEndedOlderThanDays
      : 60;

    const result = await this.movieService.syncExternalMovies({
      autoCreateShowtimes,
      markEndedOlderThanDays,
    });

    return response.status(200).json({
      success: true,
      message: "Đồng bộ phim từ TMDB/Ngoại vi và tạo lịch chiếu thành công",
      data: result,
    });
  });
}
