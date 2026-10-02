import type { NextFunction, Request, Response } from "express";
import { UserRole } from "../../business/models/user.model.js";
import type { AuthenticatedRequest } from "./auth.middleware.js";

/**
 * Middleware phân quyền (Role-Based Access Control - RBAC).
 * Yêu cầu người dùng đã được xác thực qua authMiddleware và có vai trò phù hợp trong allowedRoles.
 * Nếu chưa đăng nhập -> trả về 401 Unauthorized.
 * Nếu không đúng vai trò -> trả về 403 Forbidden.
 */
export function requireRole(...allowedRoles: UserRole[]) {
    return (req: Request, res: Response, next: NextFunction) => {
        const authReq = req as AuthenticatedRequest;

        if (!authReq.user || !authReq.user.role) {
            return res.status(401).json({
                success: false,
                message: "Yêu cầu đăng nhập trước khi thực hiện thao tác",
            });
        }

        if (!allowedRoles.includes(authReq.user.role)) {
            return res.status(403).json({
                success: false,
                message: "Bạn không có quyền thực hiện thao tác này (yêu cầu quyền Admin)",
            });
        }

        return next();
    };
}

export const requireAdmin = requireRole(UserRole.ADMIN);
