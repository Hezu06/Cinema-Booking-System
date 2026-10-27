import { expireStaleBookings } from "../../data-access/repositories/booking-expiration.js";
import { prisma } from "../../data-access/prisma/client.js";

export interface SweepResult {
  expiredBookingsSwept: boolean;
  orphanedSeatsReleased: number;
}

export class BookingExpirationWorker {
  private timer: NodeJS.Timeout | null = null;
  private isRunning = false;

  constructor(private readonly intervalMs: number = 30_000) {}

  start(): void {
    if (this.timer) return;
    console.log(`[BookingExpirationWorker] Started with interval ${this.intervalMs}ms`);
    void this.sweepSafely();
    this.timer = setInterval(() => {
      void this.sweepSafely();
    }, this.intervalMs);
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      console.log("[BookingExpirationWorker] Stopped");
    }
  }

  async runOnce(): Promise<SweepResult> {
    const now = new Date();
    await expireStaleBookings();

    const releasedOrphans = await prisma.showtimeSeat.updateMany({
      where: {
        status: "HELD",
        holdExpiresAt: { lte: now },
      },
      data: {
        status: "AVAILABLE",
        heldByUserId: null,
        holdExpiresAt: null,
      },
    });

    return {
      expiredBookingsSwept: true,
      orphanedSeatsReleased: releasedOrphans.count,
    };
  }

  private async sweepSafely(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;
    try {
      await this.runOnce();
    } catch (error) {
      console.error("[BookingExpirationWorker] Error during expiration sweep:", error);
    } finally {
      this.isRunning = false;
    }
  }
}
