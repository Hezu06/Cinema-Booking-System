import { createHmac, timingSafeEqual } from "node:crypto";
import type {
  PaymentGateway,
  PaymentGatewayRequest,
} from "../../business/interfaces/payment.interface.js";

interface VnpayConfig {
  tmnCode?: string | undefined;
  hashSecret?: string | undefined;
  paymentUrl?: string | undefined;
  returnUrl?: string | undefined;
}

function encode(value: string): string {
  return encodeURIComponent(value).replace(/%20/g, "+");
}

function canonicalQuery(params: Record<string, string>): string {
  return Object.keys(params)
    .sort()
    .map((key) => `${encode(key)}=${encode(params[key] ?? "")}`)
    .join("&");
}

function formatVnpayDate(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return `${get("year")}${get("month")}${get("day")}${get("hour")}${get("minute")}${get("second")}`;
}

export function parseVnpayDate(value?: string): Date | undefined {
  if (!value || !/^\d{14}$/.test(value)) return undefined;
  const year = value.slice(0, 4);
  const month = value.slice(4, 6);
  const day = value.slice(6, 8);
  const hour = value.slice(8, 10);
  const minute = value.slice(10, 12);
  const second = value.slice(12, 14);
  return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}+07:00`);
}

export class VnpayGateway implements PaymentGateway {
  private readonly tmnCode: string;
  private readonly hashSecret: string;
  private readonly paymentUrl: string;
  private readonly returnUrl: string;

  constructor(config: VnpayConfig = {}) {
    this.tmnCode = config.tmnCode ?? process.env.VNPAY_TMN_CODE ?? "";
    this.hashSecret = config.hashSecret ?? process.env.VNPAY_HASH_SECRET ?? "";
    this.paymentUrl = config.paymentUrl ?? process.env.VNPAY_PAYMENT_URL ?? "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
    this.returnUrl = config.returnUrl ?? process.env.VNPAY_RETURN_URL ?? "";
  }

  isConfigured(): boolean {
    return Boolean(this.tmnCode && this.hashSecret && this.returnUrl);
  }

  createPaymentUrl(data: PaymentGatewayRequest): string {
    if (!this.isConfigured()) throw new Error("VNPAY_NOT_CONFIGURED");

    const params: Record<string, string> = {
      vnp_Version: "2.1.0",
      vnp_Command: "pay",
      vnp_TmnCode: this.tmnCode,
      vnp_Amount: String(Math.round(data.amount * 100)),
      vnp_CurrCode: "VND",
      vnp_TxnRef: data.txnRef,
      vnp_OrderInfo: data.orderInfo,
      vnp_OrderType: "other",
      vnp_Locale: data.locale ?? "vn",
      vnp_ReturnUrl: this.returnUrl,
      vnp_IpAddr: data.ipAddress,
      vnp_CreateDate: formatVnpayDate(new Date()),
      vnp_ExpireDate: formatVnpayDate(data.expireAt),
    };
    if (data.bankCode) params.vnp_BankCode = data.bankCode;

    const query = canonicalQuery(params);
    const secureHash = createHmac("sha512", this.hashSecret).update(query, "utf8").digest("hex");
    return `${this.paymentUrl}?${query}&vnp_SecureHash=${secureHash}`;
  }

  verifyCallback(params: Record<string, string>): boolean {
    if (!this.hashSecret) return false;
    const receivedHash = params.vnp_SecureHash;
    if (!receivedHash) return false;

    const signedParams = Object.fromEntries(
      Object.entries(params).filter(([key]) => key !== "vnp_SecureHash" && key !== "vnp_SecureHashType"),
    );
    const expectedHash = createHmac("sha512", this.hashSecret)
      .update(canonicalQuery(signedParams), "utf8")
      .digest("hex");

    const received = Buffer.from(receivedHash.toLowerCase(), "utf8");
    const expected = Buffer.from(expectedHash.toLowerCase(), "utf8");
    return received.length === expected.length && timingSafeEqual(received, expected);
  }
}
