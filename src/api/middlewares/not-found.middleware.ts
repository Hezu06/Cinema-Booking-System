import type { Request, Response } from "express";

/**
 * 404 Route Not Found Middleware.
 * Catches all requests to non-existent endpoints and returns a standardized JSON response envelope.
 */
export function notFoundHandler(req: Request, res: Response) {
  return res.status(404).json({
    success: false,
    message: `Đường dẫn [${req.method}] ${req.originalUrl} không tồn tại trên hệ thống`,
    errorCode: "ROUTE_NOT_FOUND",
  });
}
