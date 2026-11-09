import type { MovieRepository } from "../interfaces/movie.interface.js";
import type { RoomRepository } from "../interfaces/room.interface.js";
import type {
  CreateShowtimeData,
  ShowtimeFilters,
  ShowtimeRepository,
  UpdateShowtimeData,
} from "../interfaces/showtime.interface.js";
import type { CacheService } from "../interfaces/cache.interface.js";
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
    private readonly cacheService?: CacheService,
  ) {}

  private async invalidateCache(id?: string): Promise<void> {
    if (!this.cacheService) return;
    try {
      if (id) {
        await this.cacheService.del(`showtimes:${id}`);
      }
      await this.cacheService.delByPattern("showtimes:*");
    } catch (err) {
      console.error("[ShowtimeService] ❌ Failed to invalidate cache:", err);
    }
  }

  async getAllShowtimes(filters?: ShowtimeFilters) {
    const filterKey = filters ? JSON.stringify(filters) : "all";
    const cacheKey = `showtimes:query:${filterKey}`;

    if (this.cacheService) {
      const cached = await this.cacheService.get<
        Awaited<ReturnType<ShowtimeRepository["findAll"]>>
      >(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const showtimes = await this.showtimeRepository.findAll(filters);
    if (this.cacheService && showtimes) {
      await this.cacheService.set(cacheKey, showtimes, 180); // 3 min TTL
    }
    return showtimes;
  }

  async getShowtimeById(id: string) {
    const cacheKey = `showtimes:${id}`;

    if (this.cacheService) {
      const cached = await this.cacheService.get<
        Awaited<ReturnType<ShowtimeRepository["findById"]>>
      >(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const showtime = await this.showtimeRepository.findById(id);
    if (this.cacheService && showtime) {
      await this.cacheService.set(cacheKey, showtime, 180);
    }
    return showtime;
  }

  async getShowtimeSeats(id: string) {
    // Live seat inventory is intentionally NOT cached to avoid stale booking states
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
    const created = await this.showtimeRepository.create(data);
    await this.invalidateCache();
    return created;
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
    const updated = await this.showtimeRepository.update(id, data);
    await this.invalidateCache(id);
    return updated;
  }

  async deleteShowtime(id: string) {
    const deleted = await this.showtimeRepository.delete(id);
    await this.invalidateCache(id);
    return deleted;
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
