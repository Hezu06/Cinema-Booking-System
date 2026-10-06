import express from "express";
import { PaymentController } from "../controllers/payment.controller.js";
import { PaymentService } from "../../business/services/payment.service.js";
import { PrismaPaymentRepository } from "../../data-access/repositories/payment.repository.js";
import { VnpayGateway } from "../../data-access/gateways/vnpay.gateway.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const paymentRouter = express.Router();
const controller = new PaymentController(
  new PaymentService(new PrismaPaymentRepository(), new VnpayGateway()),
);

// VNPAY calls these endpoints without JWT; authenticity is verified by HMAC-SHA512.
paymentRouter.get("/vnpay/ipn", controller.vnpayIpn);
paymentRouter.get("/vnpay/return", controller.vnpayReturn);

paymentRouter.post("/vnpay/create", authMiddleware, controller.createVnpayPayment);
paymentRouter.get("/booking/:bookingId", authMiddleware, controller.getBookingPayments);

export default paymentRouter;
