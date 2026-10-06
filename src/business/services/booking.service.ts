import type {
  BookingFilters,
  BookingRepository,
  CreateBookingData,
  HoldSeatsData,
  HoldSeatsResult,
  ReleaseSeatsData,
} from "../interfaces/booking.interface.js";
import type { BookingDetail } from "../models/booking.model.js";

function generateBookingCode(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `BK-${timestamp}-${randomPart}`;
}

export class BookingService {
  constructor(private readonly bookingRepository: BookingRepository) {}

  async holdSeats(
    userId: string,
    data: { showtimeId: string; showtimeSeatIds: string[]; durationMinutes?: number | undefined },
  ): Promise<HoldSeatsResult> {
    const seatIds = data.showtimeSeatIds;

    if (!seatIds || seatIds.length === 0) {
      throw new Error("NO_SEATS_SPECIFIED");
    }

    const uniqueSeatIds = new Set(seatIds);
    if (uniqueSeatIds.size !== seatIds.length) {
      throw new Error("DUPLICATE_SEATS_IN_REQUEST");
    }

    if (seatIds.length > 8) {
      throw new Error("MAX_SEATS_EXCEEDED");
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
      throw new Error("DUPLICATE_SEATS_IN_REQUEST");
    }

    // Limit maximum seats per single booking to 8
    if (seatIds.length > 8) {
      throw new Error("MAX_SEATS_EXCEEDED");
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
      throw new Error("FORBIDDEN");
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
      throw new Error("FORBIDDEN");
    }

    return this.bookingRepository.cancel(id, reason);
  }

  async getAllBookings(filters?: BookingFilters): Promise<BookingDetail[]> {
    return this.bookingRepository.findAll(filters);
  }
}
