import { randomUUID } from "node:crypto";
import { prisma } from "../prisma/client.js";
import type {
  CreatePaymentData,
  PaymentBookingContext,
  PaymentCallbackResult,
  PaymentRepository,
  ProcessPaymentCallbackData,
} from "../../business/interfaces/payment.interface.js";
import type { PaymentView, RefundView } from "../../business/models/payment.model.js";
import { expireStaleBookings } from "./booking-expiration.js";

const paymentInclude = { refund: true } as const;
type RawPayment = NonNullable<Awaited<ReturnType<typeof prisma.payment.findFirst<{ include: typeof paymentInclude }>>>>;

function mapRefund(raw: RawPayment["refund"]): RefundView | null {
  return raw ? { ...raw, amount: Number(raw.amount) } : null;
}

function mapPayment(raw: RawPayment): PaymentView {
  return {
    ...raw,
    amount: Number(raw.amount),
    refund: mapRefund(raw.refund),
  };
}

export class PrismaPaymentRepository implements PaymentRepository {
  async findBookingContext(bookingId: string): Promise<PaymentBookingContext | null> {
    await expireStaleBookings({ bookingId });
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        userId: true,
        bookingCode: true,
        totalAmount: true,
        status: true,
        expiresAt: true,
      },
    });
    return booking ? { ...booking, totalAmount: Number(booking.totalAmount) } : null;
  }

  async create(data: CreatePaymentData): Promise<PaymentView> {
    const payment = await prisma.payment.create({
      data: {
        bookingId: data.bookingId,
        txnRef: data.txnRef,
        amount: data.amount,
      },
      include: paymentInclude,
    });
    return mapPayment(payment);
  }

  async findByTxnRef(txnRef: string): Promise<PaymentView | null> {
    const payment = await prisma.payment.findUnique({
      where: { txnRef },
      include: paymentInclude,
    });
    return payment ? mapPayment(payment) : null;
  }

  async findByBookingId(bookingId: string): Promise<PaymentView[]> {
    const payments = await prisma.payment.findMany({
      where: { bookingId },
      include: paymentInclude,
      orderBy: { createdAt: "desc" },
    });
    return payments.map(mapPayment);
  }

  async processCallback(
    data: ProcessPaymentCallbackData,
    ticketCodeGenerator: (bookingCode: string, index: number) => string,
  ): Promise<PaymentCallbackResult> {
    return prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findUnique({
        where: { txnRef: data.txnRef },
        include: { booking: { include: { bookingSeats: true } }, refund: true },
      });
      if (!payment) return { rspCode: "01", message: "Order not found" };
      if (Number(payment.amount) !== data.amount) return { rspCode: "04", message: "Invalid amount" };
      if (payment.status !== "PENDING") return { rspCode: "02", message: "Order already confirmed", payment: mapPayment(payment) };

      const success = data.responseCode === "00" && data.transactionStatus === "00";
      const gatewayData = {
        responseCode: data.responseCode,
        transactionStatus: data.transactionStatus,
        ...(data.transactionNo !== undefined ? { transactionNo: data.transactionNo } : {}),
        ...(data.bankCode !== undefined ? { bankCode: data.bankCode } : {}),
        ...(data.payDate !== undefined ? { payDate: data.payDate } : {}),
      };

      if (!success) {
        const failed = await tx.payment.updateMany({
          where: { id: payment.id, status: "PENDING" },
          data: { ...gatewayData, status: "FAILED" },
        });
        if (failed.count === 0) return { rspCode: "02", message: "Order already confirmed" };
        const bookingExpired = !payment.booking.expiresAt || payment.booking.expiresAt <= new Date();
        if (payment.booking.status === "PENDING" && bookingExpired) {
          await tx.booking.update({ where: { id: payment.bookingId }, data: { status: "EXPIRED" } });
          const ids = payment.booking.bookingSeats.map((seat) => seat.showtimeSeatId);
          await tx.showtimeSeat.updateMany({
            where: { id: { in: ids }, status: "HELD", heldByUserId: payment.booking.userId },
            data: { status: "AVAILABLE", heldByUserId: null, holdExpiresAt: null },
          });
        }
      } else {
        if (payment.booking.status !== "PENDING") return { rspCode: "02", message: "Order already confirmed" };
        const claimed = await tx.payment.updateMany({
          where: { id: payment.id, status: "PENDING" },
          data: { ...gatewayData, status: "SUCCESS" },
        });
        if (claimed.count === 0) return { rspCode: "02", message: "Order already confirmed" };

        const confirmed = await tx.booking.updateMany({
          where: { id: payment.bookingId, status: "PENDING" },
          data: { status: "CONFIRMED" },
        });
        if (confirmed.count === 0) {
          await tx.payment.update({ where: { id: payment.id }, data: { status: "REFUNDED" } });
          await tx.refund.create({
            data: {
              paymentId: payment.id,
              refundCode: `REF-CLOSED-${Date.now().toString(36).toUpperCase()}-${randomUUID().slice(0, 6).toUpperCase()}`,
              amount: payment.amount,
              reason: "Payment completed after the booking was closed",
              status: "SUCCESS",
              completedAt: new Date(),
            },
          });
          const refunded = await tx.payment.findUnique({ where: { id: payment.id }, include: paymentInclude });
          return {
            rspCode: "00",
            message: "Payment received for a closed booking and refunded",
            ...(refunded ? { payment: mapPayment(refunded) } : {}),
          };
        }

        const seatIds = payment.booking.bookingSeats.map((seat) => seat.showtimeSeatId);
        const booked = await tx.showtimeSeat.updateMany({
          where: {
            id: { in: seatIds },
            status: "HELD",
            heldByUserId: payment.booking.userId,
            holdExpiresAt: { gt: new Date() },
          },
          data: { status: "BOOKED", heldByUserId: null, holdExpiresAt: null },
        });
        if (booked.count !== seatIds.length) {
          // The gateway reports success after the local seat hold expired. Keep
          // the system consistent by closing the booking and recording an
          // immediate full simulated refund.
          await tx.booking.update({ where: { id: payment.bookingId }, data: { status: "EXPIRED" } });
          await tx.showtimeSeat.updateMany({
            where: { id: { in: seatIds } },
            data: { status: "AVAILABLE", heldByUserId: null, holdExpiresAt: null },
          });
          await tx.payment.update({
            where: { id: payment.id },
            data: { ...gatewayData, status: "REFUNDED" },
          });
          await tx.refund.create({
            data: {
              paymentId: payment.id,
              refundCode: `REF-LATE-${Date.now().toString(36).toUpperCase()}-${randomUUID().slice(0, 6).toUpperCase()}`,
              amount: payment.amount,
              reason: "Payment completed after the seat hold expired",
              status: "SUCCESS",
              completedAt: new Date(),
            },
          });

          const refunded = await tx.payment.findUnique({ where: { id: payment.id }, include: paymentInclude });
          return {
            rspCode: "00",
            message: "Payment received after expiration and refunded",
            ...(refunded ? { payment: mapPayment(refunded) } : {}),
          };
        }

        const existingTickets = await tx.ticket.count({ where: { bookingId: payment.bookingId } });
        if (existingTickets === 0) {
          await tx.ticket.createMany({
            data: payment.booking.bookingSeats.map((seat, index) => ({
              id: randomUUID(),
              bookingId: payment.bookingId,
              bookingSeatId: seat.id,
              ticketCode: ticketCodeGenerator(payment.booking.bookingCode, index),
              qrCode: `TICKET:${ticketCodeGenerator(payment.booking.bookingCode, index)}`,
              status: "VALID",
            })),
          });
        }
      }

      const updated = await tx.payment.findUnique({ where: { id: payment.id }, include: paymentInclude });
      if (!updated) return { rspCode: "01", message: "Order not found" };
      return { rspCode: "00", message: "Confirm success", payment: mapPayment(updated) };
    }, { maxWait: 10_000, timeout: 30_000 });
  }
}
