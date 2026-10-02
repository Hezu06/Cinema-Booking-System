import type { Request, Response } from "express";
import type { ShowtimeService } from "../../business/services/showtime.service.js";
import {
  createShowtimeSchema,
  showtimeIdParamSchema,
  showtimeQuerySchema,
  updateShowtimeSchema,
} from "../validators/showtime.validator.js";

function prismaCode(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error ? error.code : undefined;
}

function businessError(error: unknown, response: Response) {
  if (!(error instanceof Error)) return false;
  if (error.message === "MOVIE_NOT_FOUND") { response.status(404).json({ success: false, message: "Movie not found" }); return true; }
  if (error.message === "ROOM_NOT_FOUND") { response.status(404).json({ success: false, message: "Room not found" }); return true; }
  if (error.message === "INVALID_TIME_RANGE") { response.status(400).json({ success: false, message: "startTime must be before endTime" }); return true; }
  if (error.message === "SHOWTIME_OVERLAP") { response.status(409).json({ success: false, message: "Showtime overlaps another showtime in this room" }); return true; }
  return false;
}

export class ShowtimeController {
  constructor(private readonly showtimeService: ShowtimeService) {}

  getAllShowtimes = async (request: Request, response: Response) => {
    const query = showtimeQuerySchema.safeParse(request.query);
    if (!query.success) return response.status(400).json({ success: false, message: "Invalid query", errors: query.error.issues });
    try {
      const data = await this.showtimeService.getAllShowtimes(query.data);
      return response.status(200).json({ success: true, message: "Get all showtimes", data });
    } catch (error) {
      console.error("Error fetching showtimes:", error);
      return response.status(500).json({ success: false, message: "Internal server error" });
    }
  };

  getShowtimeById = async (request: Request, response: Response) => {
    const params = showtimeIdParamSchema.safeParse(request.params);
    if (!params.success) return response.status(400).json({ success: false, message: "Invalid showtime ID", errors: params.error.issues });
    try {
      const data = await this.showtimeService.getShowtimeById(params.data.id);
      if (!data) return response.status(404).json({ success: false, message: "Showtime not found" });
      return response.status(200).json({ success: true, message: "Get showtime", data });
    } catch (error) {
      console.error("Error fetching showtime:", error);
      return response.status(500).json({ success: false, message: "Internal server error" });
    }
  };

  getShowtimeSeats = async (request: Request, response: Response) => {
    const params = showtimeIdParamSchema.safeParse(request.params);
    if (!params.success) return response.status(400).json({ success: false, message: "Invalid showtime ID", errors: params.error.issues });
    try {
      const data = await this.showtimeService.getShowtimeSeats(params.data.id);
      if (!data) return response.status(404).json({ success: false, message: "Showtime not found" });
      return response.status(200).json({ success: true, message: "Get seats for showtime", data });
    } catch (error) {
      console.error("Error fetching showtime seats:", error);
      return response.status(500).json({ success: false, message: "Internal server error" });
    }
  };

  createShowtime = async (request: Request, response: Response) => {
    const body = createShowtimeSchema.safeParse(request.body);
    if (!body.success) return response.status(400).json({ success: false, message: "Validation failed", errors: body.error.issues });
    try {
      const data = await this.showtimeService.createShowtime(body.data);
      return response.status(201).json({ success: true, message: "Showtime created", data });
    } catch (error) {
      if (businessError(error, response)) return;
      console.error("Error creating showtime:", error);
      return response.status(500).json({ success: false, message: "Internal server error" });
    }
  };

  updateShowtime = async (request: Request, response: Response) => {
    const params = showtimeIdParamSchema.safeParse(request.params);
    const body = updateShowtimeSchema.safeParse(request.body);
    if (!params.success) return response.status(400).json({ success: false, message: "Invalid showtime ID", errors: params.error.issues });
    if (!body.success) return response.status(400).json({ success: false, message: "Validation failed", errors: body.error.issues });
    try {
      const data = await this.showtimeService.updateShowtime(params.data.id, body.data);
      if (!data) return response.status(404).json({ success: false, message: "Showtime not found" });
      return response.status(200).json({ success: true, message: "Showtime updated", data });
    } catch (error) {
      if (businessError(error, response)) return;
      if (prismaCode(error) === "P2003") return response.status(409).json({ success: false, message: "Showtime has related booking data" });
      console.error("Error updating showtime:", error);
      return response.status(500).json({ success: false, message: "Internal server error" });
    }
  };

  deleteShowtime = async (request: Request, response: Response) => {
    const params = showtimeIdParamSchema.safeParse(request.params);
    if (!params.success) return response.status(400).json({ success: false, message: "Invalid showtime ID", errors: params.error.issues });
    try {
      const data = await this.showtimeService.deleteShowtime(params.data.id);
      if (!data) return response.status(404).json({ success: false, message: "Showtime not found" });
      return response.status(200).json({ success: true, message: "Showtime deleted", data });
    } catch (error) {
      if (prismaCode(error) === "P2003") return response.status(409).json({ success: false, message: "Showtime has related booking data" });
      console.error("Error deleting showtime:", error);
      return response.status(500).json({ success: false, message: "Internal server error" });
    }
  };
}
