import type { Request, Response } from "express";
import type { BookingService } from "../../business/services/booking.service.js";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware.js";
import type {
  BookingQueryInput,
  CreateBookingInput,
} from "../validators/booking.validator.js";
import { asyncHandler } from "../utils/async-handler.util.js";
import { NotFoundError } from "../../shared/errors/index.js";

export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  holdSeats = asyncHandler(async (request: Request, response: Response) => {
    const user = (request as AuthenticatedRequest).user;
    const result = await this.bookingService.holdSeats(
      user.userId,
      request.body,
    );

    return response.status(200).json({
      success: true,
      message: "Seats held successfully",
      data: result,
    });
  });

  releaseSeats = asyncHandler(async (request: Request, response: Response) => {
    const user = (request as AuthenticatedRequest).user;
    const result = await this.bookingService.releaseSeats(
      user.userId,
      request.body,
    );

    return response.status(200).json({
      success: true,
      message: "Seats released successfully",
      data: result,
    });
  });

  createBooking = asyncHandler(async (request: Request, response: Response) => {
    const user = (request as AuthenticatedRequest).user;
    const booking = await this.bookingService.createBooking(
      user.userId,
      request.body as CreateBookingInput,
    );

    return response.status(201).json({
      success: true,
      message: "Booking created and awaiting payment",
      data: booking,
    });
  });

  getMyBookings = asyncHandler(async (request: Request, response: Response) => {
    const user = (request as AuthenticatedRequest).user;
    const bookings = await this.bookingService.getMyBookings(user.userId);

    return response.status(200).json({
      success: true,
      message: "Get my bookings successfully",
      data: bookings,
    });
  });

  getBookingById = asyncHandler(async (request: AuthenticatedRequest<{ id: string }>, response: Response) => {
    const user = request.user;
    const booking = await this.bookingService.getBookingById(
      request.params.id,
      user,
    );

    if (!booking) {
      throw new NotFoundError("Booking not found");
    }

    return response.status(200).json({
      success: true,
      message: "Get booking detail successfully",
      data: booking,
    });
  });

  cancelBooking = asyncHandler(async (request: AuthenticatedRequest<{ id: string }>, response: Response) => {
    const user = request.user;
    const booking = await this.bookingService.cancelBooking(
      request.params.id,
      user,
      request.body?.reason,
    );

    if (!booking) {
      throw new NotFoundError("Booking not found");
    }

    return response.status(200).json({
      success: true,
      message: "Booking cancelled, seats released and refund simulated successfully",
      data: booking,
    });
  });

  getAllBookings = asyncHandler(async (request: Request, response: Response) => {
    const bookings = await this.bookingService.getAllBookings(request.query as BookingQueryInput);

    return response.status(200).json({
      success: true,
      message: "Get all bookings successfully",
      data: bookings,
    });
  });

  resendBookingEmail = asyncHandler(async (request: AuthenticatedRequest<{ id: string }>, response: Response) => {
    const user = request.user;
    const result = await this.bookingService.resendBookingTicketEmail(
      request.params.id,
      user,
    );

    return response.status(200).json({
      success: result.success,
      message: result.message,
    });
  });
}
