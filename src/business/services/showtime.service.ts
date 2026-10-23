import type { MovieRepository } from "../interfaces/movie.interface.js";
import type { RoomRepository } from "../interfaces/room.interface.js";
import type {
  CreateShowtimeData,
  ShowtimeFilters,
  ShowtimeRepository,
  UpdateShowtimeData,
} from "../interfaces/showtime.interface.js";
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from "../../shared/errors/index.js";

export class ShowtimeService {
  constructor(
    private readonly showtimeRepository: ShowtimeRepository,
    private readonly movieRepository: MovieRepository,
    private readonly roomRepository: RoomRepository,
  ) {}

  getAllShowtimes(filters?: ShowtimeFilters) {
    return this.showtimeRepository.findAll(filters);
  }

  getShowtimeById(id: string) {
    return this.showtimeRepository.findById(id);
  }

  async getShowtimeSeats(id: string) {
    const showtime = await this.showtimeRepository.findById(id);
    if (!showtime) return null;
    return this.showtimeRepository.findSeats(id);
  }

  async createShowtime(data: CreateShowtimeData) {
    await this.validateReferences(data.movieId, data.roomId);
    this.validateTimeRange(data.startTime, data.endTime);
    const overlap = await this.showtimeRepository.findOverlapping(
      data.roomId,
      data.startTime,
      data.endTime,
    );
    if (overlap) {
      throw new ConflictError("Showtime overlaps another showtime in this room");
    }
    return this.showtimeRepository.create(data);
  }

  async updateShowtime(id: string, data: UpdateShowtimeData) {
    const current = await this.showtimeRepository.findById(id);
    if (!current) return null;
    const movieId = data.movieId ?? current.movieId;
    const roomId = data.roomId ?? current.roomId;
    const startTime = data.startTime ?? current.startTime;
    const endTime = data.endTime ?? current.endTime;

    await this.validateReferences(movieId, roomId);
    this.validateTimeRange(startTime, endTime);
    const overlap = await this.showtimeRepository.findOverlapping(
      roomId,
      startTime,
      endTime,
      id,
    );
    if (overlap) {
      throw new ConflictError("Showtime overlaps another showtime in this room");
    }
    return this.showtimeRepository.update(id, data);
  }

  deleteShowtime(id: string) {
    return this.showtimeRepository.delete(id);
  }

  private async validateReferences(movieId: string, roomId: string) {
    const [movie, room] = await Promise.all([
      this.movieRepository.findById(movieId),
      this.roomRepository.findById(roomId),
    ]);
    if (!movie) throw new NotFoundError("Movie not found");
    if (!room) throw new NotFoundError("Room not found");
  }

  private validateTimeRange(startTime: Date, endTime: Date) {
    if (startTime >= endTime) {
      throw new BadRequestError("startTime must be before endTime");
    }
  }
}
