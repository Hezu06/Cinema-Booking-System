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
  cinemaController.getCinemaById
);

cinemaRouter.post(
  "/",
  authMiddleware,
  requireAdmin,
  cinemaController.createCinema
);

cinemaRouter.put(
  "/:id",
  authMiddleware,
  requireAdmin,
  cinemaController.updateCinema
);

cinemaRouter.delete(
  "/:id",
  authMiddleware,
  requireAdmin,
  cinemaController.deleteCinema
);

export default cinemaRouter;