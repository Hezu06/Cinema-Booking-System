import type { Request, Response } from "express";
import type { SeatService } from "../../business/services/seat.service.js";
import {
  createSeatSchema,
  seatIdParamSchema,
  seatQuerySchema,
  updateSeatSchema,
} from "../validators/seat.validator.js";
import { asyncHandler } from "../utils/async-handler.util.js";
import { NotFoundError, ValidationError } from "../../shared/errors/index.js";

export class SeatController {
  constructor(private readonly seatService: SeatService) {}

  getAllSeats = asyncHandler(async (request: Request, response: Response) => {
    const query = seatQuerySchema.safeParse(request.query);
    if (!query.success) {
      throw new ValidationError("Invalid query", query.error.issues);
    }

    const seats = await this.seatService.getAllSeats(query.data);
    return response.status(200).json({ success: true, message: "Get all seats", data: seats });
  });

  getSeatById = asyncHandler(async (request: Request, response: Response) => {
    const params = seatIdParamSchema.safeParse(request.params);
    if (!params.success) {
      throw new ValidationError("Invalid seat ID", params.error.issues);
    }

    const seat = await this.seatService.getSeatById(params.data.id);
    if (!seat) {
      throw new NotFoundError("Seat not found");
    }

    return response.status(200).json({ success: true, message: "Get seat", data: seat });
  });

  createSeat = asyncHandler(async (request: Request, response: Response) => {
    const body = createSeatSchema.safeParse(request.body);
    if (!body.success) {
      throw new ValidationError("Validation failed", body.error.issues);
    }

    const seat = await this.seatService.createSeat(body.data);
    return response.status(201).json({ success: true, message: "Seat created", data: seat });
  });

  updateSeat = asyncHandler(async (request: Request, response: Response) => {
    const params = seatIdParamSchema.safeParse(request.params);
    const body = updateSeatSchema.safeParse(request.body);
    if (!params.success) {
      throw new ValidationError("Invalid seat ID", params.error.issues);
    }
    if (!body.success) {
      throw new ValidationError("Validation failed", body.error.issues);
    }

    const seat = await this.seatService.updateSeat(params.data.id, body.data);
    if (!seat) {
      throw new NotFoundError("Seat not found");
    }

    return response.status(200).json({ success: true, message: "Seat updated", data: seat });
  });

  deleteSeat = asyncHandler(async (request: Request, response: Response) => {
    const params = seatIdParamSchema.safeParse(request.params);
    if (!params.success) {
      throw new ValidationError("Invalid seat ID", params.error.issues);
    }

    const seat = await this.seatService.deleteSeat(params.data.id);
    if (!seat) {
      throw new NotFoundError("Seat not found");
    }

    return response.status(200).json({ success: true, message: "Seat deleted", data: seat });
  });
}
