import type { Request, Response } from "express";
import type { BookingService } from "../../business/services/booking.service.js";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware.js";
import {
  bookingIdParamSchema,
  bookingQuerySchema,
  cancelBookingSchema,
  createBookingSchema,
  holdSeatsSchema,
  releaseSeatsSchema,
} from "../validators/booking.validator.js";
import { asyncHandler } from "../utils/async-handler.util.js";
import { NotFoundError, ValidationError } from "../../shared/errors/index.js";

export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  holdSeats = asyncHandler(async (request: Request, response: Response) => {
    const user = (request as AuthenticatedRequest).user;
    const bodyResult = holdSeatsSchema.safeParse(request.body);
    if (!bodyResult.success) {
      throw new ValidationError("Validation failed", bodyResult.error.issues);
    }

    const result = await this.bookingService.holdSeats(
      user.userId,
      bodyResult.data,
    );

    return response.status(200).json({
      success: true,
      message: "Seats held successfully",
      data: result,
    });
  });

  releaseSeats = asyncHandler(async (request: Request, response: Response) => {
    const user = (request as AuthenticatedRequest).user;
    const bodyResult = releaseSeatsSchema.safeParse(request.body);
    if (!bodyResult.success) {
      throw new ValidationError("Validation failed", bodyResult.error.issues);
    }

    const result = await this.bookingService.releaseSeats(
      user.userId,
      bodyResult.data,
    );

    return response.status(200).json({
      success: true,
      message: "Seats released successfully",
      data: result,
    });
  });

  createBooking = asyncHandler(async (request: Request, response: Response) => {
    const user = (request as AuthenticatedRequest).user;
    const bodyResult = createBookingSchema.safeParse(request.body);
    if (!bodyResult.success) {
      throw new ValidationError("Validation failed", bodyResult.error.issues);
    }

    const booking = await this.bookingService.createBooking(
      user.userId,
      bodyResult.data,
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

  getBookingById = asyncHandler(async (request: Request, response: Response) => {
    const user = (request as AuthenticatedRequest).user;
    const paramResult = bookingIdParamSchema.safeParse(request.params);
    if (!paramResult.success) {
      throw new ValidationError("Invalid booking ID", paramResult.error.issues);
    }

    const booking = await this.bookingService.getBookingById(
      paramResult.data.id,
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

  cancelBooking = asyncHandler(async (request: Request, response: Response) => {
    const user = (request as AuthenticatedRequest).user;
    const paramResult = bookingIdParamSchema.safeParse(request.params);
    if (!paramResult.success) {
      throw new ValidationError("Invalid booking ID", paramResult.error.issues);
    }
    const bodyResult = cancelBookingSchema.safeParse(request.body ?? {});
    if (!bodyResult.success) {
      throw new ValidationError("Validation failed", bodyResult.error.issues);
    }

    const booking = await this.bookingService.cancelBooking(
      paramResult.data.id,
      user,
      bodyResult.data.reason,
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
    const queryResult = bookingQuerySchema.safeParse(request.query);
    if (!queryResult.success) {
      throw new ValidationError("Invalid query parameters", queryResult.error.issues);
    }

    const bookings = await this.bookingService.getAllBookings(queryResult.data);

    return response.status(200).json({
      success: true,
      message: "Get all bookings successfully",
      data: bookings,
    });
  });

  resendBookingEmail = asyncHandler(async (request: Request, response: Response) => {
    const paramResult = bookingIdParamSchema.safeParse(request.params);
    if (!paramResult.success) {
      throw new ValidationError("Mã đơn đặt vé không hợp lệ", paramResult.error.issues);
    }

    const user = (request as AuthenticatedRequest).user;

    const result = await this.bookingService.resendBookingTicketEmail(
      paramResult.data.id,
      user,
    );

    return response.status(200).json({
      success: result.success,
      message: result.message,
    });
  });
}
