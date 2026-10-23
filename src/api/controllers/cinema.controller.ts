import type { Request, Response } from "express";
import { CinemaService } from "../../business/services/cinema.service.js";
import {
  createCinemaSchema,
  updateCinemaSchema,
  cinemaIdParamSchema,
} from "../validators/cinema.validator.js";
import { asyncHandler } from "../utils/async-handler.util.js";
import { NotFoundError, ValidationError } from "../../shared/errors/index.js";

export class CinemaController {
  constructor(private readonly cinemaService: CinemaService) {}

  getAllCinemas = asyncHandler(async (_request: Request, response: Response) => {
    const cinemas = await this.cinemaService.getAllCinemas();

    return response.status(200).json({
      success: true,
      message: "Get all cinemas",
      data: cinemas,
    });
  });

  getCinemaById = asyncHandler(async (request: Request<{ id: string }>, response: Response) => {
    const paramResult = cinemaIdParamSchema.safeParse(request.params);
    if (!paramResult.success) {
      throw new ValidationError("Invalid cinema ID", paramResult.error.issues);
    }

    const { id } = paramResult.data;
    const cinema = await this.cinemaService.getCinemaById(id);

    if (!cinema) {
      throw new NotFoundError("Cinema not found");
    }

    return response.status(200).json({
      success: true,
      message: "Get cinema by ID",
      data: cinema,
    });
  });

  createCinema = asyncHandler(async (request: Request, response: Response) => {
    const bodyResult = createCinemaSchema.safeParse(request.body);
    if (!bodyResult.success) {
      throw new ValidationError("Validation failed", bodyResult.error.issues);
    }

    const cinema = await this.cinemaService.createCinema(bodyResult.data);

    return response.status(201).json({
      success: true,
      message: "Cinema created",
      data: cinema,
    });
  });

  updateCinema = asyncHandler(async (request: Request<{ id: string }>, response: Response) => {
    const paramResult = cinemaIdParamSchema.safeParse(request.params);
    if (!paramResult.success) {
      throw new ValidationError("Invalid cinema ID", paramResult.error.issues);
    }

    const bodyResult = updateCinemaSchema.safeParse(request.body);
    if (!bodyResult.success) {
      throw new ValidationError("Validation failed", bodyResult.error.issues);
    }

    const { id } = paramResult.data;
    const cinema = await this.cinemaService.updateCinema(id, bodyResult.data);

    if (!cinema) {
      throw new NotFoundError("Cinema not found");
    }

    return response.status(200).json({
      success: true,
      message: "Cinema updated",
      data: cinema,
    });
  });

  deleteCinema = asyncHandler(async (request: Request<{ id: string }>, response: Response) => {
    const paramResult = cinemaIdParamSchema.safeParse(request.params);
    if (!paramResult.success) {
      throw new ValidationError("Invalid cinema ID", paramResult.error.issues);
    }

    const { id } = paramResult.data;
    const cinema = await this.cinemaService.deleteCinema(id);

    if (!cinema) {
      throw new NotFoundError("Cinema not found");
    }

    return response.status(200).json({
      success: true,
      message: "Cinema deleted",
      data: cinema,
    });
  });
}
