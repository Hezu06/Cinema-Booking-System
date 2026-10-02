import type {
  Showtime,
  ShowtimeSeatView,
  ShowtimeStatus,
} from "../models/showtime.model.js";

export interface ShowtimeFilters {
  movieId?: string | undefined;
  cinemaId?: string | undefined;
  roomId?: string | undefined;
  status?: ShowtimeStatus | undefined;
  date?: Date | undefined;
}

export interface CreateShowtimeData {
  movieId: string;
  roomId: string;
  startTime: Date;
  endTime: Date;
  basePrice: number;
  status?: ShowtimeStatus | undefined;
}

export interface UpdateShowtimeData {
  movieId?: string | undefined;
  roomId?: string | undefined;
  startTime?: Date | undefined;
  endTime?: Date | undefined;
  basePrice?: number | undefined;
  status?: ShowtimeStatus | undefined;
}

export interface ShowtimeRepository {
  findAll(filters?: ShowtimeFilters): Promise<Showtime[]>;
  findById(id: string): Promise<Showtime | null>;
  findOverlapping(roomId: string, startTime: Date, endTime: Date, excludeId?: string): Promise<Showtime | null>;
  findSeats(showtimeId: string): Promise<ShowtimeSeatView[]>;
  create(data: CreateShowtimeData): Promise<Showtime>;
  update(id: string, data: UpdateShowtimeData): Promise<Showtime | null>;
  delete(id: string): Promise<Showtime | null>;
}
