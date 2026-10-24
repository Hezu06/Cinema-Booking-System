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

import {
  validateRequest,
} from "../middlewares/validate.middleware.js";

import {
  createRoomSchema,
  updateRoomSchema,
  roomIdParamSchema,
} from "../validators/room.validator.js";

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
roomRouter.use(authMiddleware, requireAdmin);

roomRouter.get(
  "/",
  roomController.getAllRooms,
);

roomRouter.get(
  "/:id",
  validateRequest({ params: roomIdParamSchema }),
  roomController.getRoomById,
);

roomRouter.post(
  "/",
  validateRequest({ body: createRoomSchema }),
  roomController.createRoom,
);

roomRouter.put(
  "/:id",
  validateRequest({ params: roomIdParamSchema, body: updateRoomSchema }),
  roomController.updateRoom,
);

roomRouter.delete(
  "/:id",
  validateRequest({ params: roomIdParamSchema }),
  roomController.deleteRoom,
);

export default roomRouter;
