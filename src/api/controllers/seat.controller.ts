import type { Request, Response } from "express";
import type { SeatService } from "../../business/services/seat.service.js";
import {
  createSeatSchema,
  seatIdParamSchema,
  seatQuerySchema,
  updateSeatSchema,
} from "../validators/seat.validator.js";

function prismaCode(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error ? error.code : undefined;
}

export class SeatController {
  constructor(private readonly seatService: SeatService) {}

  getAllSeats = async (request: Request, response: Response) => {
    const query = seatQuerySchema.safeParse(request.query);
    if (!query.success) return response.status(400).json({ success: false, message: "Invalid query", errors: query.error.issues });

    try {
      const seats = await this.seatService.getAllSeats(query.data);
      return response.status(200).json({ success: true, message: "Get all seats", data: seats });
    } catch (error) {
      console.error("Error fetching seats:", error);
      return response.status(500).json({ success: false, message: "Internal server error" });
    }
  };

  getSeatById = async (request: Request, response: Response) => {
    const params = seatIdParamSchema.safeParse(request.params);
    if (!params.success) return response.status(400).json({ success: false, message: "Invalid seat ID", errors: params.error.issues });

    try {
      const seat = await this.seatService.getSeatById(params.data.id);
      if (!seat) return response.status(404).json({ success: false, message: "Seat not found" });
      return response.status(200).json({ success: true, message: "Get seat", data: seat });
    } catch (error) {
      console.error("Error fetching seat:", error);
      return response.status(500).json({ success: false, message: "Internal server error" });
    }
  };

  createSeat = async (request: Request, response: Response) => {
    const body = createSeatSchema.safeParse(request.body);
    if (!body.success) return response.status(400).json({ success: false, message: "Validation failed", errors: body.error.issues });

    try {
      const seat = await this.seatService.createSeat(body.data);
      return response.status(201).json({ success: true, message: "Seat created", data: seat });
    } catch (error) {
      if (error instanceof Error && error.message === "ROOM_NOT_FOUND") return response.status(404).json({ success: false, message: "Room not found" });
      if (error instanceof Error && error.message === "ROOM_CAPACITY_EXCEEDED") return response.status(409).json({ success: false, message: "Room capacity has been reached" });
      if ((error instanceof Error && error.message === "SEAT_POSITION_EXISTS") || prismaCode(error) === "P2002") return response.status(409).json({ success: false, message: "Seat position already exists in this room" });
      console.error("Error creating seat:", error);
      return response.status(500).json({ success: false, message: "Internal server error" });
    }
  };

  updateSeat = async (request: Request, response: Response) => {
    const params = seatIdParamSchema.safeParse(request.params);
    const body = updateSeatSchema.safeParse(request.body);
    if (!params.success) return response.status(400).json({ success: false, message: "Invalid seat ID", errors: params.error.issues });
    if (!body.success) return response.status(400).json({ success: false, message: "Validation failed", errors: body.error.issues });

    try {
      const seat = await this.seatService.updateSeat(params.data.id, body.data);
      if (!seat) return response.status(404).json({ success: false, message: "Seat not found" });
      return response.status(200).json({ success: true, message: "Seat updated", data: seat });
    } catch (error) {
      if (error instanceof Error && error.message === "ROOM_NOT_FOUND") return response.status(404).json({ success: false, message: "Room not found" });
      if (error instanceof Error && error.message === "ROOM_CAPACITY_EXCEEDED") return response.status(409).json({ success: false, message: "Room capacity has been reached" });
      if ((error instanceof Error && error.message === "SEAT_POSITION_EXISTS") || prismaCode(error) === "P2002") return response.status(409).json({ success: false, message: "Seat position already exists in this room" });
      console.error("Error updating seat:", error);
      return response.status(500).json({ success: false, message: "Internal server error" });
    }
  };

  deleteSeat = async (request: Request, response: Response) => {
    const params = seatIdParamSchema.safeParse(request.params);
    if (!params.success) return response.status(400).json({ success: false, message: "Invalid seat ID", errors: params.error.issues });

    try {
      const seat = await this.seatService.deleteSeat(params.data.id);
      if (!seat) return response.status(404).json({ success: false, message: "Seat not found" });
      return response.status(200).json({ success: true, message: "Seat deleted", data: seat });
    } catch (error) {
      if (prismaCode(error) === "P2003") return response.status(409).json({ success: false, message: "Seat is referenced by one or more showtimes" });
      console.error("Error deleting seat:", error);
      return response.status(500).json({ success: false, message: "Internal server error" });
    }
  };
}
