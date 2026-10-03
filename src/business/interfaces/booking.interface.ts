import type {
  BookingDetail,
  BookingStatus,
} from "../models/booking.model.js";

export interface CreateBookingData {
  userId: string;
  showtimeId: string;
  showtimeSeatIds: string[];
}

export interface HoldSeatsData {
  userId: string;
  showtimeId: string;
  showtimeSeatIds: string[];
  durationMinutes?: number | undefined;
}

export interface HoldSeatsResult {
  showtimeId: string;
  heldSeatIds: string[];
  holdExpiresAt: Date;
  expiresInSeconds: number;
}

export interface ReleaseSeatsData {
  userId: string;
  showtimeId: string;
  showtimeSeatIds?: string[] | undefined;
}

export interface BookingFilters {
  userId?: string | undefined;
  showtimeId?: string | undefined;
  status?: BookingStatus | undefined;
  bookingCode?: string | undefined;
}

export interface BookingRepository {
  createWithSeats(
    data: CreateBookingData,
    bookingCode: string,
    ticketCodeGenerator: (index: number) => string,
  ): Promise<BookingDetail>;
  holdSeats(data: HoldSeatsData, expiresAt: Date): Promise<HoldSeatsResult>;
  releaseSeats(data: ReleaseSeatsData): Promise<number>;
  findById(id: string): Promise<BookingDetail | null>;
  findByCode(bookingCode: string): Promise<BookingDetail | null>;
  findAll(filters?: BookingFilters): Promise<BookingDetail[]>;
  cancel(id: string): Promise<BookingDetail | null>;
}
