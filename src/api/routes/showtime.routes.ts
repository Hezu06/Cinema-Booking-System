import express from "express";
import { ShowtimeController } from "../controllers/showtime.controller.js";
import { ShowtimeService } from "../../business/services/showtime.service.js";
import { PrismaShowtimeRepository } from "../../data-access/repositories/showtime.repository.js";
import { PrismaMovieRepository } from "../../data-access/repositories/movie.repository.js";
import { PrismaRoomRepository } from "../../data-access/repositories/room.repository.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { requireAdmin } from "../middlewares/role.middleware.js";

const showtimeRouter = express.Router();
const controller = new ShowtimeController(
  new ShowtimeService(new PrismaShowtimeRepository(), new PrismaMovieRepository(), new PrismaRoomRepository()),
);

showtimeRouter.get("/", controller.getAllShowtimes);
showtimeRouter.get("/:id/seats", controller.getShowtimeSeats);
showtimeRouter.get("/:id", controller.getShowtimeById);
showtimeRouter.post("/", authMiddleware, requireAdmin, controller.createShowtime);
showtimeRouter.put("/:id", authMiddleware, requireAdmin, controller.updateShowtime);
showtimeRouter.delete("/:id", authMiddleware, requireAdmin, controller.deleteShowtime);

export default showtimeRouter;
