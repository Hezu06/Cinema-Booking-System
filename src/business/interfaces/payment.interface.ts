import type { PaymentView } from "../models/payment.model.js";

export interface PaymentBookingContext {
  id: string;
  userId: string;
  bookingCode: string;
  totalAmount: number;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "EXPIRED";
  expiresAt: Date | null;
}

export interface CreatePaymentData {
  bookingId: string;
  txnRef: string;
  amount: number;
}

export interface PaymentGatewayRequest {
  txnRef: string;
  amount: number;
  orderInfo: string;
  ipAddress: string;
  expireAt: Date;
  locale?: "vn" | "en" | undefined;
  bankCode?: string | undefined;
}

export interface PaymentGateway {
  isConfigured(): boolean;
  createPaymentUrl(data: PaymentGatewayRequest): string;
  verifyCallback(params: Record<string, string>): boolean;
}

export interface ProcessPaymentCallbackData {
  txnRef: string;
  amount: number;
  responseCode: string;
  transactionStatus: string;
  transactionNo?: string | undefined;
  bankCode?: string | undefined;
  payDate?: Date | undefined;
}

export interface PaymentCallbackResult {
  rspCode: "00" | "01" | "02" | "04" | "97";
  message: string;
  payment?: PaymentView | undefined;
}

export interface PaymentRepository {
  findBookingContext(bookingId: string): Promise<PaymentBookingContext | null>;
  create(data: CreatePaymentData): Promise<PaymentView>;
  findByTxnRef(txnRef: string): Promise<PaymentView | null>;
  findByBookingId(bookingId: string): Promise<PaymentView[]>;
  processCallback(
    data: ProcessPaymentCallbackData,
    ticketCodeGenerator: (bookingCode: string, index: number) => string,
  ): Promise<PaymentCallbackResult>;
}
