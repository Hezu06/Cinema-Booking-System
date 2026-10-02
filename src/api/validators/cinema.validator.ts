import { z } from "zod";

export const createCinemaSchema =
  z.object({
    name: z
      .string()
      .trim()
      .min(
        1,
        "name is required and must not be empty"
      ),

    address: z
      .string()
      .trim()
      .min(
        1,
        "address is required and must not be empty"
      ),

    city: z
      .string()
      .trim()
      .min(
        1,
        "city is required and must not be empty"
      ),
  });

export type CreateCinemaInput =
  z.infer<
    typeof createCinemaSchema
  >;

export const updateCinemaSchema =
  createCinemaSchema.partial();

export type UpdateCinemaInput =
  z.infer<
    typeof updateCinemaSchema
  >;

export const cinemaIdParamSchema =
  z.object({
    id: z
      .string()
      .uuid(
        "Cinema ID must be a valid UUID"
      ),
  });

export type CinemaIdParam =
  z.infer<
    typeof cinemaIdParamSchema
  >;