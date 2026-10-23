import type { Request, Response } from "express";
import { RoomService } from "../../business/services/room.service.js";
import {
  createRoomSchema,
  updateRoomSchema,
  roomIdParamSchema,
} from "../validators/room.validator.js";
import { asyncHandler } from "../utils/async-handler.util.js";
import { NotFoundError, ValidationError } from "../../shared/errors/index.js";

export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  getAllRooms = asyncHandler(async (_request: Request, response: Response) => {
    const rooms = await this.roomService.getAllRooms();

    return response.status(200).json({
      success: true,
      message: "Get all rooms",
      data: rooms,
    });
  });

  getRoomById = asyncHandler(async (request: Request<{ id: string }>, response: Response) => {
    const paramResult = roomIdParamSchema.safeParse(request.params);
    if (!paramResult.success) {
      throw new ValidationError("Invalid room ID", paramResult.error.issues);
    }

    const { id } = paramResult.data;
    const room = await this.roomService.getRoomById(id);

    if (!room) {
      throw new NotFoundError("Room not found");
    }

    return response.status(200).json({
      success: true,
      message: "Get room by ID",
      data: room,
    });
  });

  createRoom = asyncHandler(async (request: Request, response: Response) => {
    const bodyResult = createRoomSchema.safeParse(request.body);
    if (!bodyResult.success) {
      throw new ValidationError("Validation failed", bodyResult.error.issues);
    }

    const room = await this.roomService.createRoom(bodyResult.data);

    return response.status(201).json({
      success: true,
      message: "Room created",
      data: room,
    });
  });

  updateRoom = asyncHandler(async (request: Request<{ id: string }>, response: Response) => {
    const paramResult = roomIdParamSchema.safeParse(request.params);
    if (!paramResult.success) {
      throw new ValidationError("Invalid room ID", paramResult.error.issues);
    }

    const bodyResult = updateRoomSchema.safeParse(request.body);
    if (!bodyResult.success) {
      throw new ValidationError("Validation failed", bodyResult.error.issues);
    }

    const { id } = paramResult.data;
    const room = await this.roomService.updateRoom(id, bodyResult.data);

    if (!room) {
      throw new NotFoundError("Room not found");
    }

    return response.status(200).json({
      success: true,
      message: "Room updated",
      data: room,
    });
  });

  deleteRoom = asyncHandler(async (request: Request<{ id: string }>, response: Response) => {
    const paramResult = roomIdParamSchema.safeParse(request.params);
    if (!paramResult.success) {
      throw new ValidationError("Invalid room ID", paramResult.error.issues);
    }

    const { id } = paramResult.data;
    const room = await this.roomService.deleteRoom(id);

    if (!room) {
      throw new NotFoundError("Room not found");
    }

    return response.status(200).json({
      success: true,
      message: "Room deleted",
      data: room,
    });
  });
}
