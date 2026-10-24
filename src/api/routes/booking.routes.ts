import express from "express";
import { BookingController } from "../controllers/booking.controller.js";
import { BookingService } from "../../business/services/booking.service.js";
import { PrismaBookingRepository } from "../../data-access/repositories/booking.repository.js";
import { emailService } from "../../data-access/gateways/email.gateway.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { requireAdmin } from "../middlewares/role.middleware.js";
import { validateRequest } from "../middlewares/validate.middleware.js";
import {
  bookingIdParamSchema,
  bookingQuerySchema,
  cancelBookingSchema,
  createBookingSchema,
  holdSeatsSchema,
  releaseSeatsSchema,
} from "../validators/booking.validator.js";

const bookingRouter = express.Router();
const bookingRepository = new PrismaBookingRepository();
const bookingService = new BookingService(bookingRepository, emailService);
const bookingController = new BookingController(bookingService);

// All booking routes require authentication
bookingRouter.use(authMiddleware);

// Customer & Admin endpoints
bookingRouter.post("/hold", validateRequest({ body: holdSeatsSchema }), bookingController.holdSeats);
bookingRouter.post("/release", validateRequest({ body: releaseSeatsSchema }), bookingController.releaseSeats);
bookingRouter.post("/", validateRequest({ body: createBookingSchema }), bookingController.createBooking);
bookingRouter.get("/my-bookings", bookingController.getMyBookings);
bookingRouter.get("/:id", validateRequest({ params: bookingIdParamSchema }), bookingController.getBookingById);
bookingRouter.post(
  "/:id/cancel",
  validateRequest({ params: bookingIdParamSchema, body: cancelBookingSchema }),
  bookingController.cancelBooking,
);
bookingRouter.post(
  "/:id/resend-email",
  validateRequest({ params: bookingIdParamSchema }),
  bookingController.resendBookingEmail,
);

// Admin-only: list all bookings across all users
bookingRouter.get("/", requireAdmin, validateRequest({ query: bookingQuerySchema }), bookingController.getAllBookings);

export default bookingRouter;
