export interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: 'CUSTOMER' | 'ADMIN';
  status: 'ACTIVE' | 'BLOCKED';
}

export interface Movie {
  id: string;
  title: string;
  description: string;
  durationMinutes: number;
  genre: string;
  releaseDate: string;
  posterUrl: string;
  trailerUrl?: string;
  status: 'NOW_SHOWING' | 'COMING_SOON' | 'ENDED';
}

export interface Cinema {
  id: string;
  name: string;
  address: string;
  city: string;
}

export interface Room {
  id: string;
  cinemaId: string;
  name: string;
  type: 'STANDARD' | 'VIP' | 'IMAX' | 'THREE_D';
  capacity: number;
  cinema?: Cinema;
}

export interface Seat {
  id: string;
  roomId: string;
  rowLabel: string;
  seatNumber: number;
  type: 'STANDARD' | 'VIP' | 'COUPLE';
  active: boolean;
}

export interface Showtime {
  id: string;
  movieId: string;
  roomId: string;
  startTime: string;
  endTime: string;
  basePrice: number;
  status: 'SCHEDULED' | 'CANCELLED' | 'COMPLETED';
  movie?: Movie;
  room?: Room;
}

export interface ShowtimeSeat {
  id: string;
  showtimeId: string;
  seatId: string;
  status: 'AVAILABLE' | 'HELD' | 'BOOKED';
  price: number;
  heldByUserId?: string | null;
  holdExpiresAt?: string | null;
  seat: Seat;
}

export interface HoldSeatsResponse {
  showtimeId: string;
  heldSeatIds: string[];
  holdExpiresAt: string;
  expiresInSeconds: number;
}

export interface Ticket {
  id: string;
  bookingId: string;
  bookingSeatId: string;
  ticketCode: string;
  qrCode?: string;
  status: 'VALID' | 'USED' | 'CANCELLED';
}

export interface BookingSeat {
  id: string;
  bookingId: string;
  showtimeSeatId: string;
  price: number;
  seat: Seat;
  ticket?: Ticket;
}

export interface BookingDetail {
  id: string;
  userId: string;
  showtimeId: string;
  bookingCode: string;
  totalAmount: number;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'EXPIRED';
  expiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    fullName: string;
    email: string;
    phone: string;
  };
  showtime: {
    id: string;
    movieId: string;
    roomId: string;
    startTime: string;
    endTime: string;
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
  bookingSeats: BookingSeat[];
  tickets: Ticket[];
  payments?: Payment[];
}

export interface Refund {
  id: string;
  paymentId: string;
  refundCode: string;
  amount: number;
  reason?: string | null;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  completedAt?: string | null;
}

export interface Payment {
  id: string;
  bookingId: string;
  txnRef: string;
  amount: number;
  method: 'VNPAY';
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'EXPIRED' | 'REFUND_PENDING' | 'REFUNDED';
  transactionNo?: string | null;
  responseCode?: string | null;
  createdAt: string;
  updatedAt: string;
  refund?: Refund | null;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: any[];
}
