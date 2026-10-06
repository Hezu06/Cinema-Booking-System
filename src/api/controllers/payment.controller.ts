import type { Request, Response } from "express";
import type { PaymentService } from "../../business/services/payment.service.js";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware.js";
import {
  createVnpayPaymentSchema,
  paymentBookingParamSchema,
} from "../validators/payment.validator.js";

function queryToStrings(query: Request["query"]): Record<string, string> {
  const entries = Object.entries(query)
    .filter(([key, value]) => key.startsWith("vnp_") && typeof value === "string")
    .map(([key, value]) => [key, value as string]);
  return Object.fromEntries(entries);
}

function handlePaymentError(error: unknown, response: Response): boolean {
  if (!(error instanceof Error)) return false;
  const errors: Record<string, [number, string]> = {
    VNPAY_NOT_CONFIGURED: [503, "VNPAY Sandbox chưa được cấu hình"],
    BOOKING_NOT_FOUND: [404, "Booking không tồn tại"],
    FORBIDDEN: [403, "Bạn không có quyền thao tác với booking này"],
    BOOKING_NOT_PENDING: [409, "Booking không ở trạng thái chờ thanh toán"],
    BOOKING_EXPIRED: [409, "Booking đã hết hạn thanh toán"],
  };
  const match = errors[error.message];
  if (!match) return false;
  response.status(match[0]).json({ success: false, message: match[1] });
  return true;
}

export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  createVnpayPayment = async (request: Request, response: Response) => {
    const body = createVnpayPaymentSchema.safeParse(request.body);
    if (!body.success) return response.status(400).json({ success: false, message: "Validation failed", errors: body.error.issues });
    const user = (request as AuthenticatedRequest).user;
    const forwarded = request.header("x-forwarded-for")?.split(",")[0]?.trim();
    const ipAddress = forwarded || request.ip || request.socket.remoteAddress || "127.0.0.1";

    try {
      const data = await this.paymentService.createVnpayPayment(
        user.userId,
        body.data.bookingId,
        ipAddress.replace(/^::ffff:/, ""),
        body.data.bankCode,
      );
      return response.status(201).json({ success: true, message: "VNPAY payment URL created", data });
    } catch (error) {
      if (handlePaymentError(error, response)) return;
      console.error("Error creating VNPAY payment:", error);
      return response.status(500).json({ success: false, message: "Internal server error" });
    }
  };

  getBookingPayments = async (request: Request, response: Response) => {
    const params = paymentBookingParamSchema.safeParse(request.params);
    if (!params.success) return response.status(400).json({ success: false, message: "Invalid booking ID", errors: params.error.issues });
    const user = (request as AuthenticatedRequest).user;
    try {
      const data = await this.paymentService.getBookingPayments(user.userId, user.role, params.data.bookingId);
      return response.status(200).json({ success: true, message: "Get booking payments", data });
    } catch (error) {
      if (handlePaymentError(error, response)) return;
      console.error("Error fetching payments:", error);
      return response.status(500).json({ success: false, message: "Internal server error" });
    }
  };

  vnpayIpn = async (request: Request, response: Response) => {
    try {
      const result = await this.paymentService.handleIpn(queryToStrings(request.query));
      return response.status(200).json({ RspCode: result.rspCode, Message: result.message });
    } catch (error) {
      console.error("Error processing VNPAY IPN:", error);
      return response.status(200).json({ RspCode: "99", Message: "Unknown error" });
    }
  };

  vnpayReturn = async (request: Request, response: Response) => {
    try {
      const result = await this.paymentService.inspectReturn(queryToStrings(request.query));
      const resultUrl = process.env.CLIENT_PAYMENT_RESULT_URL;
      if (resultUrl) {
        const url = new URL(resultUrl);
        url.searchParams.set("valid", String(result.valid));
        url.searchParams.set("responseCode", result.responseCode);
        if (result.payment) {
          url.searchParams.set("bookingId", result.payment.bookingId);
          url.searchParams.set("txnRef", result.payment.txnRef);
        }
        return response.redirect(url.toString());
      }
      return response.status(result.valid ? 200 : 400).json({
        success: result.valid,
        message: result.valid ? "Valid VNPAY return" : "Invalid VNPAY signature",
        data: result,
      });
    } catch (error) {
      console.error("Error processing VNPAY return:", error);
      return response.status(500).json({ success: false, message: "Internal server error" });
    }
  };
}
