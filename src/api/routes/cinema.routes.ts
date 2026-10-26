import express from "express";
import { container } from "../../config/container.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { requireAdmin } from "../middlewares/role.middleware.js";
import { validateRequest } from "../middlewares/validate.middleware.js";
import {
  createCinemaSchema,
  updateCinemaSchema,
  cinemaIdParamSchema,
} from "../validators/cinema.validator.js";

const cinemaRouter = express.Router();

/*
 * UC-11 Manage Cinemas & Browse Cinemas
 *
 * Cinema browsing is public; management (create/update/delete) is Admin-only.
 */
cinemaRouter.get("/", container.cinemaController.getAllCinemas);
cinemaRouter.get(
  "/:id",
  validateRequest({ params: cinemaIdParamSchema }),
  container.cinemaController.getCinemaById
);
cinemaRouter.post(
  "/",
  authMiddleware,
  requireAdmin,
  validateRequest({ body: createCinemaSchema }),
  container.cinemaController.createCinema
);
cinemaRouter.put(
  "/:id",
  authMiddleware,
  requireAdmin,
  validateRequest({ params: cinemaIdParamSchema, body: updateCinemaSchema }),
  container.cinemaController.updateCinema
);
cinemaRouter.delete(
  "/:id",
  authMiddleware,
  requireAdmin,
  validateRequest({ params: cinemaIdParamSchema }),
  container.cinemaController.deleteCinema
);

export default cinemaRouter;
