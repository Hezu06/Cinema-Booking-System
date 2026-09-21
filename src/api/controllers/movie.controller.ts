import type { Request, Response } from "express";
import { MovieService } from "../../business/services/movie.service.js";
import {
  createMovieSchema,
  updateMovieSchema,
  movieIdParamSchema,
} from "../validators/movie.validator.js";

export class MovieController {
  constructor(private readonly movieService: MovieService) {}

  getAllMovies = async (_request: Request, response: Response) => {
    try {
      const movies = await this.movieService.getAllMovies();

      return response.status(200).json({
        success: true,
        message: "Get all movies",
        data: movies,
      });
    } catch (error) {
      console.error("Error fetching all movies:", error);
      return response.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  };

  getMovieById = async (request: Request<{ id: string }>, response: Response) => {
    try {
      const paramResult = movieIdParamSchema.safeParse(request.params);
      if (!paramResult.success) {
        return response.status(400).json({
          success: false,
          message: "Invalid movie ID",
          errors: paramResult.error.issues,
        });
      }

      const { id } = paramResult.data;
      const movie = await this.movieService.getMovieById(id);

      if (!movie) {
        return response.status(404).json({
          success: false,
          message: "Movie not found",
        });
      }

      return response.status(200).json({
        success: true,
        message: `Get movie ${id}`,
        data: movie,
      });
    } catch (error) {
      console.error("Error fetching movie by ID:", error);
      return response.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  };

  createMovie = async (request: Request, response: Response) => {
    try {
      const bodyResult = createMovieSchema.safeParse(request.body);
      if (!bodyResult.success) {
        return response.status(400).json({
          success: false,
          message: "Validation failed",
          errors: bodyResult.error.issues,
        });
      }

      const movie = await this.movieService.createMovie(bodyResult.data);

      return response.status(201).json({
        success: true,
        message: "Movie created",
        data: movie,
      });
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes("đã tồn tại trong hệ thống")
      ) {
        return response.status(409).json({
          success: false,
          message: error.message,
        });
      }

      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "P2002"
      ) {
        return response.status(409).json({
          success: false,
          message:
            "Phim với tiêu đề và ngày giờ phát hành này đã tồn tại trong hệ thống",
        });
      }

      console.error("Error creating movie:", error);
      return response.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  };

  updateMovie = async (request: Request<{ id: string }>, response: Response) => {
    try {
      const paramResult = movieIdParamSchema.safeParse(request.params);
      if (!paramResult.success) {
        return response.status(400).json({
          success: false,
          message: "Invalid movie ID",
          errors: paramResult.error.issues,
        });
      }

      const bodyResult = updateMovieSchema.safeParse(request.body);
      if (!bodyResult.success) {
        return response.status(400).json({
          success: false,
          message: "Validation failed",
          errors: bodyResult.error.issues,
        });
      }

      const { id } = paramResult.data;
      const movie = await this.movieService.updateMovie(id, bodyResult.data);

      if (!movie) {
        return response.status(404).json({
          success: false,
          message: "Movie not found",
        });
      }

      return response.status(200).json({
        success: true,
        message: "Movie updated",
        data: movie,
      });
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes("đã tồn tại trong hệ thống")
      ) {
        return response.status(409).json({
          success: false,
          message: error.message,
        });
      }

      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "P2002"
      ) {
        return response.status(409).json({
          success: false,
          message:
            "Phim với tiêu đề và ngày giờ phát hành này đã tồn tại trong hệ thống",
        });
      }

      console.error("Error updating movie:", error);
      return response.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  };

  deleteMovie = async (request: Request<{ id: string }>, response: Response) => {
    try {
      const paramResult = movieIdParamSchema.safeParse(request.params);
      if (!paramResult.success) {
        return response.status(400).json({
          success: false,
          message: "Invalid movie ID",
          errors: paramResult.error.issues,
        });
      }

      const { id } = paramResult.data;
      const deletedMovie = await this.movieService.deleteMovie(id);

      if (!deletedMovie) {
        return response.status(404).json({
          success: false,
          message: "Movie not found",
        });
      }

      return response.status(200).json({
        success: true,
        message: "Movie deleted successfully",
        data: deletedMovie,
      });
    } catch (error) {
      console.error("Error deleting movie:", error);
      return response.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  };
}
