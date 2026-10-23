import express from "express";
import { BookingController } from "../controllers/booking.controller.js";
import { BookingService } from "../../business/services/booking.service.js";
import { PrismaBookingRepository } from "../../data-access/repositories/booking.repository.js";
import { emailService } from "../../data-access/gateways/email.gateway.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { requireAdmin } from "../middlewares/role.middleware.js";

const bookingRouter = express.Router();
const bookingRepository = new PrismaBookingRepository();
const bookingService = new BookingService(bookingRepository, emailService);
const bookingController = new BookingController(bookingService);

// All booking routes require authentication
bookingRouter.use(authMiddleware);

// Customer & Admin endpoints
bookingRouter.post("/hold", bookingController.holdSeats);
bookingRouter.post("/release", bookingController.releaseSeats);
bookingRouter.post("/", bookingController.createBooking);
bookingRouter.get("/my-bookings", bookingController.getMyBookings);
bookingRouter.get("/:id", bookingController.getBookingById);
bookingRouter.post("/:id/cancel", bookingController.cancelBooking);
bookingRouter.post("/:id/resend-email", bookingController.resendBookingEmail);

// Admin-only: list all bookings across all users
bookingRouter.get("/", requireAdmin, bookingController.getAllBookings);

export default bookingRouter;
