import { randomUUID } from "node:crypto";
import { prisma } from "../prisma/client.js";
import type {
  BookingFilters,
  BookingRepository,
  CreateBookingData,
  HoldSeatsData,
  HoldSeatsResult,
  ReleaseSeatsData,
} from "../../business/interfaces/booking.interface.js";
import type {
  BookingDetail,
  BookingStatus,
  TicketStatus,
} from "../../business/models/booking.model.js";
import { expireStaleBookings } from "./booking-expiration.js";

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
  payments: {
    include: { refund: true },
    orderBy: { createdAt: "desc" as const },
  },
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
    expiresAt: raw.expiresAt,
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
    payments: raw.payments.map((payment) => ({
      id: payment.id,
      txnRef: payment.txnRef,
      amount: Number(payment.amount),
      method: payment.method,
      status: payment.status,
      transactionNo: payment.transactionNo,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
      refund: payment.refund
        ? {
            id: payment.refund.id,
            refundCode: payment.refund.refundCode,
            amount: Number(payment.refund.amount),
            reason: payment.refund.reason,
            status: payment.refund.status,
            completedAt: payment.refund.completedAt,
          }
        : null,
    })),
  };
}

export class PrismaBookingRepository implements BookingRepository {
  async createWithSeats(
    data: CreateBookingData,
    bookingCode: string,
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

        // 2. Query requested showtime seats (supports either ShowtimeSeat ID or physical Seat ID)
        let showtimeSeats = await tx.showtimeSeat.findMany({
          where: {
            OR: [
              { id: { in: data.showtimeSeatIds } },
              { seatId: { in: data.showtimeSeatIds } },
            ],
            showtimeId: data.showtimeId,
          },
          include: { seat: true },
        });

        if (showtimeSeats.length !== data.showtimeSeatIds.length) {
          throw new Error("SOME_SEATS_NOT_FOUND");
        }

        // Lock the selected seat rows until this transaction finishes. This
        // prevents two concurrent requests from both creating an active
        // booking, while still preserving BookingSeat rows from cancelled
        // bookings as historical records.
        for (const seatId of showtimeSeats.map((seat) => seat.id).sort()) {
          await tx.$queryRaw`SELECT id FROM showtime_seats WHERE id = ${seatId} FOR UPDATE`;
        }
        showtimeSeats = await tx.showtimeSeat.findMany({
          where: { id: { in: showtimeSeats.map((seat) => seat.id) } },
          include: { seat: true },
        });

        const now = new Date();

        // Payment can only start from seats that are still held by this user.
        for (const s of showtimeSeats) {
          if (!s.seat.active) {
            throw new Error("SOME_SEATS_NOT_FOUND");
          }
          if (s.status !== "HELD" || s.heldByUserId !== data.userId) throw new Error("HOLD_REQUIRED");
          if (!s.holdExpiresAt || s.holdExpiresAt <= now) throw new Error("HOLD_EXPIRED");
        }

        // 3. Ensure these seats are not already attached to another active booking.
        const actualShowtimeSeatIds = showtimeSeats.map((s) => s.id);
        const conflictingBookings = await tx.booking.findMany({
          where: {
            status: { in: ["PENDING", "CONFIRMED"] },
            bookingSeats: { some: { showtimeSeatId: { in: actualShowtimeSeatIds } } },
          },
          include: bookingInclude,
        });

        // Retrying checkout for the same active hold must be idempotent. This
        // happens when the customer returns from VNPAY, refreshes checkout, or
        // clicks the payment button again after the booking was already made.
        const requestedSeatIds = [...actualShowtimeSeatIds].sort();
        const reusableBooking = conflictingBookings.find((booking) => {
          if (booking.status !== "PENDING" || booking.userId !== data.userId) return false;
          if (!booking.expiresAt || booking.expiresAt <= now) return false;
          const bookedSeatIds = booking.bookingSeats.map((seat) => seat.showtimeSeatId).sort();
          return bookedSeatIds.length === requestedSeatIds.length
            && bookedSeatIds.every((seatId, index) => seatId === requestedSeatIds[index]);
        });
        if (reusableBooking) return reusableBooking;
        if (conflictingBookings.length > 0) throw new Error("SEATS_ALREADY_BOOKED");

        // 4. Calculate total amount
        const totalAmount = showtimeSeats.reduce((sum, s) => sum + Number(s.price), 0);

        const expiresAt = showtimeSeats.reduce<Date>((earliest, seat) => {
          const value = seat.holdExpiresAt as Date;
          return value < earliest ? value : earliest;
        }, showtimeSeats[0]!.holdExpiresAt as Date);

        // 5. Create a PENDING Booking. IPN will confirm it and create tickets.
        const booking = await tx.booking.create({
          data: {
            userId: data.userId,
            showtimeId: data.showtimeId,
            bookingCode,
            totalAmount,
            status: "PENDING",
            expiresAt,
          },
        });

        // 6. Store the selected seats, but do not create tickets before payment.
        const seatItems = showtimeSeats.map((showtimeSeat) => {
          const seatId = randomUUID();
          return {
            id: seatId,
            bookingId: booking.id,
            showtimeSeatId: showtimeSeat.id,
            price: showtimeSeat.price,
          };
        });

        await tx.bookingSeat.createMany({
          data: seatItems,
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

  async holdSeats(data: HoldSeatsData, expiresAt: Date): Promise<HoldSeatsResult> {
    return prisma.$transaction(
      async (tx) => {
        const now = new Date();

        // 1. Verify showtime exists and is SCHEDULED
        const showtime = await tx.showtime.findUnique({
          where: { id: data.showtimeId },
        });
        if (!showtime) throw new Error("SHOWTIME_NOT_FOUND");
        if (showtime.status !== "SCHEDULED") throw new Error("SHOWTIME_NOT_AVAILABLE");
        if (now >= showtime.startTime) throw new Error("SHOWTIME_ALREADY_STARTED");

        // 2. Query requested showtime seats
        const showtimeSeats = await tx.showtimeSeat.findMany({
          where: {
            OR: [
              { id: { in: data.showtimeSeatIds } },
              { seatId: { in: data.showtimeSeatIds } },
            ],
            showtimeId: data.showtimeId,
          },
          include: { seat: true },
        });

        if (showtimeSeats.length !== data.showtimeSeatIds.length) {
          throw new Error("SOME_SEATS_NOT_FOUND");
        }

        const actualShowtimeSeatIds = showtimeSeats.map((s) => s.id);

        // 3. Check seat status conflicts
        for (const s of showtimeSeats) {
          if (!s.seat.active) {
            throw new Error("SOME_SEATS_NOT_FOUND");
          }
          if (s.status === "BOOKED") {
            throw new Error("SEATS_ALREADY_BOOKED");
          }
          if (
            s.status === "HELD" &&
            s.heldByUserId &&
            s.heldByUserId !== data.userId &&
            s.holdExpiresAt &&
            s.holdExpiresAt > now
          ) {
            throw new Error("SEATS_HELD_BY_ANOTHER_USER");
          }
        }

        // 4. Release any seats previously held by this user for this showtime that are no longer in this hold
        await tx.showtimeSeat.updateMany({
          where: {
            showtimeId: data.showtimeId,
            heldByUserId: data.userId,
            id: { notIn: actualShowtimeSeatIds },
            status: "HELD",
          },
          data: {
            status: "AVAILABLE",
            heldByUserId: null,
            holdExpiresAt: null,
          },
        });

        // 5. Atomically update the requested seats to HELD
        const updateResult = await tx.showtimeSeat.updateMany({
          where: {
            id: { in: actualShowtimeSeatIds },
            OR: [
              { status: "AVAILABLE" },
              { status: "HELD", heldByUserId: data.userId },
              { status: "HELD", holdExpiresAt: { lte: now } },
            ],
          },
          data: {
            status: "HELD",
            heldByUserId: data.userId,
            holdExpiresAt: expiresAt,
          },
        });

        if (updateResult.count !== actualShowtimeSeatIds.length) {
          throw new Error("SEATS_HELD_BY_ANOTHER_USER");
        }

        return {
          showtimeId: data.showtimeId,
          heldSeatIds: actualShowtimeSeatIds,
          holdExpiresAt: expiresAt,
          expiresInSeconds: Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000)),
        };
      },
      {
        maxWait: 10000,
        timeout: 25000,
      },
    );
  }

  async releaseSeats(data: ReleaseSeatsData): Promise<number> {
    return prisma.$transaction(async (tx) => {
      const heldSeats = await tx.showtimeSeat.findMany({
        where: {
          showtimeId: data.showtimeId,
          heldByUserId: data.userId,
          status: "HELD",
          ...(data.showtimeSeatIds && data.showtimeSeatIds.length > 0
            ? {
                OR: [
                  { id: { in: data.showtimeSeatIds } },
                  { seatId: { in: data.showtimeSeatIds } },
                ],
              }
            : {}),
        },
        select: { id: true },
      });

      if (heldSeats.length === 0) return 0;
      const selectedIds = heldSeats.map((seat) => seat.id);

      // A checkout may already have created a PENDING booking for this hold.
      // Releasing any seat from it means cancelling the whole pending order,
      // otherwise My Tickets would keep showing an order that can no longer be paid.
      const pendingBookings = await tx.booking.findMany({
        where: {
          userId: data.userId,
          showtimeId: data.showtimeId,
          status: "PENDING",
          bookingSeats: { some: { showtimeSeatId: { in: selectedIds } } },
        },
        select: {
          id: true,
          bookingSeats: { select: { showtimeSeatId: true } },
        },
      });

      const pendingBookingIds = pendingBookings.map((booking) => booking.id);
      if (pendingBookingIds.length > 0) {
        await tx.booking.updateMany({
          where: { id: { in: pendingBookingIds }, status: "PENDING" },
          data: { status: "CANCELLED" },
        });
        await tx.payment.updateMany({
          where: { bookingId: { in: pendingBookingIds }, status: "PENDING" },
          data: { status: "EXPIRED" },
        });
      }

      const seatIdsToRelease = Array.from(new Set([
        ...selectedIds,
        ...pendingBookings.flatMap((booking) =>
          booking.bookingSeats.map((seat) => seat.showtimeSeatId)),
      ]));
      const result = await tx.showtimeSeat.updateMany({
        where: {
          id: { in: seatIdsToRelease },
          heldByUserId: data.userId,
          status: "HELD",
        },
        data: {
          status: "AVAILABLE",
          heldByUserId: null,
          holdExpiresAt: null,
        },
      });
      return result.count;
    }, { maxWait: 10_000, timeout: 25_000 });
  }

  async findById(id: string): Promise<BookingDetail | null> {
    await expireStaleBookings({ bookingId: id });
    const raw = await prisma.booking.findUnique({
      where: { id },
      include: bookingInclude,
    });
    return raw ? mapBookingDetail(raw) : null;
  }

  async findByCode(bookingCode: string): Promise<BookingDetail | null> {
    const booking = await prisma.booking.findUnique({
      where: { bookingCode },
      select: { id: true },
    });
    if (booking) await expireStaleBookings({ bookingId: booking.id });
    const raw = await prisma.booking.findUnique({
      where: { bookingCode },
      include: bookingInclude,
    });
    return raw ? mapBookingDetail(raw) : null;
  }

  async findAll(filters: BookingFilters = {}): Promise<BookingDetail[]> {
    await expireStaleBookings(filters.userId ? { userId: filters.userId } : {});
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

  async cancel(id: string, reason?: string): Promise<BookingDetail | null> {
    const raw = await prisma.$transaction(
      async (tx) => {
        const current = await tx.booking.findUnique({
          where: { id },
          include: {
            bookingSeats: true,
            showtime: true,
            tickets: true,
            payments: { include: { refund: true }, orderBy: { createdAt: "desc" } },
          },
        });

        if (!current) return null;
        if (current.status === "CANCELLED") throw new Error("BOOKING_ALREADY_CANCELLED");
        if (current.status === "EXPIRED") throw new Error("BOOKING_EXPIRED");
        if (new Date() >= current.showtime.startTime) throw new Error("SHOWTIME_ALREADY_STARTED");
        if (current.status === "CONFIRMED") {
          const cutoff = new Date(current.showtime.startTime.getTime() - 2 * 60 * 60 * 1000);
          if (new Date() > cutoff) throw new Error("CANCELLATION_WINDOW_CLOSED");
          if (current.tickets.some((ticket) => ticket.status === "USED")) throw new Error("TICKET_ALREADY_USED");
        }

        const successfulPayment = current.payments.find((payment) =>
          payment.status === "SUCCESS" || payment.status === "REFUND_PENDING" || payment.status === "REFUNDED",
        );
        if (current.status === "CONFIRMED" && !successfulPayment) throw new Error("PAYMENT_NOT_FOUND");
        if (successfulPayment?.status === "REFUNDED" || successfulPayment?.refund?.status === "SUCCESS") {
          throw new Error("PAYMENT_ALREADY_REFUNDED");
        }

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

        // Sandbox project: simulate a full refund internally without calling VNPAY Refund API.
        if (successfulPayment) {
          await tx.payment.update({
            where: { id: successfulPayment.id },
            data: { status: "REFUND_PENDING" },
          });
          await tx.refund.create({
            data: {
              paymentId: successfulPayment.id,
              refundCode: `REF-${Date.now().toString(36).toUpperCase()}-${randomUUID().slice(0, 6).toUpperCase()}`,
              amount: successfulPayment.amount,
              reason: reason?.trim() || "Customer cancelled booking",
              status: "SUCCESS",
              completedAt: new Date(),
            },
          });
          await tx.payment.update({
            where: { id: successfulPayment.id },
            data: { status: "REFUNDED" },
          });
        }

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
