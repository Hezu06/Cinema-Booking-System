import { CircuitBreaker, type CircuitBreakerOptions } from "../resilience/circuit-breaker.js";
import type {
  ExternalMovieData,
  ExternalMovieGateway,
} from "../../business/interfaces/movie.interface.js";

const PRESET_BLOCKBUSTER_MOVIES: ExternalMovieData[] = [
  {
    title: "Venom: Kèo Cuối",
    description: "Eddie Brock và Venom bước vào cuộc đào tẩu hiểm nguy khi bị săn lùng ráo riết bởi cả hai thế giới loài người và chủng tộc Symbiote ngoài vũ trụ.",
    durationMinutes: 110,
    releaseDate: new Date("2026-10-23T00:00:00Z"),
    posterUrl: "https://image.tmdb.org/t/p/w780/aos8Vh92ity6DaJ9JyVa8stIoxP.jpg",
    genre: "Hành động, Khoa học viễn tưởng, Phiêu lưu",
    status: "NOW_SHOWING",
  },
  {
    title: "Robot Hoang Dã",
    description: "Cuộc phiêu lưu kỳ thú của cô người máy thông minh Roz sau khi bị đắm tàu tại một hoang đảo hẻo lánh và trở thành mẹ nuôi của chú ngỗng con mồ côi Brightbill.",
    durationMinutes: 102,
    releaseDate: new Date("2026-10-15T00:00:00Z"),
    posterUrl: "https://image.tmdb.org/t/p/w780/9w0Vh9eizfBXrcomiaFWTIPdboo.jpg",
    genre: "Hoạt hình, Gia đình, Khoa học viễn tưởng",
    status: "NOW_SHOWING",
  },
  {
    title: "Transformers Một",
    description: "Câu chuyện về nguồn gốc chưa từng kể của Optimus Prime và Megatron, từ những người anh em chiến hữu gắn kết keo sơn trên hành tinh Cybertron thành kẻ thù truyền kiếp.",
    durationMinutes: 104,
    releaseDate: new Date("2026-10-02T00:00:00Z"),
    posterUrl: "https://image.tmdb.org/t/p/w780/iRCvdK4mIqLwYm3OomlqS6a2fA2.jpg",
    genre: "Hoạt hình, Hành động, Khoa học viễn tưởng",
    status: "NOW_SHOWING",
  },
  {
    title: "Cười 2",
    description: "Ngôi sao nhạc pop toàn cầu Skye Riley sắp bắt đầu chuyến lưu diễn thế giới mới thì bắt đầu trải qua những sự kiện kỳ dị và kinh hoàng khó giải thích.",
    durationMinutes: 127,
    releaseDate: new Date("2026-10-18T00:00:00Z"),
    posterUrl: "https://image.tmdb.org/t/p/w780/bDu5mJk4z15a3pZ5M7K8i9d0.jpg",
    genre: "Kinh dị, Bí ẩn, Tâm lý",
    status: "NOW_SHOWING",
  },
  {
    title: "Joker: Điên Có Đôi",
    description: "Arthur Fleck đang thụ án tại viện tâm thần Arkham trong khi chờ xét xử thì gặp gỡ tình yêu định mệnh Harley Quinn và khám phá ra điệu nhạc bên trong tâm hồn mình.",
    durationMinutes: 138,
    releaseDate: new Date("2026-10-04T00:00:00Z"),
    posterUrl: "https://image.tmdb.org/t/p/w780/aciP8Km0waTLAg1AhWymE7GF2.jpg",
    genre: "Tâm lý, Nhạc kịch, Tội phạm",
    status: "NOW_SHOWING",
  },
  {
    title: "Võ Sĩ Giác Đấu II",
    description: "Nhiều năm sau cái chết của người hùng Maximus, Lucius bị buộc phải bước vào đấu trường La Mã Colosseum để chiến đấu nhằm trả lại vinh quang cho Rome.",
    durationMinutes: 148,
    releaseDate: new Date("2026-11-15T00:00:00Z"),
    posterUrl: "https://image.tmdb.org/t/p/w780/2cxhvwyEwRlysAmRH4iodkvo0z5.jpg",
    genre: "Hành động, Sử thi, Phiêu lưu",
    status: "COMING_SOON",
  },
  {
    title: "Moana 2: Hành Trình Mới",
    description: "Nhận được lời hiệu triệu bất ngờ từ tổ tiên, Moana cùng Maui và thủy thủ đoàn mới bắt đầu chuyến hải trình vượt đại dương đến những vùng biển xa xôi đầy hiểm nguy của Châu Đại Dương.",
    durationMinutes: 100,
    releaseDate: new Date("2026-11-27T00:00:00Z"),
    posterUrl: "https://image.tmdb.org/t/p/w780/yh64qw9mgikvla2a0q51978d1.jpg",
    genre: "Hoạt hình, Phiêu lưu, Gia đình, Âm nhạc",
    status: "COMING_SOON",
  },
  {
    title: "Avatar: Lửa và Tro Tàn",
    description: "Hành trình tiếp theo của gia đình Jake Sully đưa họ đến vùng đất của Tộc Người Tro - một bộ tộc Na'vi hung hãn và bí hiểm trên hành tinh Pandora.",
    durationMinutes: 190,
    releaseDate: new Date("2026-12-19T00:00:00Z"),
    posterUrl: "https://image.tmdb.org/t/p/original/t6HIqrRAclMCA60NsSmeqe9RmNV.jpg",
    genre: "Khoa học viễn tưởng, Phiêu lưu",
    status: "COMING_SOON",
  },
];

export class TmdbGateway implements ExternalMovieGateway {
  public readonly breaker: CircuitBreaker<[], ExternalMovieData[]>;

  constructor(options?: Partial<CircuitBreakerOptions<[], ExternalMovieData[]>>) {
    this.breaker = new CircuitBreaker<[], ExternalMovieData[]>({
      name: "TmdbMovieGateway",
      timeoutMs: options?.timeoutMs ?? Number(process.env.CIRCUIT_BREAKER_TIMEOUT ?? 3000),
      errorThresholdPercentage: options?.errorThresholdPercentage ?? Number(process.env.CIRCUIT_BREAKER_ERROR_THRESHOLD ?? 50),
      resetTimeoutMs: options?.resetTimeoutMs ?? Number(process.env.CIRCUIT_BREAKER_RESET_TIMEOUT ?? 10000),
      volumeThreshold: options?.volumeThreshold ?? Number(process.env.CIRCUIT_BREAKER_VOLUME_THRESHOLD ?? 5),
      enabled: options?.enabled ?? (process.env.CIRCUIT_BREAKER_ENABLED !== "false"),
      fallback: () => this.fallbackPresetMovies(),
      ...options,
    });
  }

  private fallbackPresetMovies(): ExternalMovieData[] {
    console.warn(`🛡️ [CIRCUIT BREAKER - TMDB FALLBACK] Using local curated movie presets. State: ${this.breaker.getState()}`);
    return PRESET_BLOCKBUSTER_MOVIES;
  }

  private async fetchRawNowPlaying(): Promise<ExternalMovieData[]> {
    const apiKey = process.env.TMDB_API_KEY?.trim();
    const customEndpoint = process.env.TMDB_API_URL?.trim();

    // If no API key and no custom endpoint (e.g. mock test server) is configured, fallback to curated blockbuster movies
    if (!apiKey && !customEndpoint) {
      return this.fallbackPresetMovies();
    }

    const endpoint = customEndpoint || "https://api.themoviedb.org/3/movie/now_playing";
    const url = new URL(endpoint);
    url.searchParams.set("language", "vi-VN");
    url.searchParams.set("page", "1");
    if (apiKey && !apiKey.startsWith("ey")) {
      url.searchParams.set("api_key", apiKey);
    }

    const headers: Record<string, string> = {
      Accept: "application/json",
    };
    if (apiKey && apiKey.startsWith("ey")) {
      headers["Authorization"] = `Bearer ${apiKey}`;
    }

    const res = await fetch(url.toString(), {
      headers,
    });

    if (!res.ok) {
      throw new Error(`TMDB_API_ERROR: HTTP ${res.status}`);
    }

    const data = (await res.json()) as { results?: Array<Record<string, unknown>> };
    if (!data.results || !Array.isArray(data.results)) {
      throw new Error("TMDB_INVALID_PAYLOAD");
    }

    return data.results.slice(0, 10).map((m) => {
      const title = String(m.title || m.original_title || "Phim Mới");
      const description = String(m.overview || "Đang cập nhật tóm tắt nội dung...");
      const releaseDateStr = typeof m.release_date === "string" ? m.release_date : "";
      const releaseDate = releaseDateStr ? new Date(releaseDateStr) : new Date();
      const posterPath = typeof m.poster_path === "string" ? m.poster_path : "";
      const posterUrl = posterPath
        ? `https://image.tmdb.org/t/p/w780${posterPath}`
        : PRESET_BLOCKBUSTER_MOVIES[0]!.posterUrl;

      const isComingSoon = releaseDate.getTime() > Date.now();

      return {
        title,
        description,
        durationMinutes: 120,
        genre: "Chiếu rạp, Hành động, Phiêu lưu",
        releaseDate,
        posterUrl,
        status: isComingSoon ? ("COMING_SOON" as const) : ("NOW_SHOWING" as const),
      };
    });
  }

  async getNowPlayingMovies(): Promise<ExternalMovieData[]> {
    return this.breaker.execute(() => this.fetchRawNowPlaying());
  }
}

export const tmdbGateway = new TmdbGateway();
export { PRESET_BLOCKBUSTER_MOVIES };
