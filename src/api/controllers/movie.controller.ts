import type { Request, Response } from "express";
import { MovieService } from "../../business/services/movie.service.js";
import type { CreateMovieInput, UpdateMovieInput } from "../validators/movie.validator.js";
import { asyncHandler } from "../utils/async-handler.util.js";
import { NotFoundError } from "../../shared/errors/index.js";

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
    const { id } = request.params;
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
    const movie = await this.movieService.createMovie(request.body as CreateMovieInput);

    return response.status(201).json({
      success: true,
      message: "Movie created",
      data: movie,
    });
  });

  updateMovie = asyncHandler(async (request: Request<{ id: string }>, response: Response) => {
    const { id } = request.params;
    const updatedMovie = await this.movieService.updateMovie(id, request.body as UpdateMovieInput);

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
    const { id } = request.params;
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
