import type {
  BookingFilters,
  BookingRepository,
  CreateBookingData,
  HoldSeatsData,
  HoldSeatsResult,
  ReleaseSeatsData,
} from "../interfaces/booking.interface.js";
import type { EmailService } from "../interfaces/email.interface.js";
import type { BookingDetail } from "../models/booking.model.js";
import { getClientTicketUrl } from "../utils/client-url.util.js";
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ServiceUnavailableError,
} from "../../shared/errors/index.js";

function generateBookingCode(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `BK-${timestamp}-${randomPart}`;
}

export class BookingService {
  constructor(
    private readonly bookingRepository: BookingRepository,
    private readonly emailService?: EmailService,
  ) {}

  async holdSeats(
    userId: string,
    data: { showtimeId: string; showtimeSeatIds: string[]; durationMinutes?: number | undefined },
  ): Promise<HoldSeatsResult> {
    const seatIds = data.showtimeSeatIds;

    if (!seatIds || seatIds.length === 0) {
      throw new BadRequestError("Vui lòng chọn ít nhất một ghế");
    }

    const uniqueSeatIds = new Set(seatIds);
    if (uniqueSeatIds.size !== seatIds.length) {
      throw new BadRequestError("Danh sách ghế không được trùng lặp");
    }

    if (seatIds.length > 8) {
      throw new BadRequestError("Mỗi lần chỉ được chọn tối đa 8 ghế");
    }

    const duration = data.durationMinutes && data.durationMinutes > 0 ? data.durationMinutes : 10;
    const expiresAt = new Date(Date.now() + duration * 60 * 1000);

    const holdData: HoldSeatsData = {
      userId,
      showtimeId: data.showtimeId,
      showtimeSeatIds: seatIds,
      durationMinutes: duration,
    };

    return this.bookingRepository.holdSeats(holdData, expiresAt);
  }

  async releaseSeats(
    userId: string,
    data: { showtimeId: string; showtimeSeatIds?: string[] | undefined },
  ): Promise<{ releasedCount: number }> {
    const releaseData: ReleaseSeatsData = {
      userId,
      showtimeId: data.showtimeId,
      showtimeSeatIds: data.showtimeSeatIds,
    };

    const count = await this.bookingRepository.releaseSeats(releaseData);
    return { releasedCount: count };
  }

  async createBooking(
    userId: string,
    data: { showtimeId: string; showtimeSeatIds: string[] },
  ): Promise<BookingDetail> {
    const seatIds = data.showtimeSeatIds;

    // Check duplicate seat IDs in request
    const uniqueSeatIds = new Set(seatIds);
    if (uniqueSeatIds.size !== seatIds.length) {
      throw new BadRequestError("Danh sách ghế không được trùng lặp");
    }

    // Limit maximum seats per single booking to 8
    if (seatIds.length > 8) {
      throw new BadRequestError("Mỗi lần chỉ được chọn tối đa 8 ghế");
    }

    const bookingCode = generateBookingCode();

    const createData: CreateBookingData = {
      userId,
      showtimeId: data.showtimeId,
      showtimeSeatIds: seatIds,
    };

    return this.bookingRepository.createWithSeats(
      createData,
      bookingCode,
    );
  }

  async getMyBookings(userId: string): Promise<BookingDetail[]> {
    return this.bookingRepository.findAll({ userId });
  }

  async getBookingById(
    id: string,
    user: { userId: string; role: string },
  ): Promise<BookingDetail | null> {
    const booking = await this.bookingRepository.findById(id);
    if (!booking) return null;

    if (user.role !== "ADMIN" && booking.userId !== user.userId) {
      throw new ForbiddenError("Bạn không có quyền thao tác trên đơn hàng này");
    }

    return booking;
  }

  async cancelBooking(
    id: string,
    user: { userId: string; role: string },
    reason?: string,
  ): Promise<BookingDetail | null> {
    const current = await this.bookingRepository.findById(id);
    if (!current) return null;

    if (user.role !== "ADMIN" && current.userId !== user.userId) {
      throw new ForbiddenError("Bạn không có quyền thao tác trên đơn hàng này");
    }

    return this.bookingRepository.cancel(id, reason);
  }

  async getAllBookings(filters?: BookingFilters): Promise<BookingDetail[]> {
    return this.bookingRepository.findAll(filters);
  }

  async resendBookingTicketEmail(
    id: string,
    user: { userId: string; role: string },
  ): Promise<{ success: boolean; message: string }> {
    const booking = await this.bookingRepository.findById(id);
    if (!booking) throw new NotFoundError("Không tìm thấy đơn hàng");

    if (user.role !== "ADMIN" && booking.userId !== user.userId) {
      throw new ForbiddenError("Bạn không có quyền thao tác trên đơn hàng này");
    }

    if (booking.status !== "CONFIRMED") {
      throw new ConflictError("Đơn đặt vé chưa được thanh toán xác nhận");
    }

    if (!booking.user?.email) {
      throw new BadRequestError("Tài khoản đặt vé không có địa chỉ email");
    }

    if (!this.emailService) {
      throw new ServiceUnavailableError("Dịch vụ gửi email hiện không khả dụng");
    }

    const seatLabels = booking.bookingSeats
      .map((bs) => `${bs.seat.rowLabel}${bs.seat.seatNumber}`)
      .filter(Boolean);

    const ticketUrl = getClientTicketUrl(booking.id);

    const sent = await this.emailService.sendBookingTicketEmail({
      to: booking.user.email,
      name: booking.user.fullName || "Quý khách",
      bookingCode: booking.bookingCode,
      bookingId: booking.id,
      movieTitle: booking.showtime.movie.title,
      moviePosterUrl: booking.showtime.movie.posterUrl,
      cinemaName: booking.showtime.room.cinema.name,
      cinemaAddress: booking.showtime.room.cinema.address,
      roomName: booking.showtime.room.name,
      startTime: booking.showtime.startTime,
      seatLabels,
      totalAmount: booking.totalAmount,
      ticketUrl,
    });

    return {
      success: sent,
      message: sent
        ? `Vé xem phim đã được gửi tới email ${booking.user.email}`
        : "Không thể gửi email lúc này. Vui lòng thử lại sau ít phút.",
    };
  }
}
