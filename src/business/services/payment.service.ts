import { randomUUID } from "node:crypto";
import type {
  PaymentCallbackResult,
  PaymentGateway,
  PaymentRepository,
} from "../interfaces/payment.interface.js";
import type { BookingRepository } from "../interfaces/booking.interface.js";
import type { EmailService } from "../interfaces/email.interface.js";
import type { PaymentView } from "../models/payment.model.js";
import { getClientTicketUrl } from "../utils/client-url.util.js";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ServiceUnavailableError,
} from "../../shared/errors/index.js";

function createTxnRef(): string {
  // VNPAY requires vnp_TxnRef to be alphanumeric. Do not use separators such
  // as "-" because the SIT portal may accept the payment but fail to index it.
  const timestamp = Date.now().toString(36).toUpperCase();
  const randomPart = randomUUID().replace(/[^a-zA-Z0-9]/g, "").slice(0, 8).toUpperCase();
  return `PAY${timestamp}${randomPart}`;
}

function createOrderInfo(bookingCode: string): string {
  const safeBookingCode = bookingCode.replace(/[^a-zA-Z0-9]/g, "");
  return `Thanh toan booking ${safeBookingCode}`;
}

export class PaymentService {
  constructor(
    private readonly paymentRepository: PaymentRepository,
    private readonly paymentGateway: PaymentGateway,
    private readonly bookingRepository?: BookingRepository,
    private readonly emailService?: EmailService,
  ) {}

  async createVnpayPayment(
    userId: string,
    bookingId: string,
    ipAddress: string,
    bankCode?: string,
  ): Promise<{ payment: PaymentView; paymentUrl: string }> {
    if (!this.paymentGateway.isConfigured()) {
      throw new ServiceUnavailableError("VNPAY Sandbox chưa được cấu hình");
    }
    const booking = await this.paymentRepository.findBookingContext(bookingId);
    if (!booking) {
      throw new NotFoundError("Booking không tồn tại");
    }
    if (booking.userId !== userId) {
      throw new ForbiddenError("Bạn không có quyền thao tác với booking này");
    }
    if (booking.status !== "PENDING") {
      throw new ConflictError("Booking không ở trạng thái chờ thanh toán");
    }
    if (!booking.expiresAt || booking.expiresAt <= new Date()) {
      throw new ConflictError("Booking đã hết hạn thanh toán");
    }

    const attempts = await this.paymentRepository.findByBookingId(bookingId);
    const payment = attempts.find((attempt) => attempt.status === "PENDING")
      ?? await this.paymentRepository.create({
        bookingId,
        txnRef: createTxnRef(),
        amount: booking.totalAmount,
      });
    const paymentUrl = this.paymentGateway.createPaymentUrl({
      txnRef: payment.txnRef,
      amount: payment.amount,
      orderInfo: createOrderInfo(booking.bookingCode),
      ipAddress,
      expireAt: booking.expiresAt,
      bankCode,
    });
    return { payment, paymentUrl };
  }

  async getBookingPayments(userId: string, role: string, bookingId: string): Promise<PaymentView[]> {
    const booking = await this.paymentRepository.findBookingContext(bookingId);
    if (!booking) {
      throw new NotFoundError("Booking không tồn tại");
    }
    if (role !== "ADMIN" && booking.userId !== userId) {
      throw new ForbiddenError("Bạn không có quyền thao tác với booking này");
    }
    return this.paymentRepository.findByBookingId(bookingId);
  }

  async handleIpn(params: Record<string, string>): Promise<PaymentCallbackResult> {
    if (!this.paymentGateway.verifyCallback(params)) return { rspCode: "97", message: "Invalid signature" };
    const amount = Number(params.vnp_Amount ?? "0") / 100;
    const transactionNo = params.vnp_TransactionNo;
    const result = await this.paymentRepository.processCallback({
      txnRef: params.vnp_TxnRef ?? "",
      amount,
      responseCode: params.vnp_ResponseCode ?? "",
      transactionStatus: params.vnp_TransactionStatus ?? "",
      ...(transactionNo && transactionNo !== "0" ? { transactionNo } : {}),
      ...(params.vnp_BankCode ? { bankCode: params.vnp_BankCode } : {}),
      ...(params.vnp_PayDate ? { payDate: this.parsePayDate(params.vnp_PayDate) } : {}),
    }, (bookingCode, index) => `${bookingCode}-${index + 1}`);

    if (result.newlyConfirmed && result.payment) {
      await this.sendConfirmationEmailSafe(result.payment.bookingId);
    }

    return result;
  }

  async inspectReturn(params: Record<string, string>): Promise<{ valid: boolean; payment: PaymentView | null; responseCode: string }> {
    const valid = this.paymentGateway.verifyCallback(params);
    if (!valid) return { valid: false, payment: null, responseCode: "97" };
    const amount = Number(params.vnp_Amount ?? "0") / 100;
    const transactionNo = params.vnp_TransactionNo;
    const result = await this.paymentRepository.processCallback({
      txnRef: params.vnp_TxnRef ?? "",
      amount,
      responseCode: params.vnp_ResponseCode ?? "",
      transactionStatus: params.vnp_TransactionStatus ?? "",
      ...(transactionNo && transactionNo !== "0" ? { transactionNo } : {}),
      ...(params.vnp_BankCode ? { bankCode: params.vnp_BankCode } : {}),
      ...(params.vnp_PayDate ? { payDate: this.parsePayDate(params.vnp_PayDate) } : {}),
    }, (bookingCode, index) => `${bookingCode}-${index + 1}`);

    if (result.newlyConfirmed && result.payment) {
      await this.sendConfirmationEmailSafe(result.payment.bookingId);
    }

    const payment = result.payment ?? await this.paymentRepository.findByTxnRef(params.vnp_TxnRef ?? "");
    return { valid: true, payment, responseCode: params.vnp_ResponseCode ?? "" };
  }

  private async sendConfirmationEmailSafe(bookingId: string): Promise<void> {
    if (!this.bookingRepository || !this.emailService) return;
    try {
      const booking = await this.bookingRepository.findById(bookingId);
      if (!booking || !booking.user?.email) return;

      const seatLabels = booking.bookingSeats
        .map((bs) => `${bs.seat.rowLabel}${bs.seat.seatNumber}`)
        .filter(Boolean);

      const ticketUrl = getClientTicketUrl(booking.id);

      await this.emailService.sendBookingTicketEmail({
        to: booking.user.email,
        name: booking.user.fullName || "Quý khách",
        bookingCode: booking.bookingCode,
        bookingId: booking.id,
        movieTitle: booking.showtime.movie.title,
        moviePosterUrl: booking.showtime.movie.posterUrl,
        cinemaName: booking.showtime.room.cinema.name,
        cinemaAddress: booking.showtime.room.cinema.address,
        roomName: booking.showtime.room.name,
        startTime: booking.showtime.startTime,
        seatLabels,
        totalAmount: booking.totalAmount,
        ticketUrl,
      });
    } catch (error) {
      console.error(`[PaymentService] Failed to send ticket confirmation email for booking ${bookingId}:`, error);
    }
  }

  private parsePayDate(value: string): Date | undefined {
    if (!/^\d{14}$/.test(value)) return undefined;
    const y = value.slice(0, 4), m = value.slice(4, 6), d = value.slice(6, 8);
    const h = value.slice(8, 10), min = value.slice(10, 12), s = value.slice(12, 14);
    return new Date(`${y}-${m}-${d}T${h}:${min}:${s}+07:00`);
  }
}
