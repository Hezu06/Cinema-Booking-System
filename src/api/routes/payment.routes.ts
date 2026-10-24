import express from "express";
import { PaymentController } from "../controllers/payment.controller.js";
import { PaymentService } from "../../business/services/payment.service.js";
import { PrismaPaymentRepository } from "../../data-access/repositories/payment.repository.js";
import { VnpayGateway } from "../../data-access/gateways/vnpay.gateway.js";
import { bookingRepository } from "../../data-access/repositories/booking.repository.js";
import { emailService } from "../../data-access/gateways/email.gateway.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { validateRequest } from "../middlewares/validate.middleware.js";
import {
  createVnpayPaymentSchema,
  paymentBookingParamSchema,
} from "../validators/payment.validator.js";

const paymentRouter = express.Router();
const controller = new PaymentController(
  new PaymentService(
    new PrismaPaymentRepository(),
    new VnpayGateway(),
    bookingRepository,
    emailService,
  ),
);

// VNPAY calls these endpoints without JWT; authenticity is verified by HMAC-SHA512.
paymentRouter.get("/vnpay/ipn", controller.vnpayIpn);
paymentRouter.get("/vnpay/return", controller.vnpayReturn);

paymentRouter.post(
  "/vnpay/create",
  authMiddleware,
  validateRequest({ body: createVnpayPaymentSchema }),
  controller.createVnpayPayment,
);
paymentRouter.get(
  "/booking/:bookingId",
  authMiddleware,
  validateRequest({ params: paymentBookingParamSchema }),
  controller.getBookingPayments,
);

export default paymentRouter;
