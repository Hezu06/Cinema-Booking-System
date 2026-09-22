import swaggerUi from "swagger-ui-express";
import type { Express } from "express";

import {
  commonSchemas,
} from "./schemas/common.schemas.js";

import {
  authSchemas,
} from "./schemas/auth.schemas.js";

import {
  movieSchemas,
} from "./schemas/movie.schemas.js";

import {
  cinemaSchemas,
} from "./schemas/cinema.schemas.js";

import {
  roomSchemas,
} from "./schemas/room.schemas.js";

import {
  commonPaths,
} from "./paths/common.paths.js";

import {
  authPaths,
} from "./paths/auth.paths.js";

import {
  moviePaths,
} from "./paths/movie.paths.js";

import {
  cinemaPaths,
} from "./paths/cinema.paths.js";

import {
  roomPaths,
} from "./paths/room.paths.js";

const swaggerDocument = {
  openapi: "3.0.3",

  info: {
    title: "Cinema Booking System API",
    version: "1.0.0",
    description:
      "REST API documentation for Cinema Booking System",
  },

  servers: [
    {
      url: "http://localhost:5000",
      description: "Development server",
    },
  ],

  tags: [
    {
      name: "Health",
      description: "API health check",
    },
    {
      name: "Auth",
      description: "Authentication",
    },
    {
      name: "Movies",
      description: "Movie APIs",
    },
    {
      name: "Cinemas",
      description: "Cinema management APIs",
    },
    {
      name: "Rooms",
      description: "Room management APIs",
    },
  ],

  components: {
    securitySchemes: {
      BearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },

    schemas: {
      ...commonSchemas,
      ...authSchemas,
      ...movieSchemas,
      ...cinemaSchemas,
      ...roomSchemas,
    },
  },

  paths: {
    ...commonPaths,
    ...authPaths,
    ...moviePaths,
    ...cinemaPaths,
    ...roomPaths,
  },
};

export function setupSwagger(
  app: Express
) {
  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerDocument)
  );
}

export { swaggerDocument };