import type { Request, Response } from "express";
import type { SeatService } from "../../business/services/seat.service.js";
import { asyncHandler } from "../utils/async-handler.util.js";
import { NotFoundError } from "../../shared/errors/index.js";

export class SeatController {
  constructor(private readonly seatService: SeatService) {}

  getAllSeats = asyncHandler(async (request: Request, response: Response) => {
    const seats = await this.seatService.getAllSeats(request.query as any);
    return response.status(200).json({ success: true, message: "Get all seats", data: seats });
  });

  getSeatById = asyncHandler(async (request: Request<{ id: string }>, response: Response) => {
    const seat = await this.seatService.getSeatById(request.params.id);
    if (!seat) {
      throw new NotFoundError("Seat not found");
    }

    return response.status(200).json({ success: true, message: "Get seat", data: seat });
  });

  createSeat = asyncHandler(async (request: Request, response: Response) => {
    const seat = await this.seatService.createSeat(request.body);
    return response.status(201).json({ success: true, message: "Seat created", data: seat });
  });

  updateSeat = asyncHandler(async (request: Request<{ id: string }>, response: Response) => {
    const seat = await this.seatService.updateSeat(request.params.id, request.body);
    if (!seat) {
      throw new NotFoundError("Seat not found");
    }

    return response.status(200).json({ success: true, message: "Seat updated", data: seat });
  });

  deleteSeat = asyncHandler(async (request: Request<{ id: string }>, response: Response) => {
    const seat = await this.seatService.deleteSeat(request.params.id);
    if (!seat) {
      throw new NotFoundError("Seat not found");
    }

    return response.status(200).json({ success: true, message: "Seat deleted", data: seat });
  });
}
