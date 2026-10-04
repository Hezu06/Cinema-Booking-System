import type { MovieRepository } from "../interfaces/movie.interface.js";
import type { RoomRepository } from "../interfaces/room.interface.js";
import type {
  CreateShowtimeData,
  ShowtimeFilters,
  ShowtimeRepository,
  UpdateShowtimeData,
} from "../interfaces/showtime.interface.js";

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
    const overlap = await this.showtimeRepository.findOverlapping(data.roomId, data.startTime, data.endTime);
    if (overlap) throw new Error("SHOWTIME_OVERLAP");
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
    const overlap = await this.showtimeRepository.findOverlapping(roomId, startTime, endTime, id);
    if (overlap) throw new Error("SHOWTIME_OVERLAP");
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
    if (!movie) throw new Error("MOVIE_NOT_FOUND");
    if (!room) throw new Error("ROOM_NOT_FOUND");
  }

  private validateTimeRange(startTime: Date, endTime: Date) {
    if (startTime >= endTime) throw new Error("INVALID_TIME_RANGE");
  }
}
