import type { Request, Response } from "express";
import type { BookingService } from "../../business/services/booking.service.js";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware.js";
import {
  bookingIdParamSchema,
  bookingQuerySchema,
  createBookingSchema,
  holdSeatsSchema,
  releaseSeatsSchema,
} from "../validators/booking.validator.js";

function handleBookingError(error: unknown, response: Response): boolean {
  if (!(error instanceof Error)) return false;

  switch (error.message) {
    case "SHOWTIME_NOT_FOUND":
      response.status(404).json({
        success: false,
        message: "Suất chiếu không tồn tại trong hệ thống",
      });
      return true;

    case "SHOWTIME_NOT_AVAILABLE":
      response.status(409).json({
        success: false,
        message: "Suất chiếu này hiện không mở để đặt vé",
      });
      return true;

    case "SHOWTIME_ALREADY_STARTED":
      response.status(409).json({
        success: false,
        message: "Suất chiếu đã bắt đầu hoặc đã qua, không thể thao tác",
      });
      return true;

    case "SOME_SEATS_NOT_FOUND":
      response.status(404).json({
        success: false,
        message: "Một hoặc nhiều ghế được chọn không tồn tại trong suất chiếu này",
      });
      return true;

    case "SEATS_ALREADY_BOOKED":
      response.status(409).json({
        success: false,
        message: "Một hoặc nhiều ghế đã được khách hàng khác đặt trước đó",
      });
      return true;

    case "SEATS_HELD_BY_ANOTHER_USER":
      response.status(409).json({
        success: false,
        message: "Một hoặc nhiều ghế đang được khách hàng khác tạm giữ",
      });
      return true;

    case "HOLD_EXPIRED":
      response.status(409).json({
        success: false,
        message: "Thời gian giữ ghế đã hết hạn, vui lòng chọn lại ghế",
      });
      return true;

    case "NO_SEATS_SPECIFIED":
      response.status(400).json({
        success: false,
        message: "Vui lòng chọn ít nhất 1 ghế",
      });
      return true;

    case "DUPLICATE_SEATS_IN_REQUEST":
      response.status(400).json({
        success: false,
        message: "Danh sách ghế đặt không được chứa ghế trùng nhau",
      });
      return true;

    case "MAX_SEATS_EXCEEDED":
      response.status(400).json({
        success: false,
        message: "Mỗi lần đặt chỉ được chọn tối đa 8 ghế",
      });
      return true;

    case "BOOKING_ALREADY_CANCELLED":
      response.status(409).json({
        success: false,
        message: "Đơn đặt vé này đã bị hủy trước đó",
      });
      return true;

    case "FORBIDDEN":
      response.status(403).json({
        success: false,
        message: "Bạn không có quyền xem hoặc thao tác trên đơn đặt vé này",
      });
      return true;

    default:
      return false;
  }
}

export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  holdSeats = async (request: Request, response: Response) => {
    const user = (request as AuthenticatedRequest).user;
    const bodyResult = holdSeatsSchema.safeParse(request.body);
    if (!bodyResult.success) {
      return response.status(400).json({
        success: false,
        message: "Validation failed",
        errors: bodyResult.error.issues,
      });
    }

    try {
      const result = await this.bookingService.holdSeats(
        user.userId,
        bodyResult.data,
      );

      return response.status(200).json({
        success: true,
        message: "Seats held successfully",
        data: result,
      });
    } catch (error) {
      if (handleBookingError(error, response)) return;

      console.error("Error holding seats:", error);
      return response.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  };

  releaseSeats = async (request: Request, response: Response) => {
    const user = (request as AuthenticatedRequest).user;
    const bodyResult = releaseSeatsSchema.safeParse(request.body);
    if (!bodyResult.success) {
      return response.status(400).json({
        success: false,
        message: "Validation failed",
        errors: bodyResult.error.issues,
      });
    }

    try {
      const result = await this.bookingService.releaseSeats(
        user.userId,
        bodyResult.data,
      );

      return response.status(200).json({
        success: true,
        message: "Seats released successfully",
        data: result,
      });
    } catch (error) {
      if (handleBookingError(error, response)) return;

      console.error("Error releasing seats:", error);
      return response.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  };

  createBooking = async (request: Request, response: Response) => {
    const user = (request as AuthenticatedRequest).user;
    const bodyResult = createBookingSchema.safeParse(request.body);
    if (!bodyResult.success) {
      return response.status(400).json({
        success: false,
        message: "Validation failed",
        errors: bodyResult.error.issues,
      });
    }

    try {
      const booking = await this.bookingService.createBooking(
        user.userId,
        bodyResult.data,
      );

      return response.status(201).json({
        success: true,
        message: "Booking confirmed successfully",
        data: booking,
      });
    } catch (error) {
      if (handleBookingError(error, response)) return;

      console.error("Error creating booking:", error);
      return response.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  };

  getMyBookings = async (request: Request, response: Response) => {
    const user = (request as AuthenticatedRequest).user;
    try {
      const bookings = await this.bookingService.getMyBookings(
        user.userId,
      );

      return response.status(200).json({
        success: true,
        message: "Get my bookings successfully",
        data: bookings,
      });
    } catch (error) {
      console.error("Error fetching my bookings:", error);
      return response.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  };

  getBookingById = async (request: Request, response: Response) => {
    const user = (request as AuthenticatedRequest).user;
    const paramResult = bookingIdParamSchema.safeParse(request.params);
    if (!paramResult.success) {
      return response.status(400).json({
        success: false,
        message: "Invalid booking ID",
        errors: paramResult.error.issues,
      });
    }

    try {
      const booking = await this.bookingService.getBookingById(
        paramResult.data.id,
        user,
      );

      if (!booking) {
        return response.status(404).json({
          success: false,
          message: "Booking not found",
        });
      }

      return response.status(200).json({
        success: true,
        message: "Get booking detail successfully",
        data: booking,
      });
    } catch (error) {
      if (handleBookingError(error, response)) return;

      console.error("Error fetching booking by ID:", error);
      return response.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  };

  cancelBooking = async (request: Request, response: Response) => {
    const user = (request as AuthenticatedRequest).user;
    const paramResult = bookingIdParamSchema.safeParse(request.params);
    if (!paramResult.success) {
      return response.status(400).json({
        success: false,
        message: "Invalid booking ID",
        errors: paramResult.error.issues,
      });
    }

    try {
      const booking = await this.bookingService.cancelBooking(
        paramResult.data.id,
        user,
      );

      if (!booking) {
        return response.status(404).json({
          success: false,
          message: "Booking not found",
        });
      }

      return response.status(200).json({
        success: true,
        message: "Booking cancelled successfully and seats released",
        data: booking,
      });
    } catch (error) {
      if (handleBookingError(error, response)) return;

      console.error("Error cancelling booking:", error);
      return response.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  };

  getAllBookings = async (request: Request, response: Response) => {
    const queryResult = bookingQuerySchema.safeParse(request.query);
    if (!queryResult.success) {
      return response.status(400).json({
        success: false,
        message: "Invalid query parameters",
        errors: queryResult.error.issues,
      });
    }

    try {
      const bookings = await this.bookingService.getAllBookings(
        queryResult.data,
      );

      return response.status(200).json({
        success: true,
        message: "Get all bookings successfully",
        data: bookings,
      });
    } catch (error) {
      console.error("Error fetching all bookings:", error);
      return response.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  };
}
