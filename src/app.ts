import express from "express";
import helmet from "helmet";
import cors from "cors";

import authRouter from "./api/routes/auth.routes.js";
import movieRouter from "./api/routes/movie.routes.js";
import cinemaRouter from "./api/routes/cinema.routes.js";
import roomRouter from "./api/routes/room.routes.js";

import {
  setupSwagger,
} from "./config/swagger/index.js";

const app = express();

app.use(
  helmet({
    contentSecurityPolicy: false,
  }),
);

app.use(cors());
app.use(express.json());

setupSwagger(app);

app.get("/health", (_request, response) => {
  return response.status(200).json({
    success: true,
    message: "Cinema Booking System API is running",
  });
});

app.use("/api/auth", authRouter);
app.use("/api/movies", movieRouter);
app.use("/api/cinemas", cinemaRouter);
app.use("/api/cinema", cinemaRouter);
app.use("/api/rooms", roomRouter);

export default app;