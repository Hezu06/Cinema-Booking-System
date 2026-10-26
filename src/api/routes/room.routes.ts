import express from "express";
import { container } from "../../config/container.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { requireAdmin } from "../middlewares/role.middleware.js";
import { validateRequest } from "../middlewares/validate.middleware.js";
import {
  createRoomSchema,
  updateRoomSchema,
  roomIdParamSchema,
} from "../validators/room.validator.js";

const roomRouter = express.Router();

// UC-12: Room management is Admin-only.
roomRouter.use(authMiddleware, requireAdmin);

roomRouter.get("/", container.roomController.getAllRooms);
roomRouter.get(
  "/:id",
  validateRequest({ params: roomIdParamSchema }),
  container.roomController.getRoomById
);
roomRouter.post(
  "/",
  validateRequest({ body: createRoomSchema }),
  container.roomController.createRoom
);
roomRouter.put(
  "/:id",
  validateRequest({ params: roomIdParamSchema, body: updateRoomSchema }),
  container.roomController.updateRoom
);
roomRouter.delete(
  "/:id",
  validateRequest({ params: roomIdParamSchema }),
  container.roomController.deleteRoom
);

export default roomRouter;
