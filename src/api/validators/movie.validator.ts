import { z } from "zod";
import { MovieStatus } from "../../business/models/movie.model.js";

export const movieStatusSchema = z.enum([
  MovieStatus.COMING_SOON,
  MovieStatus.NOW_SHOWING,
  MovieStatus.ENDED,
]);

export const createMovieSchema = z.object({
  title: z.string().trim().min(1, "title is required and must not be empty"),
  description: z.string().trim().min(1, "description is required and must not be empty"),
  durationMinutes: z
    .number({
      message: "durationMinutes is required and must be a positive number",
    })
    .int("durationMinutes must be an integer")
    .positive("durationMinutes must be a positive number"),
  genre: z.string().trim().min(1, "genre is required and must not be empty"),
  releaseDate: z.coerce.date({
    message: "releaseDate is required and must be a valid date",
  }),
  posterUrl: z.string().trim().url("posterUrl must be a valid URL"),
  status: movieStatusSchema,
});

export type CreateMovieInput = z.infer<typeof createMovieSchema>;

export const updateMovieSchema = createMovieSchema.partial();

export type UpdateMovieInput = z.infer<typeof updateMovieSchema>;

export const movieIdParamSchema = z.object({
  id: z.string().uuid("ID phim phải có định dạng UUID hợp lệ"),
});

export type MovieIdParam = z.infer<typeof movieIdParamSchema>;