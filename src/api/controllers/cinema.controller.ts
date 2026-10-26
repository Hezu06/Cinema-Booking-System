import type { Request, Response } from "express";
import { CinemaService } from "../../business/services/cinema.service.js";
import type {
  CreateCinemaInput,
  UpdateCinemaInput,
} from "../validators/cinema.validator.js";
import { asyncHandler } from "../utils/async-handler.util.js";
import { NotFoundError } from "../../shared/errors/index.js";

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
    const { id } = request.params;
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
    const cinema = await this.cinemaService.createCinema(request.body as CreateCinemaInput);

    return response.status(201).json({
      success: true,
      message: "Cinema created",
      data: cinema,
    });
  });

  updateCinema = asyncHandler(async (request: Request<{ id: string }>, response: Response) => {
    const { id } = request.params;
    const cinema = await this.cinemaService.updateCinema(id, request.body as UpdateCinemaInput);

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
    const { id } = request.params;
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
