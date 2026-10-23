import type {
  MovieRepository,
  CreateMovieData,
  UpdateMovieData,
  ExternalMovieGateway,
  SyncMoviesOptions,
  SyncMoviesResult,
  SyncMovieDetail,
} from '../interfaces/movie.interface.js'
import type { ShowtimeRepository } from '../interfaces/showtime.interface.js'
import type { RoomRepository } from '../interfaces/room.interface.js'

export class MovieService {
  constructor(
    private readonly movieRepository: MovieRepository,
    private readonly externalMovieGateway?: ExternalMovieGateway,
    private readonly showtimeRepository?: ShowtimeRepository,
    private readonly roomRepository?: RoomRepository
  ) {}

  async getAllMovies() {
    return this.movieRepository.findAll()
  }

  async getMovieById(id: string) {
    return this.movieRepository.findById(id)
  }

  async createMovie(data: CreateMovieData) {
    const releaseDate = new Date(data.releaseDate)
    const trimmedTitle = data.title.trim()

    const existingMovie = await this.movieRepository.findByTitleAndReleaseDate(
      trimmedTitle,
      releaseDate
    )

    if (existingMovie) {
      throw new Error(
        `Phim '${trimmedTitle}' với ngày giờ phát hành này đã tồn tại trong hệ thống`
      )
    }

    const newMovie: CreateMovieData = {
      ...data,
      title: trimmedTitle,
      releaseDate: releaseDate,
    }

    return this.movieRepository.create(newMovie)
  }

  async updateMovie(id: string, data: UpdateMovieData) {
    const currentMovie = await this.movieRepository.findById(id)
    if (!currentMovie) {
      return null
    }

    const targetTitle =
      data.title !== undefined ? data.title.trim() : currentMovie.title
    const targetReleaseDate =
      data.releaseDate !== undefined
        ? new Date(data.releaseDate)
        : currentMovie.releaseDate

    // Nếu tiêu đề hoặc ngày giờ phát hành thay đổi, kiểm tra xung đột với các phim khác
    if (
      targetTitle !== currentMovie.title ||
      targetReleaseDate.getTime() !== currentMovie.releaseDate.getTime()
    ) {
      const conflictMovie = await this.movieRepository.findByTitleAndReleaseDate(
        targetTitle,
        targetReleaseDate
      )

      if (conflictMovie && conflictMovie.id !== id) {
        throw new Error(
          `Phim '${targetTitle}' với ngày giờ phát hành này đã tồn tại trong hệ thống`
        )
      }
    }

    const updatedData: UpdateMovieData = {
      ...data,
      ...(data.title !== undefined ? { title: targetTitle } : {}),
      ...(data.releaseDate !== undefined ? { releaseDate: targetReleaseDate } : {}),
    }

    return this.movieRepository.update(id, updatedData)
  }

  async deleteMovie(id: string) {
    return this.movieRepository.delete(id)
  }

  async syncExternalMovies(options?: SyncMoviesOptions): Promise<SyncMoviesResult> {
    if (!this.externalMovieGateway) {
      throw new Error("Dịch vụ lấy phim ngoại vi (External Movie Gateway) chưa được cấu hình");
    }

    const markEndedOlderThanDays = options?.markEndedOlderThanDays ?? 60;
    const autoCreateShowtimes = options?.autoCreateShowtimes ?? true;

    // 1. Kéo phim từ Gateway ngoại vi (được bảo vệ bởi Circuit Breaker)
    const externalMovies = await this.externalMovieGateway.getNowPlayingMovies();

    let added = 0;
    let updated = 0;
    let markedEnded = 0;
    let showtimesCreated = 0;
    const details: SyncMovieDetail[] = [];

    // 2. Cập nhật hoặc thêm mới từng phim
    for (const ext of externalMovies) {
      const existing = await this.movieRepository.findByTitle(ext.title);

      if (!existing) {
        const created = await this.movieRepository.create({
          title: ext.title,
          description: ext.description,
          durationMinutes: ext.durationMinutes,
          genre: ext.genre,
          releaseDate: ext.releaseDate,
          posterUrl: ext.posterUrl,
          status: ext.status,
        });

        added += 1;
        details.push({
          title: created.title,
          action: "CREATED",
          status: created.status,
        });
      } else {
        // Cập nhật thông tin mới nhất
        await this.movieRepository.update(existing.id, {
          description: ext.description,
          posterUrl: ext.posterUrl,
          durationMinutes: ext.durationMinutes,
          genre: ext.genre,
          status: ext.status,
        });

        updated += 1;
        details.push({
          title: existing.title,
          action: "UPDATED",
          status: ext.status,
        });
      }
    }

    // 3. Tự động chuyển các phim quá cũ (quá số ngày quy định) sang trạng thái ENDED
    if (markEndedOlderThanDays > 0) {
      const cutoffDate = new Date(Date.now() - markEndedOlderThanDays * 24 * 60 * 60 * 1000);
      const oldMovies = await this.movieRepository.findOldMovies(cutoffDate);
      for (const oldMovie of oldMovies) {
        await this.movieRepository.update(oldMovie.id, { status: "ENDED" });
        markedEnded += 1;
      }
    }

    // 4. Tự động tạo suất chiếu cho các phim NOW_SHOWING nếu được bật
    if (autoCreateShowtimes) {
      showtimesCreated = await this.autoScheduleUpcomingShowtimes();
    }

    return {
      totalFetched: externalMovies.length,
      added,
      updated,
      markedEnded,
      showtimesCreated,
      details,
    };
  }

  private async autoScheduleUpcomingShowtimes(): Promise<number> {
    if (!this.showtimeRepository || !this.roomRepository) {
      return 0;
    }

    const rooms = await this.roomRepository.findAll();
    if (rooms.length === 0) return 0;

    const allMovies = await this.movieRepository.findAll();
    const nowShowingMovies = allMovies.filter((m) => m.status === "NOW_SHOWING");
    if (nowShowingMovies.length === 0) return 0;

    const DAYS_TO_SCHEDULE = 7;
    const START_HOURS = [9, 13, 17, 20];
    const BASE_PRICE = 90_000;
    const CLEANUP_MINUTES = 20;

    let createdCount = 0;
    const now = new Date();

    for (let dayOffset = 0; dayOffset < DAYS_TO_SCHEDULE; dayOffset++) {
      for (let rIdx = 0; rIdx < rooms.length; rIdx++) {
        const room = rooms[rIdx]!;

        for (let slotIdx = 0; slotIdx < START_HOURS.length; slotIdx++) {
          const hour = START_HOURS[slotIdx]!;
          const startTime = new Date();
          startTime.setDate(startTime.getDate() + dayOffset);
          startTime.setHours(hour, 0, 0, 0);

          if (startTime.getTime() <= now.getTime() + 30 * 60 * 1000) {
            continue;
          }

          const movieIndex =
            (dayOffset * rooms.length * START_HOURS.length +
              rIdx * START_HOURS.length +
              slotIdx) %
            nowShowingMovies.length;
          const movie = nowShowingMovies[movieIndex]!;

          const durationMs = (movie.durationMinutes + CLEANUP_MINUTES) * 60 * 1000;
          const endTime = new Date(startTime.getTime() + durationMs);

          const overlap = await this.showtimeRepository.findOverlapping(
            room.id,
            startTime,
            endTime
          );

          if (!overlap) {
            await this.showtimeRepository.create({
              movieId: movie.id,
              roomId: room.id,
              startTime,
              endTime,
              basePrice: BASE_PRICE,
              status: "SCHEDULED",
            });
            createdCount++;
          }
        }
      }
    }

    return createdCount;
  }
}
