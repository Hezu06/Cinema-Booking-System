import express from "express";

import {
  RoomController,
} from "../controllers/room.controller.js";

import {
  RoomService,
} from "../../business/services/room.service.js";

import {
  PrismaRoomRepository,
} from "../../data-access/repositories/room.repository.js";

import {
  PrismaCinemaRepository,
} from "../../data-access/repositories/cinema.repository.js";

import {
  authMiddleware,
} from "../middlewares/auth.middleware.js";

import {
  requireAdmin,
} from "../middlewares/role.middleware.js";

const roomRouter = express.Router();

const roomRepository =
  new PrismaRoomRepository();

const cinemaRepository =
  new PrismaCinemaRepository();

const roomService = new RoomService(
  roomRepository,
  cinemaRepository,
);

const roomController =
  new RoomController(roomService);

// UC-12: Room management is Admin-only.
roomRouter.get(
  "/",
  authMiddleware,
  requireAdmin,
  roomController.getAllRooms,
);

roomRouter.get(
  "/:id",
  authMiddleware,
  requireAdmin,
  roomController.getRoomById,
);

roomRouter.post(
  "/",
  authMiddleware,
  requireAdmin,
  roomController.createRoom,
);

roomRouter.put(
  "/:id",
  authMiddleware,
  requireAdmin,
  roomController.updateRoom,
);

roomRouter.delete(
  "/:id",
  authMiddleware,
  requireAdmin,
  roomController.deleteRoom,
);

export default roomRouter;