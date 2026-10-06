import { z } from "zod";

export const createVnpayPaymentSchema = z.object({
  bookingId: z.string().uuid("bookingId must be a valid UUID"),
  bankCode: z.string().trim().min(1).max(30).optional(),
});

export const paymentBookingParamSchema = z.object({
  bookingId: z.string().uuid("bookingId must be a valid UUID"),
});
