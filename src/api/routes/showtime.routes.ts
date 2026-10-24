import express from "express";
import { ShowtimeController } from "../controllers/showtime.controller.js";
import { ShowtimeService } from "../../business/services/showtime.service.js";
import { PrismaShowtimeRepository } from "../../data-access/repositories/showtime.repository.js";
import { PrismaMovieRepository } from "../../data-access/repositories/movie.repository.js";
import { PrismaRoomRepository } from "../../data-access/repositories/room.repository.js";
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
const controller = new ShowtimeController(
  new ShowtimeService(new PrismaShowtimeRepository(), new PrismaMovieRepository(), new PrismaRoomRepository()),
);

showtimeRouter.get("/", validateRequest({ query: showtimeQuerySchema }), controller.getAllShowtimes);
showtimeRouter.get("/:id/seats", validateRequest({ params: showtimeIdParamSchema }), controller.getShowtimeSeats);
showtimeRouter.get("/:id", validateRequest({ params: showtimeIdParamSchema }), controller.getShowtimeById);
showtimeRouter.post("/", authMiddleware, requireAdmin, validateRequest({ body: createShowtimeSchema }), controller.createShowtime);
showtimeRouter.put("/:id", authMiddleware, requireAdmin, validateRequest({ params: showtimeIdParamSchema, body: updateShowtimeSchema }), controller.updateShowtime);
showtimeRouter.delete("/:id", authMiddleware, requireAdmin, validateRequest({ params: showtimeIdParamSchema }), controller.deleteShowtime);

export default showtimeRouter;
