import type { Request, Response } from "express";
import type { ShowtimeService } from "../../business/services/showtime.service.js";
import {
  createShowtimeSchema,
  showtimeIdParamSchema,
  showtimeQuerySchema,
  updateShowtimeSchema,
} from "../validators/showtime.validator.js";
import { asyncHandler } from "../utils/async-handler.util.js";
import { NotFoundError, ValidationError } from "../../shared/errors/index.js";

export class ShowtimeController {
  constructor(private readonly showtimeService: ShowtimeService) {}

  getAllShowtimes = asyncHandler(async (request: Request, response: Response) => {
    const query = showtimeQuerySchema.safeParse(request.query);
    if (!query.success) {
      throw new ValidationError("Invalid query", query.error.issues);
    }

    const data = await this.showtimeService.getAllShowtimes(query.data);
    return response.status(200).json({
      success: true,
      message: "Get all showtimes",
      data,
    });
  });

  getShowtimeById = asyncHandler(async (request: Request, response: Response) => {
    const params = showtimeIdParamSchema.safeParse(request.params);
    if (!params.success) {
      throw new ValidationError("Invalid showtime ID", params.error.issues);
    }

    const data = await this.showtimeService.getShowtimeById(params.data.id);
    if (!data) {
      throw new NotFoundError("Showtime not found");
    }

    return response.status(200).json({
      success: true,
      message: "Get showtime",
      data,
    });
  });

  getShowtimeSeats = asyncHandler(async (request: Request, response: Response) => {
    const params = showtimeIdParamSchema.safeParse(request.params);
    if (!params.success) {
      throw new ValidationError("Invalid showtime ID", params.error.issues);
    }

    const data = await this.showtimeService.getShowtimeSeats(params.data.id);
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
    const body = createShowtimeSchema.safeParse(request.body);
    if (!body.success) {
      throw new ValidationError("Validation failed", body.error.issues);
    }

    const data = await this.showtimeService.createShowtime(body.data);
    return response.status(201).json({
      success: true,
      message: "Showtime created",
      data,
    });
  });

  updateShowtime = asyncHandler(async (request: Request, response: Response) => {
    const params = showtimeIdParamSchema.safeParse(request.params);
    const body = updateShowtimeSchema.safeParse(request.body);
    if (!params.success) {
      throw new ValidationError("Invalid showtime ID", params.error.issues);
    }
    if (!body.success) {
      throw new ValidationError("Validation failed", body.error.issues);
    }

    const data = await this.showtimeService.updateShowtime(params.data.id, body.data);
    if (!data) {
      throw new NotFoundError("Showtime not found");
    }

    return response.status(200).json({
      success: true,
      message: "Showtime updated",
      data,
    });
  });

  deleteShowtime = asyncHandler(async (request: Request, response: Response) => {
    const params = showtimeIdParamSchema.safeParse(request.params);
    if (!params.success) {
      throw new ValidationError("Invalid showtime ID", params.error.issues);
    }

    const data = await this.showtimeService.deleteShowtime(params.data.id);
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
