import express from "express";
import { container } from "../../config/container.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { requireAdmin } from "../middlewares/role.middleware.js";
import { validateRequest } from "../middlewares/validate.middleware.js";
import {
  createShowtimeSchema,
  showtimeIdParamSchema,
  showtimeQuerySchema,
  updateShowtimeSchema,
} from "../validators/showtime.validator.js";

const showtimeRouter = express.Router();

showtimeRouter.get("/", validateRequest({ query: showtimeQuerySchema }), container.showtimeController.getAllShowtimes);
showtimeRouter.get("/:id/seats", validateRequest({ params: showtimeIdParamSchema }), container.showtimeController.getShowtimeSeats);
showtimeRouter.get("/:id", validateRequest({ params: showtimeIdParamSchema }), container.showtimeController.getShowtimeById);
showtimeRouter.post("/", authMiddleware, requireAdmin, validateRequest({ body: createShowtimeSchema }), container.showtimeController.createShowtime);
showtimeRouter.put("/:id", authMiddleware, requireAdmin, validateRequest({ params: showtimeIdParamSchema, body: updateShowtimeSchema }), container.showtimeController.updateShowtime);
showtimeRouter.delete("/:id", authMiddleware, requireAdmin, validateRequest({ params: showtimeIdParamSchema }), container.showtimeController.deleteShowtime);

export default showtimeRouter;
