import { randomUUID } from "node:crypto";
import type {
  PaymentCallbackResult,
  PaymentGateway,
  PaymentRepository,
} from "../interfaces/payment.interface.js";
import type { PaymentView } from "../models/payment.model.js";

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
  ) {}

  async createVnpayPayment(
    userId: string,
    bookingId: string,
    ipAddress: string,
    bankCode?: string,
  ): Promise<{ payment: PaymentView; paymentUrl: string }> {
    if (!this.paymentGateway.isConfigured()) throw new Error("VNPAY_NOT_CONFIGURED");
    const booking = await this.paymentRepository.findBookingContext(bookingId);
    if (!booking) throw new Error("BOOKING_NOT_FOUND");
    if (booking.userId !== userId) throw new Error("FORBIDDEN");
    if (booking.status !== "PENDING") throw new Error("BOOKING_NOT_PENDING");
    if (!booking.expiresAt || booking.expiresAt <= new Date()) throw new Error("BOOKING_EXPIRED");

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
    if (!booking) throw new Error("BOOKING_NOT_FOUND");
    if (role !== "ADMIN" && booking.userId !== userId) throw new Error("FORBIDDEN");
    return this.paymentRepository.findByBookingId(bookingId);
  }

  async handleIpn(params: Record<string, string>): Promise<PaymentCallbackResult> {
    if (!this.paymentGateway.verifyCallback(params)) return { rspCode: "97", message: "Invalid signature" };
    const amount = Number(params.vnp_Amount ?? "0") / 100;
    const transactionNo = params.vnp_TransactionNo;
    return this.paymentRepository.processCallback({
      txnRef: params.vnp_TxnRef ?? "",
      amount,
      responseCode: params.vnp_ResponseCode ?? "",
      transactionStatus: params.vnp_TransactionStatus ?? "",
      ...(transactionNo && transactionNo !== "0" ? { transactionNo } : {}),
      ...(params.vnp_BankCode ? { bankCode: params.vnp_BankCode } : {}),
      ...(params.vnp_PayDate ? { payDate: this.parsePayDate(params.vnp_PayDate) } : {}),
    }, (bookingCode, index) => `${bookingCode}-${index + 1}`);
  }

  async inspectReturn(params: Record<string, string>): Promise<{ valid: boolean; payment: PaymentView | null; responseCode: string }> {
    const valid = this.paymentGateway.verifyCallback(params);
    if (!valid) return { valid: false, payment: null, responseCode: "97" };
    const payment = await this.paymentRepository.findByTxnRef(params.vnp_TxnRef ?? "");
    return { valid: true, payment, responseCode: params.vnp_ResponseCode ?? "" };
  }

  private parsePayDate(value: string): Date | undefined {
    if (!/^\d{14}$/.test(value)) return undefined;
    const y = value.slice(0, 4), m = value.slice(4, 6), d = value.slice(6, 8);
    const h = value.slice(8, 10), min = value.slice(10, 12), s = value.slice(12, 14);
    return new Date(`${y}-${m}-${d}T${h}:${min}:${s}+07:00`);
  }
}
