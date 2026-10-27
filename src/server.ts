import "dotenv/config";
import app from "./app.js";
import { container } from "./config/container.js";
import { prisma } from "./data-access/prisma/client.js";

const PORT = Number(process.env.PORT ?? 3000);

const server = app.listen(PORT, () => {
  console.log(`Cinema Booking System API running on port ${PORT}`);
  container.bookingExpirationWorker.start();
});

const gracefulShutdown = (signal: string) => {
  console.log(`Received ${signal}. Shutting down gracefully...`);
  container.bookingExpirationWorker.stop();
  server.close(async () => {
    try {
      await prisma.$disconnect();
      console.log("Database disconnected. Server closed cleanly.");
      process.exit(0);
    } catch (err) {
      console.error("Error during disconnect:", err);
      process.exit(1);
    }
  });

  setTimeout(() => {
    console.error("Could not close connections in time, forcefully shutting down");
    process.exit(1);
  }, 10_000).unref();
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
