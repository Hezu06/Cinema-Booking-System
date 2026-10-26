import express from "express";
import { container } from "../../config/container.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { validateRequest } from "../middlewares/validate.middleware.js";
import {
  createVnpayPaymentSchema,
  paymentBookingParamSchema,
} from "../validators/payment.validator.js";

const paymentRouter = express.Router();

// VNPAY calls these endpoints without JWT; authenticity is verified by HMAC-SHA512.
paymentRouter.get("/vnpay/ipn", container.paymentController.vnpayIpn);
paymentRouter.get("/vnpay/return", container.paymentController.vnpayReturn);

paymentRouter.post(
  "/vnpay/create",
  authMiddleware,
  validateRequest({ body: createVnpayPaymentSchema }),
  container.paymentController.createVnpayPayment,
);
paymentRouter.get(
  "/booking/:bookingId",
  authMiddleware,
  validateRequest({ params: paymentBookingParamSchema }),
  container.paymentController.getBookingPayments,
);

export default paymentRouter;
