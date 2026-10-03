import { randomUUID } from "node:crypto";
import { prisma } from "../prisma/client.js";
import type {
  BookingFilters,
  BookingRepository,
  CreateBookingData,
} from "../../business/interfaces/booking.interface.js";
import type {
  BookingDetail,
  BookingStatus,
  TicketStatus,
} from "../../business/models/booking.model.js";

const bookingInclude = {
  user: {
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
    },
  },
  showtime: {
    include: {
      movie: true,
      room: {
        include: {
          cinema: true,
        },
      },
    },
  },
  bookingSeats: {
    include: {
      showtimeSeat: {
        include: {
          seat: true,
        },
      },
      ticket: true,
    },
  },
  tickets: true,
} as const;

type RawBooking = NonNullable<
  Awaited<ReturnType<typeof prisma.booking.findFirst<{ include: typeof bookingInclude }>>>
>;

function mapBookingDetail(raw: RawBooking): BookingDetail {
  return {
    id: raw.id,
    userId: raw.userId,
    showtimeId: raw.showtimeId,
    bookingCode: raw.bookingCode,
    totalAmount: Number(raw.totalAmount),
    status: raw.status as BookingStatus,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    user: raw.user,
    showtime: {
      id: raw.showtime.id,
      movieId: raw.showtime.movieId,
      roomId: raw.showtime.roomId,
      startTime: raw.showtime.startTime,
      endTime: raw.showtime.endTime,
      basePrice: Number(raw.showtime.basePrice),
      status: raw.showtime.status,
      movie: {
        id: raw.showtime.movie.id,
        title: raw.showtime.movie.title,
        posterUrl: raw.showtime.movie.posterUrl,
        durationMinutes: raw.showtime.movie.durationMinutes,
        genre: raw.showtime.movie.genre,
      },
      room: {
        id: raw.showtime.room.id,
        name: raw.showtime.room.name,
        type: raw.showtime.room.type,
        cinema: {
          id: raw.showtime.room.cinema.id,
          name: raw.showtime.room.cinema.name,
          address: raw.showtime.room.cinema.address,
          city: raw.showtime.room.cinema.city,
        },
      },
    },
    bookingSeats: raw.bookingSeats.map((bs) => ({
      id: bs.id,
      bookingId: bs.bookingId,
      showtimeSeatId: bs.showtimeSeatId,
      price: Number(bs.price),
      createdAt: bs.createdAt,
      seat: {
        id: bs.showtimeSeat.seat.id,
        roomId: bs.showtimeSeat.seat.roomId,
        rowLabel: bs.showtimeSeat.seat.rowLabel,
        seatNumber: bs.showtimeSeat.seat.seatNumber,
        type: bs.showtimeSeat.seat.type,
      },
      ticket: bs.ticket
        ? {
            id: bs.ticket.id,
            bookingId: bs.ticket.bookingId,
            bookingSeatId: bs.ticket.bookingSeatId,
            ticketCode: bs.ticket.ticketCode,
            qrCode: bs.ticket.qrCode,
            status: bs.ticket.status as TicketStatus,
            createdAt: bs.ticket.createdAt,
            updatedAt: bs.ticket.updatedAt,
          }
        : null,
    })),
    tickets: raw.tickets.map((t) => ({
      id: t.id,
      bookingId: t.bookingId,
      bookingSeatId: t.bookingSeatId,
      ticketCode: t.ticketCode,
      qrCode: t.qrCode,
      status: t.status as TicketStatus,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    })),
  };
}

export class PrismaBookingRepository implements BookingRepository {
  async createWithSeats(
    data: CreateBookingData,
    bookingCode: string,
    ticketCodeGenerator: (index: number) => string,
  ): Promise<BookingDetail> {
    const raw = await prisma.$transaction(
      async (tx) => {
        // 1. Verify showtime exists and is SCHEDULED
        const showtime = await tx.showtime.findUnique({
          where: { id: data.showtimeId },
        });
        if (!showtime) throw new Error("SHOWTIME_NOT_FOUND");
        if (showtime.status !== "SCHEDULED") throw new Error("SHOWTIME_NOT_AVAILABLE");
        if (new Date() >= showtime.startTime) throw new Error("SHOWTIME_ALREADY_STARTED");

        // 2. Query requested showtime seats
        const showtimeSeats = await tx.showtimeSeat.findMany({
          where: {
            id: { in: data.showtimeSeatIds },
            showtimeId: data.showtimeId,
          },
          include: { seat: true },
        });

        if (showtimeSeats.length !== data.showtimeSeatIds.length) {
          throw new Error("SOME_SEATS_NOT_FOUND");
        }

        // Check if all seats are active and available
        const inactiveOrUnavailable = showtimeSeats.filter(
          (s) => !s.seat.active || s.status !== "AVAILABLE",
        );
        if (inactiveOrUnavailable.length > 0) {
          throw new Error("SEATS_ALREADY_BOOKED");
        }

        // 3. Atomically lock & mark seats as BOOKED (concurrency safety)
        const updateResult = await tx.showtimeSeat.updateMany({
          where: {
            id: { in: data.showtimeSeatIds },
            status: "AVAILABLE",
          },
          data: {
            status: "BOOKED",
            heldByUserId: null,
            holdExpiresAt: null,
          },
        });

        if (updateResult.count !== data.showtimeSeatIds.length) {
          throw new Error("SEATS_ALREADY_BOOKED");
        }

        // 4. Calculate total amount
        const totalAmount = showtimeSeats.reduce((sum, s) => sum + Number(s.price), 0);

        // 5. Create Booking
        const booking = await tx.booking.create({
          data: {
            userId: data.userId,
            showtimeId: data.showtimeId,
            bookingCode,
            totalAmount,
            status: "CONFIRMED",
          },
        });

        // 6. Batch prepare & insert BookingSeats and Tickets
        const seatItems = showtimeSeats.map((showtimeSeat, i) => {
          const seatId = randomUUID();
          const ticketId = randomUUID();
          const ticketCode = ticketCodeGenerator(i);
          return {
            seat: {
              id: seatId,
              bookingId: booking.id,
              showtimeSeatId: showtimeSeat.id,
              price: showtimeSeat.price,
            },
            ticket: {
              id: ticketId,
              bookingId: booking.id,
              bookingSeatId: seatId,
              ticketCode,
              qrCode: `TICKET:${ticketCode}`,
              status: "VALID" as const,
            },
          };
        });

        await tx.bookingSeat.createMany({
          data: seatItems.map((item) => item.seat),
        });

        await tx.ticket.createMany({
          data: seatItems.map((item) => item.ticket),
        });

        // 7. Return complete booking with relations
        const result = await tx.booking.findUnique({
          where: { id: booking.id },
          include: bookingInclude,
        });

        if (!result) throw new Error("BOOKING_CREATION_FAILED");
        return result;
      },
      {
        maxWait: 10000,
        timeout: 30000,
      },
    );

    return mapBookingDetail(raw);
  }

  async findById(id: string): Promise<BookingDetail | null> {
    const raw = await prisma.booking.findUnique({
      where: { id },
      include: bookingInclude,
    });
    return raw ? mapBookingDetail(raw) : null;
  }

  async findByCode(bookingCode: string): Promise<BookingDetail | null> {
    const raw = await prisma.booking.findUnique({
      where: { bookingCode },
      include: bookingInclude,
    });
    return raw ? mapBookingDetail(raw) : null;
  }

  async findAll(filters: BookingFilters = {}): Promise<BookingDetail[]> {
    const list = await prisma.booking.findMany({
      where: {
        ...(filters.userId !== undefined ? { userId: filters.userId } : {}),
        ...(filters.showtimeId !== undefined ? { showtimeId: filters.showtimeId } : {}),
        ...(filters.status !== undefined ? { status: filters.status } : {}),
        ...(filters.bookingCode !== undefined ? { bookingCode: filters.bookingCode } : {}),
      },
      include: bookingInclude,
      orderBy: { createdAt: "desc" },
    });
    return list.map(mapBookingDetail);
  }

  async cancel(id: string): Promise<BookingDetail | null> {
    const raw = await prisma.$transaction(
      async (tx) => {
        const current = await tx.booking.findUnique({
          where: { id },
          include: {
            bookingSeats: true,
            showtime: true,
          },
        });

        if (!current) return null;
        if (current.status === "CANCELLED") throw new Error("BOOKING_ALREADY_CANCELLED");
        if (new Date() >= current.showtime.startTime) throw new Error("SHOWTIME_ALREADY_STARTED");

        // Update booking to CANCELLED
        await tx.booking.update({
          where: { id },
          data: { status: "CANCELLED" },
        });

        // Update all tickets to CANCELLED
        await tx.ticket.updateMany({
          where: { bookingId: id },
          data: { status: "CANCELLED" },
        });

        // Release seats back to AVAILABLE
        const showtimeSeatIds = current.bookingSeats.map((bs) => bs.showtimeSeatId);
        await tx.showtimeSeat.updateMany({
          where: { id: { in: showtimeSeatIds } },
          data: {
            status: "AVAILABLE",
            heldByUserId: null,
            holdExpiresAt: null,
          },
        });

        return tx.booking.findUnique({
          where: { id },
          include: bookingInclude,
        });
      },
      {
        maxWait: 10000,
        timeout: 25000,
      },
    );

    return raw ? mapBookingDetail(raw) : null;
  }
}
