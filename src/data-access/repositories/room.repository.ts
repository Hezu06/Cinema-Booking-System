import { prisma } from "../prisma/client.js";

import type {
  RoomRepository,
  CreateRoomData,
  UpdateRoomData,
} from "../../business/interfaces/room.interface.js";

import type {
  Room,
} from "../../business/models/room.model.js";

export class PrismaRoomRepository
  implements RoomRepository
{
  async findAll(): Promise<Room[]> {
    return prisma.room.findMany({
      orderBy: [
        { cinemaId: "asc" },
        { name: "asc" },
      ],
    });
  }

  async findById(id: string): Promise<Room | null> {
    return prisma.room.findUnique({
      where: {
        id,
      },
    });
  }

  async findByCinemaIdAndName(
    cinemaId: string,
    name: string,
  ): Promise<Room | null> {
    return prisma.room.findUnique({
      where: {
        cinemaId_name: {
          cinemaId,
          name: name.trim(),
        },
      },
    });
  }

  async create(data: CreateRoomData): Promise<Room> {
    return prisma.room.create({
      data: {
        cinemaId: data.cinemaId,
        name: data.name,
        type: data.type,
        capacity: data.capacity,
      },
    });
  }

  async update(
    id: string,
    data: UpdateRoomData,
  ): Promise<Room | null> {
    const room = await prisma.room.findUnique({
      where: {
        id,
      },
    });

    if (!room) {
      return null;
    }

    try {
      return await prisma.room.update({
        where: {
          id,
        },

        data: {
          ...(data.cinemaId !== undefined
            ? { cinemaId: data.cinemaId }
            : {}),

          ...(data.name !== undefined
            ? { name: data.name }
            : {}),

          ...(data.type !== undefined
            ? { type: data.type }
            : {}),

          ...(data.capacity !== undefined
            ? { capacity: data.capacity }
            : {}),
        },
      });
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "P2025"
      ) {
        return null;
      }

      throw error;
    }
  }

  async delete(id: string): Promise<Room | null> {
    const room = await prisma.room.findUnique({
      where: {
        id,
      },
    });

    if (!room) {
      return null;
    }

    try {
      return await prisma.room.delete({
        where: {
          id,
        },
      });
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "P2025"
      ) {
        return null;
      }

      throw error;
    }
  }
}