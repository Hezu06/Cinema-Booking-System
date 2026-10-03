import { z } from "zod";
import { BookingStatus } from "../../business/models/booking.model.js";

const uuidSchema = z.string().uuid("ID must be a valid UUID");

export const bookingIdParamSchema = z.object({
  id: uuidSchema,
});

export const createBookingSchema = z.object({
  showtimeId: uuidSchema,
  showtimeSeatIds: z
    .array(uuidSchema, {
      message: "showtimeSeatIds must be an array of seat UUIDs",
    })
    .min(1, "At least one seat must be selected")
    .max(8, "Cannot book more than 8 seats per booking"),
});

export const bookingQuerySchema = z.object({
  userId: uuidSchema.optional(),
  showtimeId: uuidSchema.optional(),
  status: z
    .enum([
      BookingStatus.PENDING,
      BookingStatus.CONFIRMED,
      BookingStatus.CANCELLED,
      BookingStatus.EXPIRED,
    ])
    .optional(),
  bookingCode: z.string().trim().optional(),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type BookingQueryInput = z.infer<typeof bookingQuerySchema>;
