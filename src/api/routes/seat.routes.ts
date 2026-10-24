import express from "express";
import { SeatController } from "../controllers/seat.controller.js";
import { SeatService } from "../../business/services/seat.service.js";
import { PrismaSeatRepository } from "../../data-access/repositories/seat.repository.js";
import { PrismaRoomRepository } from "../../data-access/repositories/room.repository.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { requireAdmin } from "../middlewares/role.middleware.js";
import { validateRequest } from "../middlewares/validate.middleware.js";
import {
  createSeatSchema,
  seatIdParamSchema,
  seatQuerySchema,
  updateSeatSchema,
} from "../validators/seat.validator.js";

const seatRouter = express.Router();
const controller = new SeatController(new SeatService(new PrismaSeatRepository(), new PrismaRoomRepository()));

seatRouter.use(authMiddleware, requireAdmin);
seatRouter.get("/", validateRequest({ query: seatQuerySchema }), controller.getAllSeats);
seatRouter.get("/:id", validateRequest({ params: seatIdParamSchema }), controller.getSeatById);
seatRouter.post("/", validateRequest({ body: createSeatSchema }), controller.createSeat);
seatRouter.put("/:id", validateRequest({ params: seatIdParamSchema, body: updateSeatSchema }), controller.updateSeat);
seatRouter.delete("/:id", validateRequest({ params: seatIdParamSchema }), controller.deleteSeat);

export default seatRouter;
