import { prisma } from "../prisma/client.js";

interface ExpirationScope {
  bookingId?: string;
  userId?: string;
}

/**
 * Lazily closes abandoned bookings. This keeps the API consistent even when a
 * customer closes the VNPAY page and no failure return is opened in the browser.
 */
export async function expireStaleBookings(scope: ExpirationScope = {}): Promise<void> {
  const now = new Date();
  const staleBookings = await prisma.booking.findMany({
    where: {
      status: "PENDING",
      expiresAt: { lte: now },
      ...(scope.bookingId ? { id: scope.bookingId } : {}),
      ...(scope.userId ? { userId: scope.userId } : {}),
    },
    select: {
      id: true,
      userId: true,
      bookingSeats: { select: { showtimeSeatId: true } },
    },
  });

  if (staleBookings.length === 0) return;

  await prisma.$transaction(async (tx) => {
    for (const booking of staleBookings) {
      const expired = await tx.booking.updateMany({
        where: { id: booking.id, status: "PENDING", expiresAt: { lte: now } },
        data: { status: "EXPIRED" },
      });
      if (expired.count === 0) continue;

      await tx.payment.updateMany({
        where: { bookingId: booking.id, status: "PENDING" },
        data: { status: "EXPIRED" },
      });

      await tx.showtimeSeat.updateMany({
        where: {
          id: { in: booking.bookingSeats.map((seat) => seat.showtimeSeatId) },
          status: "HELD",
          heldByUserId: booking.userId,
          holdExpiresAt: { lte: now },
        },
        data: { status: "AVAILABLE", heldByUserId: null, holdExpiresAt: null },
      });
    }
  }, { maxWait: 10_000, timeout: 30_000 });
}
