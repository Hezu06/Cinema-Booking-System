import type { NextFunction, Request, Response } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import type { UserRole } from "../../business/models/user.model.js";
import { userRepository } from "../../data-access/repositories/user.repository.js";

export interface AuthenticatedRequest extends Request {
    user: {
        userId: string;
        role: UserRole;
    };
}

interface AuthTokenPayload extends JwtPayload {
    userId: string;
    role: UserRole;
}

function isAuthTokenPayload(
    payload: string | JwtPayload
): payload is AuthTokenPayload {
    return (
        typeof payload !== "string" &&
        typeof payload.userId === "string" &&
        typeof payload.role === "string"
    );
}

export async function authMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
) {
    const authorization = req.header("Authorization");

    if (!authorization?.startsWith("Bearer ")) {
        return res.status(401).json({
            success: false,
            message: "Thiếu Bearer token",
        });
    }

    let token = authorization.slice("Bearer ".length).trim();
    while (token.toLowerCase().startsWith("bearer ")) {
        token = token.slice("bearer ".length).trim();
    }
    const secret = process.env.JWT_SECRET;

    if (!secret) {
        console.error("JWT_SECRET chưa được cấu hình");

        return res.status(500).json({
            success: false,
            message: "Server chưa được cấu hình xác thực",
        });
    }

    let payload: string | JwtPayload;

    try {
        payload = jwt.verify(token, secret);
    } catch {
        return res.status(401).json({
            success: false,
            message: "Token không hợp lệ hoặc đã hết hạn",
        });
    }

    if (!isAuthTokenPayload(payload)) {
        return res.status(401).json({
            success: false,
            message: "Token không hợp lệ",
        });
    }

    try {
        const user = await userRepository.findById(payload.userId);

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Người dùng không tồn tại",
            });
        }

        if (user.status !== "ACTIVE") {
            return res.status(403).json({
                success: false,
                message: "Tài khoản không hoạt động",
            });
        }

        (req as AuthenticatedRequest).user = {
            userId: payload.userId,
            role: user.role,
        };

        return next();
    } catch (error) {
        console.error("Authentication database lookup failed:", error);

        return res.status(503).json({
            success: false,
            message: "Không thể kết nối cơ sở dữ liệu xác thực",
            ...(process.env.NODE_ENV !== "production" && error instanceof Error
                ? { details: error.message }
                : {}),
        });
    }
}
