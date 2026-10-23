import { CircuitBreaker, type CircuitBreakerOptions } from "../resilience/circuit-breaker.js";

export interface ExternalMovieData {
  title: string;
  description: string;
  durationMinutes: number;
  genre: string;
  releaseDate: Date;
  posterUrl: string;
  status: "NOW_SHOWING" | "COMING_SOON";
}

const PRESET_BLOCKBUSTER_MOVIES: ExternalMovieData[] = [
  {
    title: "Dune: Hành Tinh Cát - Phần Hai",
    description: "Paul Atreides liên minh cùng Chani và tộc người Fremen để trả thù những kẻ đã hủy hoại gia đình anh, đối mặt với lựa chọn giữa tình yêu và vũ trụ.",
    durationMinutes: 166,
    releaseDate: new Date("2026-03-01T00:00:00Z"),
    posterUrl: "https://image.tmdb.org/t/p/original/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg",
    genre: "Hành động, Khoa học viễn tưởng",
    status: "NOW_SHOWING",
  },
  {
    title: "Godzilla x Kong: Đế Chế Mới",
    description: "Hai quái thú huyền thoại Godzilla và Kong phải hợp sức chống lại mối hiểm họa khổng lồ ẩn sâu bên trong Trái Đất đe dọa sự tồn vong của nhân loại.",
    durationMinutes: 115,
    releaseDate: new Date("2026-03-29T00:00:00Z"),
    posterUrl: "https://image.tmdb.org/t/p/w780/z1p34vh7dEOnLDmyCrlUVLuoDzd.jpg",
    genre: "Hành động, Phiêu lưu",
    status: "NOW_SHOWING",
  },
  {
    title: "Kung Fu Panda 4",
    description: "Po phải tìm kiếm và huấn luyện một Thần Long Đại Hiệp mới trước khi nhận chức vị Thủ lĩnh Tinh thần của Thung lũng Hòa Bình.",
    durationMinutes: 94,
    releaseDate: new Date("2026-03-08T00:00:00Z"),
    posterUrl: "https://image.tmdb.org/t/p/original/kDp1vUBnMpe8ak4rjgl3cLELqjU.jpg",
    genre: "Hoạt hình, Hài hước, Gia đình",
    status: "NOW_SHOWING",
  },
  {
    title: "Deadpool & Wolverine",
    description: "Wolverine đang dưỡng thương thì tình cờ đụng độ Deadpool lắm mồm. Cả hai bất đắc dĩ bắt tay vào một nhiệm vụ sinh tử cứu rỗi đa vũ trụ.",
    durationMinutes: 128,
    releaseDate: new Date("2026-07-26T00:00:00Z"),
    posterUrl: "https://image.tmdb.org/t/p/original/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg",
    genre: "Hành động, Siêu anh hùng",
    status: "NOW_SHOWING",
  },
  {
    title: "Oppenheimer",
    description: "Câu chuyện kịch tính về cuộc đời của nhà vật lý lý thuyết J. Robert Oppenheimer, người chỉ huy Dự án Manhattan chế tạo bom nguyên tử.",
    durationMinutes: 180,
    releaseDate: new Date("2026-01-15T00:00:00Z"),
    posterUrl: "https://image.tmdb.org/t/p/original/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg",
    genre: "Tiểu sử, Lịch sử, Chính kịch",
    status: "NOW_SHOWING",
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

export class TmdbGateway {
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
    const endpoint = process.env.TMDB_API_URL?.trim() || "https://api.themoviedb.org/3/movie/now_playing";

    if (!apiKey && !process.env.TMDB_API_URL) {
      return this.fallbackPresetMovies();
    }

    const url = new URL(endpoint);
    url.searchParams.set("language", "vi-VN");
    url.searchParams.set("page", "1");

    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      throw new Error(`TMDB_API_ERROR: HTTP ${res.status}`);
    }

    const data: any = await res.json();
    if (!data.results || !Array.isArray(data.results)) {
      throw new Error("TMDB_INVALID_PAYLOAD");
    }

    return data.results.slice(0, 8).map((m: any) => ({
      title: m.title || m.original_title,
      description: m.overview || "Đang cập nhật tóm tắt nội dung...",
      durationMinutes: 120, // default if not fetched per-movie
      genre: "Chiếu rạp",
      releaseDate: m.release_date ? new Date(m.release_date) : new Date(),
      posterUrl: m.poster_path ? `https://image.tmdb.org/t/p/w780${m.poster_path}` : PRESET_BLOCKBUSTER_MOVIES[0]!.posterUrl,
      status: "NOW_SHOWING" as const,
    }));
  }

  async getNowPlayingMovies(): Promise<ExternalMovieData[]> {
    return this.breaker.execute(() => this.fetchRawNowPlaying());
  }
}

export const tmdbGateway = new TmdbGateway();
