import type { Request, Response } from "express";
import type { ShowtimeService } from "../../business/services/showtime.service.js";
import { asyncHandler } from "../utils/async-handler.util.js";
import { NotFoundError } from "../../shared/errors/index.js";

export class ShowtimeController {
  constructor(private readonly showtimeService: ShowtimeService) {}

  getAllShowtimes = asyncHandler(async (request: Request, response: Response) => {
    const data = await this.showtimeService.getAllShowtimes(request.query as any);
    return response.status(200).json({
      success: true,
      message: "Get all showtimes",
      data,
    });
  });

  getShowtimeById = asyncHandler(async (request: Request<{ id: string }>, response: Response) => {
    const data = await this.showtimeService.getShowtimeById(request.params.id);
    if (!data) {
      throw new NotFoundError("Showtime not found");
    }

    return response.status(200).json({
      success: true,
      message: "Get showtime",
      data,
    });
  });

  getShowtimeSeats = asyncHandler(async (request: Request<{ id: string }>, response: Response) => {
    const data = await this.showtimeService.getShowtimeSeats(request.params.id);
    if (!data) {
      throw new NotFoundError("Showtime not found");
    }

    return response.status(200).json({
      success: true,
      message: "Get seats for showtime",
      data,
    });
  });

  createShowtime = asyncHandler(async (request: Request, response: Response) => {
    const data = await this.showtimeService.createShowtime(request.body);
    return response.status(201).json({
      success: true,
      message: "Showtime created",
      data,
    });
  });

  updateShowtime = asyncHandler(async (request: Request<{ id: string }>, response: Response) => {
    const data = await this.showtimeService.updateShowtime(request.params.id, request.body);
    if (!data) {
      throw new NotFoundError("Showtime not found");
    }

    return response.status(200).json({
      success: true,
      message: "Showtime updated",
      data,
    });
  });

  deleteShowtime = asyncHandler(async (request: Request<{ id: string }>, response: Response) => {
    const data = await this.showtimeService.deleteShowtime(request.params.id);
    if (!data) {
      throw new NotFoundError("Showtime not found");
    }

    return response.status(200).json({
      success: true,
      message: "Showtime deleted",
      data,
    });
  });
}
