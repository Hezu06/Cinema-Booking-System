import type {
  CinemaRepository,
  CreateCinemaData,
  UpdateCinemaData,
} from "../interfaces/cinema.interface.js";

export class CinemaService {
  constructor(
    private readonly cinemaRepository:
      CinemaRepository
  ) {}

  async getAllCinemas() {
    return this.cinemaRepository.findAll();
  }

  async getCinemaById(
    id: string
  ) {
    return this.cinemaRepository.findById(id);
  }

  async createCinema(
    data: CreateCinemaData
  ) {
    const newCinema: CreateCinemaData = {
      name: data.name.trim(),
      address: data.address.trim(),
      city: data.city.trim(),
    };

    return this.cinemaRepository.create(
      newCinema
    );
  }

  async updateCinema(
    id: string,
    data: UpdateCinemaData
  ) {
    const currentCinema =
      await this.cinemaRepository.findById(
        id
      );

    if (!currentCinema) {
      return null;
    }

    const updatedData: UpdateCinemaData = {
      ...data,

      ...(data.name !== undefined
        ? {
            name: data.name.trim(),
          }
        : {}),

      ...(data.address !== undefined
        ? {
            address:
              data.address.trim(),
          }
        : {}),

      ...(data.city !== undefined
        ? {
            city: data.city.trim(),
          }
        : {}),
    };

    return this.cinemaRepository.update(
      id,
      updatedData
    );
  }

  async deleteCinema(
    id: string
  ) {
    const cinema =
      await this.cinemaRepository.findById(
        id
      );

    if (!cinema) {
      return null;
    }

    const hasRooms =
      await this.cinemaRepository.hasRooms(
        id
      );

    if (hasRooms) {
      throw new Error(
        "Cinema cannot be deleted because it still contains rooms"
      );
    }

    return this.cinemaRepository.delete(id);
  }
}