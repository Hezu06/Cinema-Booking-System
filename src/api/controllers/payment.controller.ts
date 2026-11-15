import type { Request, Response } from "express";
import type { PaymentService } from "../../business/services/payment.service.js";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware.js";
import { asyncHandler } from "../utils/async-handler.util.js";

function queryToStrings(query: Request["query"]): Record<string, string> {
  const entries = Object.entries(query)
    .filter(([key, value]) => key.startsWith("vnp_") && typeof value === "string")
    .map(([key, value]) => [key, value as string]);
  return Object.fromEntries(entries);
}

export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  createVnpayPayment = asyncHandler(async (request: Request, response: Response) => {
    const user = (request as AuthenticatedRequest).user;
    // Uses trusted clientIp populated by Gatekeeper middleware (or fallback to clean IPv4)
    const ipAddress =
      (request as any).clientIp ||
      request.ip?.replace(/^::ffff:/, "") ||
      "127.0.0.1";

    const data = await this.paymentService.createVnpayPayment(
      user.userId,
      request.body.bookingId,
      ipAddress,
      request.body.bankCode,
    );
    return response.status(201).json({ success: true, message: "VNPAY payment URL created", data });
  });

  getBookingPayments = asyncHandler(async (request: AuthenticatedRequest<{ bookingId: string }>, response: Response) => {
    const user = request.user;
    const data = await this.paymentService.getBookingPayments(user.userId, user.role, request.params.bookingId);
    return response.status(200).json({ success: true, message: "Get booking payments", data });
  });

  vnpayIpn = asyncHandler(async (request: Request, response: Response) => {
    try {
      const result = await this.paymentService.handleIpn(queryToStrings(request.query));
      return response.status(200).json({ RspCode: result.rspCode, Message: result.message });
    } catch (error) {
      console.error("Error processing VNPAY IPN:", error);
      return response.status(200).json({ RspCode: "99", Message: "Unknown error" });
    }
  });

  vnpayReturn = asyncHandler(async (request: Request, response: Response) => {
    const result = await this.paymentService.inspectReturn(queryToStrings(request.query));
    const defaultClientUrl = process.env.NODE_ENV === "production"
      ? "https://cbs-project8.vercel.app/payment/result"
      : "http://localhost:5173/payment/result";
    const clientRedirectUrl = process.env.CLIENT_PAYMENT_RESULT_URL || defaultClientUrl;

    const redirectUrl = new URL(clientRedirectUrl);
    redirectUrl.searchParams.set("responseCode", result.responseCode);
    redirectUrl.searchParams.set("valid", String(result.valid));
    if (result.payment) {
      redirectUrl.searchParams.set("bookingId", result.payment.bookingId);
      redirectUrl.searchParams.set("txnRef", result.payment.txnRef);
      redirectUrl.searchParams.set("status", result.payment.status);
    }

    return response.redirect(redirectUrl.toString());
  });
}
