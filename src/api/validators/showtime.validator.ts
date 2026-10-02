import { z } from "zod";
import { ShowtimeStatus } from "../../business/models/showtime.model.js";

const uuidSchema = z.string().uuid("ID must be a valid UUID");
const statusSchema = z.enum([ShowtimeStatus.SCHEDULED, ShowtimeStatus.CANCELLED, ShowtimeStatus.COMPLETED]);
const dateTimeSchema = z.iso.datetime({ offset: true }).transform((value) => new Date(value));

export const showtimeIdParamSchema = z.object({ id: uuidSchema });

export const showtimeQuerySchema = z.object({
  movieId: uuidSchema.optional(),
  cinemaId: uuidSchema.optional(),
  roomId: uuidSchema.optional(),
  status: statusSchema.optional(),
  date: z.iso.date().transform((value) => new Date(`${value}T00:00:00.000Z`)).optional(),
});

export const createShowtimeSchema = z.object({
  movieId: uuidSchema,
  roomId: uuidSchema,
  startTime: dateTimeSchema,
  endTime: dateTimeSchema,
  basePrice: z.number().nonnegative(),
  status: statusSchema.optional(),
}).refine((data) => data.startTime < data.endTime, {
  message: "startTime must be before endTime",
  path: ["endTime"],
});

export const updateShowtimeSchema = z.object({
  movieId: uuidSchema.optional(),
  roomId: uuidSchema.optional(),
  startTime: dateTimeSchema.optional(),
  endTime: dateTimeSchema.optional(),
  basePrice: z.number().nonnegative().optional(),
  status: statusSchema.optional(),
}).refine((data) => Object.keys(data).length > 0, "At least one field is required");
