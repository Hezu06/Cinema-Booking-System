import express from "express";
import helmet from "helmet";
import cors from "cors";

import authRouter from "./api/routes/auth.routes.js";
import movieRouter from "./api/routes/movie.routes.js";
import cinemaRouter from "./api/routes/cinema.routes.js";
import roomRouter from "./api/routes/room.routes.js";
import seatRouter from "./api/routes/seat.routes.js";
import showtimeRouter from "./api/routes/showtime.routes.js";
import bookingRouter from "./api/routes/booking.routes.js";
import paymentRouter from "./api/routes/payment.routes.js";

import { setupSwagger } from "./config/swagger/index.js";
import { notFoundHandler } from "./api/middlewares/not-found.middleware.js";
import { errorHandler } from "./api/middlewares/error.middleware.js";
import { globalLimiter } from "./api/middlewares/rate-limit.middleware.js";

const app = express();

app.use(
  helmet({
    contentSecurityPolicy: false,
  }),
);

app.use(cors());
app.use(express.json());

setupSwagger(app);

// Health check endpoint (exempt from rate limiting)
app.get("/health", (_request, response) => {
  return response.status(200).json({
    success: true,
    message: "Cinema Booking System API is running",
  });
});

// Apply global rate limiting across all API routes
app.use(globalLimiter);

app.use("/api/auth", authRouter);
app.use("/api/movies", movieRouter);
app.use("/api/cinemas", cinemaRouter);
app.use("/api/cinema", cinemaRouter);
app.use("/api/rooms", roomRouter);
app.use("/api/seats", seatRouter);
app.use("/api/showtimes", showtimeRouter);
app.use("/api/bookings", bookingRouter);
app.use("/api/payments", paymentRouter);

// Fallback: 404 for unmatched routes
app.use(notFoundHandler);

// Centralized Global Error Handler
app.use(errorHandler);

export default app;
