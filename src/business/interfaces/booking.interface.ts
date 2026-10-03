import type {
  BookingDetail,
  BookingStatus,
} from "../models/booking.model.js";

export interface CreateBookingData {
  userId: string;
  showtimeId: string;
  showtimeSeatIds: string[];
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
  findById(id: string): Promise<BookingDetail | null>;
  findByCode(bookingCode: string): Promise<BookingDetail | null>;
  findAll(filters?: BookingFilters): Promise<BookingDetail[]>;
  cancel(id: string): Promise<BookingDetail | null>;
}
