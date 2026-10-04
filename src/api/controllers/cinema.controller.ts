import type {
  Request,
  Response,
} from "express";

import {
  CinemaService,
} from "../../business/services/cinema.service.js";

import {
  createCinemaSchema,
  updateCinemaSchema,
  cinemaIdParamSchema,
} from "../validators/cinema.validator.js";

export class CinemaController {
  constructor(
    private readonly cinemaService:
      CinemaService
  ) {}

  getAllCinemas = async (
    _request: Request,
    response: Response
  ) => {
    try {
      const cinemas =
        await this.cinemaService
          .getAllCinemas();

      return response
        .status(200)
        .json({
          success: true,
          message:
            "Get all cinemas",
          data: cinemas,
        });
    } catch (error) {
      console.error(
        "Error fetching all cinemas:",
        error
      );

      return response
        .status(500)
        .json({
          success: false,
          message:
            "Internal server error",
        });
    }
  };

  getCinemaById = async (
    request: Request<{
      id: string;
    }>,
    response: Response
  ) => {
    try {
      const paramResult =
        cinemaIdParamSchema.safeParse(
          request.params
        );

      if (!paramResult.success) {
        return response
          .status(400)
          .json({
            success: false,
            message:
              "Invalid cinema ID",
            errors:
              paramResult.error.issues,
          });
      }

      const { id } =
        paramResult.data;

      const cinema =
        await this.cinemaService
          .getCinemaById(id);

      if (!cinema) {
        return response
          .status(404)
          .json({
            success: false,
            message:
              "Cinema not found",
          });
      }

      return response
        .status(200)
        .json({
          success: true,
          message:
            `Get cinema ${id}`,
          data: cinema,
        });
    } catch (error) {
      console.error(
        "Error fetching cinema by ID:",
        error
      );

      return response
        .status(500)
        .json({
          success: false,
          message:
            "Internal server error",
        });
    }
  };

  createCinema = async (
    request: Request,
    response: Response
  ) => {
    try {
      const bodyResult =
        createCinemaSchema.safeParse(
          request.body
        );

      if (!bodyResult.success) {
        return response
          .status(400)
          .json({
            success: false,
            message:
              "Validation failed",
            errors:
              bodyResult.error.issues,
          });
      }

      const cinema =
        await this.cinemaService
          .createCinema(
            bodyResult.data
          );

      return response
        .status(201)
        .json({
          success: true,
          message:
            "Cinema created",
          data: cinema,
        });
    } catch (error) {
      console.error(
        "Error creating cinema:",
        error
      );

      return response
        .status(500)
        .json({
          success: false,
          message:
            "Internal server error",
        });
    }
  };

  updateCinema = async (
    request: Request<{
      id: string;
    }>,
    response: Response
  ) => {
    try {
      const paramResult =
        cinemaIdParamSchema.safeParse(
          request.params
        );

      if (!paramResult.success) {
        return response
          .status(400)
          .json({
            success: false,
            message:
              "Invalid cinema ID",
            errors:
              paramResult.error.issues,
          });
      }

      const bodyResult =
        updateCinemaSchema.safeParse(
          request.body
        );

      if (!bodyResult.success) {
        return response
          .status(400)
          .json({
            success: false,
            message:
              "Validation failed",
            errors:
              bodyResult.error.issues,
          });
      }

      const { id } =
        paramResult.data;

      const cinema =
        await this.cinemaService
          .updateCinema(
            id,
            bodyResult.data
          );

      if (!cinema) {
        return response
          .status(404)
          .json({
            success: false,
            message:
              "Cinema not found",
          });
      }

      return response
        .status(200)
        .json({
          success: true,
          message:
            "Cinema updated",
          data: cinema,
        });
    } catch (error) {
      console.error(
        "Error updating cinema:",
        error
      );

      return response
        .status(500)
        .json({
          success: false,
          message:
            "Internal server error",
        });
    }
  };

  deleteCinema = async (
    request: Request<{
      id: string;
    }>,
    response: Response
  ) => {
    try {
      const paramResult =
        cinemaIdParamSchema.safeParse(
          request.params
        );

      if (!paramResult.success) {
        return response
          .status(400)
          .json({
            success: false,
            message:
              "Invalid cinema ID",
            errors:
              paramResult.error.issues,
          });
      }

      const { id } =
        paramResult.data;

      const deletedCinema =
        await this.cinemaService
          .deleteCinema(id);

      if (!deletedCinema) {
        return response
          .status(404)
          .json({
            success: false,
            message:
              "Cinema not found",
          });
      }

      return response
        .status(200)
        .json({
          success: true,
          message:
            "Cinema deleted successfully",
          data: deletedCinema,
        });
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes(
          "still contains rooms"
        )
      ) {
        return response
          .status(409)
          .json({
            success: false,
            message: error.message,
          });
      }

      /*
       * Extra database protection.
       *
       * P2003 = foreign key
       * constraint violation.
       */
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "P2003"
      ) {
        return response
          .status(409)
          .json({
            success: false,
            message:
              "Cinema cannot be deleted because it is referenced by related data",
          });
      }

      console.error(
        "Error deleting cinema:",
        error
      );

      return response
        .status(500)
        .json({
          success: false,
          message:
            "Internal server error",
        });
    }
  };
}