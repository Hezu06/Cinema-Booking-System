import type { Request, Response, NextFunction } from "express";

export interface ThrottlingOptions {
  /** Maximum number of concurrent in-flight requests processed at one time (Default: 100) */
  maxConcurrentRequests: number;
  /** Maximum number of requests allowed to wait in the backlog queue (Default: 50) */
  maxQueueSize: number;
  /** Maximum time in milliseconds a request is allowed to wait in queue (Default: 2000 ms) */
  queueTimeoutMs: number;
  /** Optional custom check to exempt specific routes (e.g. payment webhooks, health checks) */
  isExempt?: (req: Request) => boolean;
}

interface QueuedRequest {
  req: Request;
  res: Response;
  next: NextFunction;
  timer: NodeJS.Timeout;
}

export interface ThrottlingMiddleware {
  (req: Request, res: Response, next: NextFunction): void;
  getStats: () => {
    activeRequests: number;
    queueLength: number;
    maxConcurrentRequests: number;
    maxQueueSize: number;
  };
  updateOptions: (newOptions: Partial<ThrottlingOptions>) => void;
}

/**
 * Standard rejection response conforming to CBS API envelope conventions.
 */
function sendThrottledResponse(res: Response, retryAfterSeconds: number = 2): void {
  if (res.headersSent) return;

  res.setHeader("Retry-After", retryAfterSeconds.toString());
  res.status(503).json({
    success: false,
    message: "Hệ thống đang phục vụ lượng truy cập lớn. Vui lòng thử lại sau giây lát.",
    data: null,
    errorCode: "SERVICE_THROTTLED",
  });
}

/**
 * Factory function to create a Throttling & Concurrency Backpressure Middleware.
 */
export function createThrottlingMiddleware(customOptions?: Partial<ThrottlingOptions>): ThrottlingMiddleware {
  const options: ThrottlingOptions = {
    maxConcurrentRequests:
      customOptions?.maxConcurrentRequests ??
      (process.env.THROTTLING_MAX_CONCURRENT
        ? Number(process.env.THROTTLING_MAX_CONCURRENT)
        : 100),
    maxQueueSize:
      customOptions?.maxQueueSize ??
      (process.env.THROTTLING_MAX_QUEUE
        ? Number(process.env.THROTTLING_MAX_QUEUE)
        : 50),
    queueTimeoutMs:
      customOptions?.queueTimeoutMs ??
      (process.env.THROTTLING_QUEUE_TIMEOUT
        ? Number(process.env.THROTTLING_QUEUE_TIMEOUT)
        : 2000),
    isExempt: customOptions?.isExempt ?? ((req: Request) => {
      // CRITICAL EXEMPTION: Payment webhooks and health checks must NEVER be throttled!
      const path = req.path.toLowerCase();
      return path.startsWith("/api/payments/vnpay") || path.startsWith("/health");
    }),
  };

  let activeRequests = 0;
  const queue: QueuedRequest[] = [];

  function processNext(): void {
    if (activeRequests >= options.maxConcurrentRequests || queue.length === 0) {
      return;
    }

    const item = queue.shift();
    if (!item) return;

    clearTimeout(item.timer);

    if (item.res.writableEnded || item.res.headersSent) {
      // Request was already aborted/ended while waiting in queue
      processNext();
      return;
    }

    activeRequests++;

    const cleanup = () => {
      item.res.removeListener("finish", onFinish);
      item.res.removeListener("close", onClose);
    };

    const onFinish = () => {
      cleanup();
      activeRequests--;
      processNext();
    };

    const onClose = () => {
      cleanup();
      activeRequests--;
      processNext();
    };

    item.res.once("finish", onFinish);
    item.res.once("close", onClose);

    item.next();
  }

  const middleware = ((req: Request, res: Response, next: NextFunction): void => {
    // 1. Check exemption rule (e.g. VNPAY IPN webhook, health checks)
    if (options.isExempt?.(req)) {
      return next();
    }

    // 2. Capacity available: process immediately
    if (activeRequests < options.maxConcurrentRequests) {
      activeRequests++;

      const cleanup = () => {
        res.removeListener("finish", onFinish);
        res.removeListener("close", onClose);
      };

      const onFinish = () => {
        cleanup();
        activeRequests--;
        processNext();
      };

      const onClose = () => {
        cleanup();
        activeRequests--;
        processNext();
      };

      res.once("finish", onFinish);
      res.once("close", onClose);

      return next();
    }

    // 3. System under load: check if queue is full
    if (queue.length >= options.maxQueueSize) {
      const retrySec = Math.ceil(options.queueTimeoutMs / 1000);
      return sendThrottledResponse(res, retrySec);
    }

    // 4. Enqueue request with timeout backpressure
    const queueItem: QueuedRequest = {
      req,
      res,
      next,
      timer: setTimeout(() => {
        // Remove item from queue on timeout
        const index = queue.indexOf(queueItem);
        if (index !== -1) {
          queue.splice(index, 1);
        }
        const retrySec = Math.ceil(options.queueTimeoutMs / 1000);
        sendThrottledResponse(res, retrySec);
      }, options.queueTimeoutMs),
    };

    queue.push(queueItem);
  }) as ThrottlingMiddleware;

  // Expose internal counters and runtime options update for observability and testing
  middleware.getStats = () => ({
    activeRequests,
    queueLength: queue.length,
    maxConcurrentRequests: options.maxConcurrentRequests,
    maxQueueSize: options.maxQueueSize,
  });

  middleware.updateOptions = (newOptions: Partial<ThrottlingOptions>) => {
    if (newOptions.maxConcurrentRequests !== undefined) {
      options.maxConcurrentRequests = newOptions.maxConcurrentRequests;
    }
    if (newOptions.maxQueueSize !== undefined) {
      options.maxQueueSize = newOptions.maxQueueSize;
    }
    if (newOptions.queueTimeoutMs !== undefined) {
      options.queueTimeoutMs = newOptions.queueTimeoutMs;
    }
    if (newOptions.isExempt !== undefined) {
      options.isExempt = newOptions.isExempt;
    }
  };

  return middleware;
}

/**
 * Default singleton instance configured for production web service.
 * Supports environment variable overrides for capacity tuning and E2E testing.
 */
export const throttlingMiddleware: ThrottlingMiddleware = createThrottlingMiddleware();
