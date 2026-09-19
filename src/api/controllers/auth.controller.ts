import type { Request, Response } from "express";
import { ZodError } from "zod";
import { loginSchema, registerSchema } from "../validators/auth.validator.js";
import { authService } from "../../business/services/auth.service.js";
import { userRepository } from "../../data-access/repositories/user.repository.js";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware.js";

function isPrismaUniqueConstraintError(
    error: unknown
): error is { code: "P2002"; meta?: { target?: string[] } } {
    return (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "P2002"
    );
}

export async function register(req: Request, res: Response) {
    try {
        const input = registerSchema.parse(req.body);

        const user = await authService.register(input);

        return res.status(201).json({
            success: true,
            data: user,
        });
    } catch (error) {
        if (error instanceof ZodError) {
            return res.status(400).json({
                success: false,
                message: "Dữ liệu đăng ký không hợp lệ",
                errors: error.issues,
            });
        }

        if (error instanceof Error && error.message === "Email đã được sử dụng") {
            return res.status(409).json({
                success: false,
                message: error.message,
            });
        }

        if (isPrismaUniqueConstraintError(error)) {
            const fields = error.meta?.target?.join(", ") ?? "email hoặc phone";

            return res.status(409).json({
                success: false,
                message: `Dữ liệu đã tồn tại: ${fields}`,
            });
        }

        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Đã xảy ra lỗi trong quá trình đăng ký",
            ...(process.env.NODE_ENV !== "production" && error instanceof Error
                ? { details: error.message }
                : {}),
        });
    }
}

export async function login(req: Request, res: Response) {
    try {
        const input = loginSchema.parse(req.body);

        const result = await authService.login(
            input.email,
            input.password
        );

        return res.status(200).json({
            success: true,
            data: result,
        });
    } catch (error) {
        if (error instanceof ZodError) {
            return res.status(400).json({
                success: false,
                message: "Dữ liệu đăng nhập không hợp lệ",
                errors: error.issues,
            });
        }

        if (error instanceof Error && error.message === "Email hoặc mật khẩu không đúng") {
            return res.status(401).json({
                success: false,
                message: error.message,
            });
        }

        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Đã xảy ra lỗi trong quá trình đăng nhập",
        });
    }
}

export async function getMe(
    req: Request,
    res: Response
) {
    try {
        const authenticatedRequest = req as AuthenticatedRequest;
        const user = await userRepository.findById(authenticatedRequest.user.userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy người dùng",
            });
        }

        return res.status(200).json({
            success: true,
            data: user,
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Không thể lấy thông tin người dùng",
        });
    }
}
