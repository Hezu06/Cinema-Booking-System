import type {
  CinemaRepository,
  CreateCinemaData,
  UpdateCinemaData,
} from "../interfaces/cinema.interface.js";
import type { CacheService } from "../interfaces/cache.interface.js";
import { ConflictError } from "../../shared/errors/index.js";

export class CinemaService {
  constructor(
    private readonly cinemaRepository: CinemaRepository,
    private readonly cacheService?: CacheService,
  ) {}

  private async invalidateCache(id?: string): Promise<void> {
    if (!this.cacheService) return;
    try {
      await this.cacheService.del("cinemas:all");
      if (id) {
        await this.cacheService.del(`cinemas:${id}`);
      }
      await this.cacheService.delByPattern("cinemas:*");
      // Changing cinema may affect showtimes listings
      await this.cacheService.delByPattern("showtimes:*");
    } catch (err) {
      console.error("[CinemaService] ❌ Failed to invalidate cache:", err);
    }
  }

  async getAllCinemas() {
    const cacheKey = "cinemas:all";
    if (this.cacheService) {
      const cached = await this.cacheService.get<
        Awaited<ReturnType<CinemaRepository["findAll"]>>
      >(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const cinemas = await this.cinemaRepository.findAll();
    if (this.cacheService && cinemas) {
      await this.cacheService.set(cacheKey, cinemas, 300); // 5 min TTL
    }
    return cinemas;
  }

  async getCinemaById(id: string) {
    const cacheKey = `cinemas:${id}`;
    if (this.cacheService) {
      const cached = await this.cacheService.get<
        Awaited<ReturnType<CinemaRepository["findById"]>>
      >(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const cinema = await this.cinemaRepository.findById(id);
    if (this.cacheService && cinema) {
      await this.cacheService.set(cacheKey, cinema, 300);
    }
    return cinema;
  }

  async createCinema(data: CreateCinemaData) {
    const newCinema: CreateCinemaData = {
      name: data.name.trim(),
      address: data.address.trim(),
      city: data.city.trim(),
    };

    const created = await this.cinemaRepository.create(newCinema);
    await this.invalidateCache();
    return created;
  }

  async updateCinema(id: string, data: UpdateCinemaData) {
    const currentCinema = await this.cinemaRepository.findById(id);

    if (!currentCinema) {
      return null;
    }

    const updatedData: UpdateCinemaData = {
      ...data,
      ...(data.name !== undefined ? { name: data.name.trim() } : {}),
      ...(data.address !== undefined ? { address: data.address.trim() } : {}),
      ...(data.city !== undefined ? { city: data.city.trim() } : {}),
    };

    const updated = await this.cinemaRepository.update(id, updatedData);
    await this.invalidateCache(id);
    return updated;
  }

  async deleteCinema(id: string) {
    const cinema = await this.cinemaRepository.findById(id);

    if (!cinema) {
      return null;
    }

    const hasRooms = await this.cinemaRepository.hasRooms(id);

    if (hasRooms) {
      throw new ConflictError(
        "Cinema cannot be deleted because it still contains rooms",
      );
    }

    const deleted = await this.cinemaRepository.delete(id);
    await this.invalidateCache(id);
    return deleted;
  }
}
