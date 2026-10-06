export const BookingStatus = {
  PENDING: "PENDING",
  CONFIRMED: "CONFIRMED",
  CANCELLED: "CANCELLED",
  EXPIRED: "EXPIRED",
} as const;

export type BookingStatus = (typeof BookingStatus)[keyof typeof BookingStatus];

export const TicketStatus = {
  VALID: "VALID",
  USED: "USED",
  CANCELLED: "CANCELLED",
} as const;

export type TicketStatus = (typeof TicketStatus)[keyof typeof TicketStatus];

export interface Booking {
  id: string;
  userId: string;
  showtimeId: string;
  bookingCode: string;
  totalAmount: number;
  status: BookingStatus;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TicketView {
  id: string;
  bookingId: string;
  bookingSeatId: string;
  ticketCode: string;
  qrCode: string | null;
  status: TicketStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface BookingSeatDetail {
  id: string;
  bookingId: string;
  showtimeSeatId: string;
  price: number;
  createdAt: Date;
  seat: {
    id: string;
    roomId: string;
    rowLabel: string;
    seatNumber: number;
    type: string;
  };
  ticket?: TicketView | null;
}

export interface BookingDetail extends Booking {
  user?: {
    id: string;
    fullName: string;
    email: string;
    phone: string;
  };
  showtime: {
    id: string;
    movieId: string;
    roomId: string;
    startTime: Date;
    endTime: Date;
    basePrice: number;
    status: string;
    movie: {
      id: string;
      title: string;
      posterUrl: string;
      durationMinutes: number;
      genre: string;
    };
    room: {
      id: string;
      name: string;
      type: string;
      cinema: {
        id: string;
        name: string;
        address: string;
        city: string;
      };
    };
  };
  bookingSeats: BookingSeatDetail[];
  tickets: TicketView[];
  payments?: Array<{
    id: string;
    txnRef: string;
    amount: number;
    method: string;
    status: string;
    transactionNo: string | null;
    createdAt: Date;
    updatedAt: Date;
    refund?: {
      id: string;
      refundCode: string;
      amount: number;
      reason: string | null;
      status: string;
      completedAt: Date | null;
    } | null;
  }>;
}
