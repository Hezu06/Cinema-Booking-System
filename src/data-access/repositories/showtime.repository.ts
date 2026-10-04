import { prisma } from "../prisma/client.js";
import type {
  CreateShowtimeData,
  ShowtimeFilters,
  ShowtimeRepository,
  UpdateShowtimeData,
} from "../../business/interfaces/showtime.interface.js";
import type { Showtime, ShowtimeSeatView } from "../../business/models/showtime.model.js";

const showtimeInclude = {
  movie: true,
  room: {
    include: {
      cinema: true,
    },
  },
} as const;

type BasePrismaShowtime = NonNullable<Awaited<ReturnType<typeof prisma.showtime.findFirst>>>;

type PopulatedPrismaShowtime = BasePrismaShowtime & {
  movie?: any;
  room?: any;
};

function mapShowtime(showtime: PopulatedPrismaShowtime): Showtime {
  const { movie, room, ...rest } = showtime;
  return {
    ...rest,
    basePrice: Number(showtime.basePrice),
    ...(movie ? { movie } : {}),
    ...(room ? { room } : {}),
  };
}

export class PrismaShowtimeRepository implements ShowtimeRepository {
  async findAll(filters: ShowtimeFilters = {}): Promise<Showtime[]> {
    const nextDay = filters.date ? new Date(filters.date.getTime() + 24 * 60 * 60 * 1000) : undefined;
    const showtimes = await prisma.showtime.findMany({
      where: {
        ...(filters.movieId !== undefined ? { movieId: filters.movieId } : {}),
        ...(filters.roomId !== undefined ? { roomId: filters.roomId } : {}),
        ...(filters.cinemaId !== undefined ? { room: { cinemaId: filters.cinemaId } } : {}),
        ...(filters.status !== undefined ? { status: filters.status } : {}),
        ...(filters.date !== undefined && nextDay !== undefined
          ? { startTime: { gte: filters.date, lt: nextDay } }
          : {}),
      },
      include: showtimeInclude,
      orderBy: { startTime: "asc" },
    });
    return showtimes.map(mapShowtime);
  }

  async findById(id: string): Promise<Showtime | null> {
    const showtime = await prisma.showtime.findUnique({
      where: { id },
      include: showtimeInclude,
    });
    return showtime ? mapShowtime(showtime) : null;
  }

  async findOverlapping(roomId: string, startTime: Date, endTime: Date, excludeId?: string): Promise<Showtime | null> {
    const showtime = await prisma.showtime.findFirst({
      where: {
        roomId,
        status: { not: "CANCELLED" },
        ...(excludeId !== undefined ? { id: { not: excludeId } } : {}),
        startTime: { lt: endTime },
        endTime: { gt: startTime },
      },
    });
    return showtime ? mapShowtime(showtime) : null;
  }

  async findSeats(showtimeId: string): Promise<ShowtimeSeatView[]> {
    const now = new Date();
    // Opportunistically release expired held seats for this showtime
    await prisma.showtimeSeat.updateMany({
      where: {
        showtimeId,
        status: "HELD",
        holdExpiresAt: { lte: now },
      },
      data: {
        status: "AVAILABLE",
        heldByUserId: null,
        holdExpiresAt: null,
      },
    });

    const seats = await prisma.showtimeSeat.findMany({
      where: { showtimeId, seat: { active: true } },
      include: { seat: true },
      orderBy: [{ seat: { rowLabel: "asc" } }, { seat: { seatNumber: "asc" } }],
    });
    return seats.map((item) => ({ ...item, price: Number(item.price) }));
  }

  async create(data: CreateShowtimeData): Promise<Showtime> {
    const showtime = await prisma.$transaction(async (transaction) => {
      const created = await transaction.showtime.create({
        data: {
          movieId: data.movieId,
          roomId: data.roomId,
          startTime: data.startTime,
          endTime: data.endTime,
          basePrice: data.basePrice,
          ...(data.status !== undefined ? { status: data.status } : {}),
        },
      });
      const seats = await transaction.seat.findMany({
        where: { roomId: data.roomId, active: true },
        select: { id: true },
      });
      if (seats.length > 0) {
        await transaction.showtimeSeat.createMany({
          data: seats.map((seat) => ({
            showtimeId: created.id,
            seatId: seat.id,
            price: data.basePrice,
          })),
        });
      }
      return created;
    });
    return mapShowtime(showtime);
  }

  async update(id: string, data: UpdateShowtimeData): Promise<Showtime | null> {
    const current = await prisma.showtime.findUnique({ where: { id } });
    if (!current) return null;

    try {
      const updated = await prisma.$transaction(async (transaction) => {
        const result = await transaction.showtime.update({
          where: { id },
          data: {
            ...(data.movieId !== undefined ? { movieId: data.movieId } : {}),
            ...(data.roomId !== undefined ? { roomId: data.roomId } : {}),
            ...(data.startTime !== undefined ? { startTime: data.startTime } : {}),
            ...(data.endTime !== undefined ? { endTime: data.endTime } : {}),
            ...(data.basePrice !== undefined ? { basePrice: data.basePrice } : {}),
            ...(data.status !== undefined ? { status: data.status } : {}),
          },
        });

        if (data.roomId !== undefined && data.roomId !== current.roomId) {
          await transaction.showtimeSeat.deleteMany({ where: { showtimeId: id } });
          const seats = await transaction.seat.findMany({
            where: { roomId: data.roomId, active: true },
            select: { id: true },
          });
          if (seats.length > 0) {
            await transaction.showtimeSeat.createMany({
              data: seats.map((seat) => ({
                showtimeId: id,
                seatId: seat.id,
                price: data.basePrice ?? Number(current.basePrice),
              })),
            });
          }
        } else if (data.basePrice !== undefined) {
          await transaction.showtimeSeat.updateMany({
            where: { showtimeId: id, status: "AVAILABLE" },
            data: { price: data.basePrice },
          });
        }
        return result;
      });
      return mapShowtime(updated);
    } catch (error) {
      if (typeof error === "object" && error !== null && "code" in error && error.code === "P2025") return null;
      throw error;
    }
  }

  async delete(id: string): Promise<Showtime | null> {
    const showtime = await prisma.showtime.findUnique({ where: { id } });
    if (!showtime) return null;
    try {
      const deleted = await prisma.showtime.delete({ where: { id } });
      return mapShowtime(deleted);
    } catch (error) {
      if (typeof error === "object" && error !== null && "code" in error && error.code === "P2025") return null;
      throw error;
    }
  }
}
