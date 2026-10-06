export const PaymentStatus = {
  PENDING: "PENDING",
  SUCCESS: "SUCCESS",
  FAILED: "FAILED",
  EXPIRED: "EXPIRED",
  REFUND_PENDING: "REFUND_PENDING",
  REFUNDED: "REFUNDED",
} as const;

export type PaymentStatus = typeof PaymentStatus[keyof typeof PaymentStatus];

export const RefundStatus = {
  PENDING: "PENDING",
  SUCCESS: "SUCCESS",
  FAILED: "FAILED",
} as const;

export type RefundStatus = typeof RefundStatus[keyof typeof RefundStatus];

export interface RefundView {
  id: string;
  paymentId: string;
  refundCode: string;
  amount: number;
  reason: string | null;
  status: RefundStatus;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentView {
  id: string;
  bookingId: string;
  txnRef: string;
  amount: number;
  method: "VNPAY";
  status: PaymentStatus;
  transactionNo: string | null;
  bankCode: string | null;
  responseCode: string | null;
  transactionStatus: string | null;
  payDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  refund?: RefundView | null;
}
