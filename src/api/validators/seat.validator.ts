import { z } from "zod";
import { SeatType } from "../../business/models/seat.model.js";

const uuidSchema = z.string().uuid("ID must be a valid UUID");
const seatTypeSchema = z.enum([SeatType.STANDARD, SeatType.VIP, SeatType.COUPLE]);

export const seatIdParamSchema = z.object({ id: uuidSchema });

export const seatQuerySchema = z.object({
  roomId: uuidSchema.optional(),
  active: z.enum(["true", "false"]).transform((value) => value === "true").optional(),
});

export const createSeatSchema = z.object({
  roomId: uuidSchema,
  rowLabel: z.string().trim().min(1).max(10),
  seatNumber: z.number().int().positive(),
  type: seatTypeSchema,
  active: z.boolean().optional(),
});

export const updateSeatSchema = createSeatSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  "At least one field is required",
);
