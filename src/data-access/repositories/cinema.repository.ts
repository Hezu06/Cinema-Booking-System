import {
  prisma,
} from "../prisma/client.js";

import type {
  CinemaRepository,
  CreateCinemaData,
  UpdateCinemaData,
} from "../../business/interfaces/cinema.interface.js";

import type {
  Cinema,
} from "../../business/models/cinema.model.js";

export class PrismaCinemaRepository
  implements CinemaRepository
{
  async findAll(): Promise<Cinema[]> {
    return prisma.cinema.findMany({
      orderBy: {
        name: "asc",
      },
    });
  }

  async findById(
    id: string
  ): Promise<Cinema | null> {
    return prisma.cinema.findUnique({
      where: {
        id,
      },
    });
  }

  async create(
    data: CreateCinemaData
  ): Promise<Cinema> {
    return prisma.cinema.create({
      data: {
        name: data.name,
        address: data.address,
        city: data.city,
      },
    });
  }

  async update(
    id: string,
    data: UpdateCinemaData
  ): Promise<Cinema | null> {
    const cinema =
      await prisma.cinema.findUnique({
        where: {
          id,
        },
      });

    if (!cinema) {
      return null;
    }

    return prisma.cinema.update({
      where: {
        id,
      },

      data: {
        ...(data.name !== undefined
          ? {
              name: data.name,
            }
          : {}),

        ...(data.address !== undefined
          ? {
              address:
                data.address,
            }
          : {}),

        ...(data.city !== undefined
          ? {
              city: data.city,
            }
          : {}),
      },
    });
  }

  async delete(
    id: string
  ): Promise<Cinema | null> {
    const cinema =
      await prisma.cinema.findUnique({
        where: {
          id,
        },
      });

    if (!cinema) {
      return null;
    }

    return prisma.cinema.delete({
      where: {
        id,
      },
    });
  }

  async hasRooms(
    id: string
  ): Promise<boolean> {
    const roomCount =
      await prisma.room.count({
        where: {
          cinemaId: id,
        },
      });

    return roomCount > 0;
  }
}