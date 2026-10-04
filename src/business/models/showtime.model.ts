import type { SeatType } from "./seat.model.js";

export const ShowtimeStatus = {
  SCHEDULED: "SCHEDULED",
  CANCELLED: "CANCELLED",
  COMPLETED: "COMPLETED",
} as const;

export type ShowtimeStatus = typeof ShowtimeStatus[keyof typeof ShowtimeStatus];

export const ShowtimeSeatStatus = {
  AVAILABLE: "AVAILABLE",
  HELD: "HELD",
  BOOKED: "BOOKED",
} as const;

export type ShowtimeSeatStatus = typeof ShowtimeSeatStatus[keyof typeof ShowtimeSeatStatus];

export interface Showtime {
  id: string;
  movieId: string;
  roomId: string;
  startTime: Date;
  endTime: Date;
  basePrice: number;
  status: ShowtimeStatus;
  createdAt: Date;
  updatedAt: Date;
  movie?: {
    id: string;
    title: string;
    description: string;
    durationMinutes: number;
    releaseDate: Date;
    posterUrl: string;
    genre: string;
    status: string;
  };
  room?: {
    id: string;
    cinemaId: string;
    name: string;
    type: string;
    capacity: number;
    cinema?: {
      id: string;
      name: string;
      address: string;
      city: string;
    };
  };
}

export interface ShowtimeSeatView {
  id: string;
  showtimeId: string;
  seatId: string;
  status: ShowtimeSeatStatus;
  price: number;
  heldByUserId: string | null;
  holdExpiresAt: Date | null;
  seat: {
    id: string;
    roomId: string;
    rowLabel: string;
    seatNumber: number;
    type: SeatType;
    active: boolean;
  };
}
