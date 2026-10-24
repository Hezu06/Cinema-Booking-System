import type { Request, Response } from "express";
import { RoomService } from "../../business/services/room.service.js";
import type {
  CreateRoomInput,
  UpdateRoomInput,
} from "../validators/room.validator.js";
import { asyncHandler } from "../utils/async-handler.util.js";
import { NotFoundError } from "../../shared/errors/index.js";

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
    const { id } = request.params;
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
    const room = await this.roomService.createRoom(request.body as CreateRoomInput);

    return response.status(201).json({
      success: true,
      message: "Room created",
      data: room,
    });
  });

  updateRoom = asyncHandler(async (request: Request<{ id: string }>, response: Response) => {
    const { id } = request.params;
    const room = await this.roomService.updateRoom(id, request.body as UpdateRoomInput);

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
    const { id } = request.params;
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
