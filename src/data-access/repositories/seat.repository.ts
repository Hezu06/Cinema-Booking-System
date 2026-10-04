import { prisma } from "../prisma/client.js";
import type {
  CreateSeatData,
  SeatFilters,
  SeatRepository,
  UpdateSeatData,
} from "../../business/interfaces/seat.interface.js";
import type { Seat } from "../../business/models/seat.model.js";

export class PrismaSeatRepository implements SeatRepository {
  async findAll(filters: SeatFilters = {}): Promise<Seat[]> {
    return prisma.seat.findMany({
      where: {
        ...(filters.roomId !== undefined ? { roomId: filters.roomId } : {}),
        ...(filters.active !== undefined ? { active: filters.active } : {}),
      },
      orderBy: [{ roomId: "asc" }, { rowLabel: "asc" }, { seatNumber: "asc" }],
    });
  }

  async findById(id: string): Promise<Seat | null> {
    return prisma.seat.findUnique({ where: { id } });
  }

  async findByPosition(roomId: string, rowLabel: string, seatNumber: number): Promise<Seat | null> {
    return prisma.seat.findUnique({
      where: { roomId_rowLabel_seatNumber: { roomId, rowLabel, seatNumber } },
    });
  }

  async countByRoomId(roomId: string): Promise<number> {
    return prisma.seat.count({ where: { roomId } });
  }

  async create(data: CreateSeatData): Promise<Seat> {
    return prisma.$transaction(async (transaction) => {
      const seat = await transaction.seat.create({
        data: {
          roomId: data.roomId,
          rowLabel: data.rowLabel,
          seatNumber: data.seatNumber,
          type: data.type,
          ...(data.active !== undefined ? { active: data.active } : {}),
        },
      });

      const scheduledShowtimes = await transaction.showtime.findMany({
        where: { roomId: data.roomId, status: "SCHEDULED" },
        select: { id: true, basePrice: true },
      });

      if (seat.active && scheduledShowtimes.length > 0) {
        await transaction.showtimeSeat.createMany({
          data: scheduledShowtimes.map((showtime) => ({
            showtimeId: showtime.id,
            seatId: seat.id,
            price: showtime.basePrice,
          })),
        });
      }

      return seat;
    });
  }

  async update(id: string, data: UpdateSeatData): Promise<Seat | null> {
    const seat = await prisma.seat.findUnique({ where: { id } });
    if (!seat) return null;

    try {
      return await prisma.seat.update({
        where: { id },
        data: {
          ...(data.roomId !== undefined ? { roomId: data.roomId } : {}),
          ...(data.rowLabel !== undefined ? { rowLabel: data.rowLabel } : {}),
          ...(data.seatNumber !== undefined ? { seatNumber: data.seatNumber } : {}),
          ...(data.type !== undefined ? { type: data.type } : {}),
          ...(data.active !== undefined ? { active: data.active } : {}),
        },
      });
    } catch (error) {
      if (typeof error === "object" && error !== null && "code" in error && error.code === "P2025") {
        return null;
      }
      throw error;
    }
  }

  async delete(id: string): Promise<Seat | null> {
    const seat = await prisma.seat.findUnique({ where: { id } });
    if (!seat) return null;

    try {
      return await prisma.seat.delete({ where: { id } });
    } catch (error) {
      if (typeof error === "object" && error !== null && "code" in error && error.code === "P2025") {
        return null;
      }
      throw error;
    }
  }
}
