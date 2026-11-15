import type { Request, Response, NextFunction } from "express";

/**
 * List of internal headers that untrusted external clients must never be allowed to spoof.
 */
const FORBIDDEN_CLIENT_HEADERS = [
  "x-internal-secret",
  "x-gatekeeper-bypass",
  "x-user-role",
  "x-user-id",
  "x-admin-override",
  "x-authenticated-user",
];

/**
 * Normalizes client IP address:
 * - Strips IPv4-mapped IPv6 prefix (::ffff:192.168.1.1 -> 192.168.1.1)
 * - Converts IPv6 loopback (::1) to 127.0.0.1
 */
export function normalizeClientIp(rawIp?: string | null): string {
  if (!rawIp) {
    return "127.0.0.1";
  }

  let ip = rawIp.trim();
  if (ip === "::1") {
    return "127.0.0.1";
  }

  if (ip.startsWith("::ffff:")) {
    ip = ip.slice("::ffff:".length);
  }

  return ip;
}

/**
 * Gatekeeper Middleware (L1 Ingress Layer):
 * 1. Sanitizes incoming headers by stripping forbidden internal spoofed headers.
 * 2. Normalizes client IP address and attaches clean `clientIp` to the Request.
 * 3. Enforces GATEKEEPER_SECRET validation if configured (e.g. Nginx reverse proxy integration).
 */
export function gatekeeperMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  // 1. Strip forbidden spoofed internal headers
  for (const headerName of FORBIDDEN_CLIENT_HEADERS) {
    if (headerName in req.headers) {
      delete req.headers[headerName];
    }
  }

  // 2. Normalize and attach clean client IP
  const cleanIp = normalizeClientIp(req.ip);
  (req as any).clientIp = cleanIp;

  // 3. Check for upstream Gatekeeper Secret enforcement if configured in environment
  const gatekeeperSecret = process.env.GATEKEEPER_SECRET?.trim();
  if (gatekeeperSecret) {
    // Exempt health checks so Render/Docker monitoring can reach the app
    if (req.path === "/health" || req.path.startsWith("/health/")) {
      return next();
    }

    const providedSecret = req.header("x-gatekeeper-secret")?.trim();
    if (providedSecret !== gatekeeperSecret) {
      res.status(403).json({
        success: false,
        message:
          "Truy cập trực tiếp bị từ chối. Vui lòng kết nối qua cổng Gatekeeper được ủy quyền.",
        data: null,
        errorCode: "GATEKEEPER_ACCESS_DENIED",
      });
      return;
    }
  }

  next();
}
