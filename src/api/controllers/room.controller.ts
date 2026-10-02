import type { Request, Response } from "express";

import {
  RoomService,
} from "../../business/services/room.service.js";

import {
  createRoomSchema,
  updateRoomSchema,
  roomIdParamSchema,
} from "../validators/room.validator.js";

export class RoomController {
  constructor(
    private readonly roomService: RoomService,
  ) {}

  getAllRooms = async (
    _request: Request,
    response: Response,
  ) => {
    try {
      const rooms =
        await this.roomService.getAllRooms();

      return response.status(200).json({
        success: true,
        message: "Get all rooms",
        data: rooms,
      });
    } catch (error) {
      console.error("Error fetching all rooms:", error);

      return response.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  };

  getRoomById = async (
    request: Request<{ id: string }>,
    response: Response,
  ) => {
    try {
      const paramResult =
        roomIdParamSchema.safeParse(request.params);

      if (!paramResult.success) {
        return response.status(400).json({
          success: false,
          message: "Invalid room ID",
          errors: paramResult.error.issues,
        });
      }

      const { id } = paramResult.data;

      const room =
        await this.roomService.getRoomById(id);

      if (!room) {
        return response.status(404).json({
          success: false,
          message: "Room not found",
        });
      }

      return response.status(200).json({
        success: true,
        message: `Get room ${id}`,
        data: room,
      });
    } catch (error) {
      console.error("Error fetching room by ID:", error);

      return response.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  };

  createRoom = async (
    request: Request,
    response: Response,
  ) => {
    try {
      const bodyResult =
        createRoomSchema.safeParse(request.body);

      if (!bodyResult.success) {
        return response.status(400).json({
          success: false,
          message: "Validation failed",
          errors: bodyResult.error.issues,
        });
      }

      const room =
        await this.roomService.createRoom(bodyResult.data);

      return response.status(201).json({
        success: true,
        message: "Room created",
        data: room,
      });
    } catch (error) {
      if (
        error instanceof Error &&
        error.message ===
          "Rạp chiếu (cinemaId) không tồn tại trong hệ thống"
      ) {
        return response.status(404).json({
          success: false,
          message: error.message,
        });
      }

      if (
        error instanceof Error &&
        error.message.includes(
          "đã tồn tại trong rạp",
        )
      ) {
        return response.status(409).json({
          success: false,
          message: error.message,
        });
      }

      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error
      ) {
        if (error.code === "P2002") {
          return response.status(409).json({
            success: false,
            message:
              "Phòng với tên này đã tồn tại trong rạp chiếu",
          });
        }

        // Cinema may be deleted after the service checks it.
        if (error.code === "P2003") {
          return response.status(404).json({
            success: false,
            message:
              "Rạp chiếu (cinemaId) không tồn tại trong hệ thống",
          });
        }
      }

      console.error("Error creating room:", error);

      return response.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  };

  updateRoom = async (
    request: Request<{ id: string }>,
    response: Response,
  ) => {
    try {
      const paramResult =
        roomIdParamSchema.safeParse(request.params);

      if (!paramResult.success) {
        return response.status(400).json({
          success: false,
          message: "Invalid room ID",
          errors: paramResult.error.issues,
        });
      }

      const bodyResult =
        updateRoomSchema.safeParse(request.body);

      if (!bodyResult.success) {
        return response.status(400).json({
          success: false,
          message: "Validation failed",
          errors: bodyResult.error.issues,
        });
      }

      const { id } = paramResult.data;

      const room = await this.roomService.updateRoom(
        id,
        bodyResult.data,
      );

      if (!room) {
        return response.status(404).json({
          success: false,
          message: "Room not found",
        });
      }

      return response.status(200).json({
        success: true,
        message: "Room updated",
        data: room,
      });
    } catch (error) {
      if (
        error instanceof Error &&
        error.message ===
          "Rạp chiếu (cinemaId) không tồn tại trong hệ thống"
      ) {
        return response.status(404).json({
          success: false,
          message: error.message,
        });
      }

      if (
        error instanceof Error &&
        error.message.includes(
          "đã tồn tại trong rạp",
        )
      ) {
        return response.status(409).json({
          success: false,
          message: error.message,
        });
      }

      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error
      ) {
        if (error.code === "P2002") {
          return response.status(409).json({
            success: false,
            message:
              "Phòng với tên này đã tồn tại trong rạp chiếu",
          });
        }

        if (error.code === "P2003") {
          return response.status(404).json({
            success: false,
            message:
              "Rạp chiếu (cinemaId) không tồn tại trong hệ thống",
          });
        }
      }

      console.error("Error updating room:", error);

      return response.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  };

  deleteRoom = async (
    request: Request<{ id: string }>,
    response: Response,
  ) => {
    try {
      const paramResult =
        roomIdParamSchema.safeParse(request.params);

      if (!paramResult.success) {
        return response.status(400).json({
          success: false,
          message: "Invalid room ID",
          errors: paramResult.error.issues,
        });
      }

      const { id } = paramResult.data;

      const deletedRoom =
        await this.roomService.deleteRoom(id);

      if (!deletedRoom) {
        return response.status(404).json({
          success: false,
          message: "Room not found",
        });
      }

      return response.status(200).json({
        success: true,
        message: "Room deleted successfully",
        data: deletedRoom,
      });
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "P2003"
      ) {
        return response.status(409).json({
          success: false,
          message:
            "Không thể xóa phòng chiếu vì đang được dữ liệu liên quan tham chiếu",
        });
      }

      console.error("Error deleting room:", error);

      return response.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  };
}