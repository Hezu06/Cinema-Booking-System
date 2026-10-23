import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "../../shared/errors/index.js";
import { CircuitBreakerError } from "../../data-access/resilience/circuit-breaker.js";

interface PrismaLikeError {
  code: string;
  meta?: {
    target?: string[];
    field_name?: string;
  };
}

function isPrismaError(error: unknown): error is PrismaLikeError {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as Record<string, unknown>).code === "string"
  );
}

/**
 * Global centralized error handling middleware.
 * Ensures consistent response envelope structure for all application errors.
 */
export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  // 1. Known Operational Domain Errors (AppError hierarchy)
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
      errorCode: error.errorCode,
      ...(error.details !== undefined ? { errors: error.details } : {}),
    });
  }

  // 2. Request Schema Validation Errors (Zod)
  if (error instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: "Dữ liệu yêu cầu không hợp lệ",
      errorCode: "VALIDATION_ERROR",
      errors: error.issues,
    });
  }

  // 3. Circuit Breaker Trips (Service Unavailable)
  if (error instanceof CircuitBreakerError) {
    return res.status(503).json({
      success: false,
      message: error.message,
      errorCode: "CIRCUIT_BREAKER_OPEN",
    });
  }

  // 4. Malformed JSON Body
  if (error instanceof SyntaxError && "status" in error && error.status === 400 && "body" in error) {
    return res.status(400).json({
      success: false,
      message: "Dữ liệu JSON trong body không hợp lệ",
      errorCode: "INVALID_JSON_BODY",
    });
  }

  // 5. Prisma Driver/ORM Error Fallback (safety net if repository didn't catch)
  if (isPrismaError(error)) {
    if (error.code === "P2002") {
      const fields = error.meta?.target?.join(", ") ?? "dữ liệu duy nhất";
      return res.status(409).json({
        success: false,
        message: `Dữ liệu đã tồn tại trong hệ thống: ${fields}`,
        errorCode: "CONFLICT",
      });
    }

    if (error.code === "P2025") {
      return res.status(404).json({
        success: false,
        message: "Bản ghi yêu cầu không tồn tại trong cơ sở dữ liệu",
        errorCode: "NOT_FOUND",
      });
    }

    if (error.code === "P2003") {
      return res.status(409).json({
        success: false,
        message: "Không thể thao tác do ràng buộc khóa ngoại với dữ liệu liên quan",
        errorCode: "FOREIGN_KEY_VIOLATION",
      });
    }
  }

  // 6. Unknown / Unhandled Programmer Errors (HTTP 500)
  console.error("CRITICAL_UNHANDLED_ERROR:", error);

  const isProduction = process.env.NODE_ENV === "production";
  return res.status(500).json({
    success: false,
    message: "Đã xảy ra lỗi nội bộ máy chủ",
    errorCode: "INTERNAL_SERVER_ERROR",
    ...(!isProduction && error instanceof Error
      ? { details: error.message, stack: error.stack }
      : {}),
  });
}
