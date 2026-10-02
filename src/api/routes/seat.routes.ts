import express from "express";
import { SeatController } from "../controllers/seat.controller.js";
import { SeatService } from "../../business/services/seat.service.js";
import { PrismaSeatRepository } from "../../data-access/repositories/seat.repository.js";
import { PrismaRoomRepository } from "../../data-access/repositories/room.repository.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { requireAdmin } from "../middlewares/role.middleware.js";

const seatRouter = express.Router();
const controller = new SeatController(new SeatService(new PrismaSeatRepository(), new PrismaRoomRepository()));

seatRouter.use(authMiddleware, requireAdmin);
seatRouter.get("/", controller.getAllSeats);
seatRouter.get("/:id", controller.getSeatById);
seatRouter.post("/", controller.createSeat);
seatRouter.put("/:id", controller.updateSeat);
seatRouter.delete("/:id", controller.deleteSeat);

export default seatRouter;
