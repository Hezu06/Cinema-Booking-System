import express from "express";
import { container } from "../../config/container.js";
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

seatRouter.use(authMiddleware, requireAdmin);
seatRouter.get("/", validateRequest({ query: seatQuerySchema }), container.seatController.getAllSeats);
seatRouter.get("/:id", validateRequest({ params: seatIdParamSchema }), container.seatController.getSeatById);
seatRouter.post("/", validateRequest({ body: createSeatSchema }), container.seatController.createSeat);
seatRouter.put("/:id", validateRequest({ params: seatIdParamSchema, body: updateSeatSchema }), container.seatController.updateSeat);
seatRouter.delete("/:id", validateRequest({ params: seatIdParamSchema }), container.seatController.deleteSeat);

export default seatRouter;
