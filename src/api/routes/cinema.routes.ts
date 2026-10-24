import express from "express";

import {
  CinemaController,
} from "../controllers/cinema.controller.js";

import {
  CinemaService,
} from "../../business/services/cinema.service.js";

import {
  PrismaCinemaRepository,
} from "../../data-access/repositories/cinema.repository.js";

import {
  authMiddleware,
} from "../middlewares/auth.middleware.js";

import {
  requireAdmin,
} from "../middlewares/role.middleware.js";

import {
  validateRequest,
} from "../middlewares/validate.middleware.js";

import {
  createCinemaSchema,
  updateCinemaSchema,
  cinemaIdParamSchema,
} from "../validators/cinema.validator.js";

const cinemaRouter =
  express.Router();

const cinemaRepository =
  new PrismaCinemaRepository();

const cinemaService =
  new CinemaService(
    cinemaRepository
  );

const cinemaController =
  new CinemaController(
    cinemaService
  );

/*
 * UC-11 Manage Cinemas & Browse Cinemas
 *
 * Cinema browsing is public; management (create/update/delete) is Admin-only.
 */

cinemaRouter.get(
  "/",
  cinemaController.getAllCinemas
);

cinemaRouter.get(
  "/:id",
  validateRequest({ params: cinemaIdParamSchema }),
  cinemaController.getCinemaById
);

cinemaRouter.post(
  "/",
  authMiddleware,
  requireAdmin,
  validateRequest({ body: createCinemaSchema }),
  cinemaController.createCinema
);

cinemaRouter.put(
  "/:id",
  authMiddleware,
  requireAdmin,
  validateRequest({ params: cinemaIdParamSchema, body: updateCinemaSchema }),
  cinemaController.updateCinema
);

cinemaRouter.delete(
  "/:id",
  authMiddleware,
  requireAdmin,
  validateRequest({ params: cinemaIdParamSchema }),
  cinemaController.deleteCinema
);

export default cinemaRouter;
