/**
 * Base abstract class for operational domain errors.
 * Operational errors represent expected runtime error conditions (e.g. invalid input,
 * resource not found, conflict) as opposed to programmer bugs or unhandled crashes.
 */
export abstract class AppError extends Error {
  abstract readonly statusCode: number;
  abstract readonly errorCode: string;
  readonly isOperational: boolean = true;
  readonly details?: unknown;

  constructor(message: string, details?: unknown) {
    super(message);
    this.name = this.constructor.name;
    if (details !== undefined) {
      this.details = details;
    }
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 400 Bad Request
 */
export class BadRequestError extends AppError {
  readonly statusCode = 400;
  readonly errorCode = "BAD_REQUEST";

  constructor(message: string = "Yêu cầu không hợp lệ", details?: unknown) {
    super(message, details);
  }
}

/**
 * 400 Validation Error (e.g. Zod validation failure or domain invariant violation)
 */
export class ValidationError extends AppError {
  readonly statusCode = 400;
  readonly errorCode = "VALIDATION_ERROR";

  constructor(message: string = "Dữ liệu không hợp lệ", details?: unknown) {
    super(message, details);
  }
}

/**
 * 401 Unauthorized
 */
export class UnauthorizedError extends AppError {
  readonly statusCode = 401;
  readonly errorCode = "UNAUTHORIZED";

  constructor(message: string = "Yêu cầu xác thực tài khoản", details?: unknown) {
    super(message, details);
  }
}

/**
 * 403 Forbidden
 */
export class ForbiddenError extends AppError {
  readonly statusCode = 403;
  readonly errorCode = "FORBIDDEN";

  constructor(message: string = "Bạn không có quyền thực hiện thao tác này", details?: unknown) {
    super(message, details);
  }
}

/**
 * 404 Not Found
 */
export class NotFoundError extends AppError {
  readonly statusCode = 404;
  readonly errorCode = "NOT_FOUND";

  constructor(message: string = "Tài nguyên không tồn tại", details?: unknown) {
    super(message, details);
  }
}

/**
 * 409 Conflict (e.g. duplicate key, resource state conflict, overlapping schedules)
 */
export class ConflictError extends AppError {
  readonly statusCode = 409;
  readonly errorCode = "CONFLICT";

  constructor(message: string = "Dữ liệu hoặc trạng thái tài nguyên bị xung đột", details?: unknown) {
    super(message, details);
  }
}

/**
 * 502 Bad Gateway (e.g. external gateway like VNPAY, TMDB, or Brevo failed)
 */
export class BadGatewayError extends AppError {
  readonly statusCode = 502;
  readonly errorCode = "BAD_GATEWAY";

  constructor(message: string = "Lỗi giao tiếp với dịch vụ bên ngoài", details?: unknown) {
    super(message, details);
  }
}

/**
 * 503 Service Unavailable (e.g. circuit breaker open, system undergoing maintenance)
 */
export class ServiceUnavailableError extends AppError {
  readonly statusCode = 503;
  readonly errorCode = "SERVICE_UNAVAILABLE";

  constructor(message: string = "Dịch vụ tạm thời không khả dụng", details?: unknown) {
    super(message, details);
  }
}
