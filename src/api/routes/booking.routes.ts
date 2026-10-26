import express from "express";
import { container } from "../../config/container.js";
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

// All booking routes require authentication
bookingRouter.use(authMiddleware);

// Customer & Admin endpoints
bookingRouter.post("/hold", validateRequest({ body: holdSeatsSchema }), container.bookingController.holdSeats);
bookingRouter.post("/release", validateRequest({ body: releaseSeatsSchema }), container.bookingController.releaseSeats);
bookingRouter.post("/", validateRequest({ body: createBookingSchema }), container.bookingController.createBooking);
bookingRouter.get("/my-bookings", container.bookingController.getMyBookings);
bookingRouter.get("/:id", validateRequest({ params: bookingIdParamSchema }), container.bookingController.getBookingById);
bookingRouter.post(
  "/:id/cancel",
  validateRequest({ params: bookingIdParamSchema, body: cancelBookingSchema }),
  container.bookingController.cancelBooking,
);
bookingRouter.post(
  "/:id/resend-email",
  validateRequest({ params: bookingIdParamSchema }),
  container.bookingController.resendBookingEmail,
);

// Admin-only: list all bookings across all users
bookingRouter.get("/", requireAdmin, validateRequest({ query: bookingQuerySchema }), container.bookingController.getAllBookings);

export default bookingRouter;
