import type { Request, Response } from "express";
import { ZodError } from "zod";
import {
    loginSchema,
    registerSchema,
    googleAuthSchema,
    verifyEmailSchema,
    resendVerificationSchema,
} from "../validators/auth.validator.js";
import { AuthService } from "../../business/services/auth.service.js";
import { userRepository } from "../../data-access/repositories/user.repository.js";
import { emailService } from "../../data-access/gateways/email.gateway.js";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware.js";

const authService = new AuthService(userRepository, emailService);

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
            message: "Đăng ký thành công. Vui lòng kiểm tra email để lấy mã xác thực.",
            data: {
                user,
                requireVerification: true,
            },
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

        if (error instanceof Error && error.message.includes("chưa được kích hoạt")) {
            const rawEmail = typeof req.body === "object" && req.body && "email" in req.body ? String(req.body.email) : undefined;
            return res.status(403).json({
                success: false,
                message: error.message,
                isUnverified: true,
                ...(rawEmail ? { email: rawEmail } : {}),
            });
        }

        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Đã xảy ra lỗi trong quá trình đăng nhập",
            ...(process.env.NODE_ENV !== "production" && error instanceof Error
                ? { details: error.message }
                : {}),
        });
    }
}

export async function googleAuth(req: Request, res: Response) {
    try {
        const input = googleAuthSchema.parse(req.body);

        const result = await authService.loginWithGoogle(input.idToken);

        return res.status(200).json({
            success: true,
            data: result,
        });
    } catch (error) {
        if (error instanceof ZodError) {
            return res.status(400).json({
                success: false,
                message: "Dữ liệu xác thực Google không hợp lệ",
                errors: error.issues,
            });
        }

        if (error instanceof Error) {
            if (
                error.message.includes("không hợp lệ") ||
                error.message.includes("hết hạn") ||
                error.message.includes("Token không khớp") ||
                error.message.includes("chưa được xác thực")
            ) {
                return res.status(401).json({
                    success: false,
                    message: error.message,
                });
            }

            if (error.message.includes("Timeout") || error.message.includes("kết nối")) {
                return res.status(503).json({
                    success: false,
                    message: error.message,
                });
            }
        }

        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Đã xảy ra lỗi trong quá trình xác thực với Google",
            ...(process.env.NODE_ENV !== "production" && error instanceof Error
                ? { details: error.message }
                : {}),
        });
    }
}

export async function getMe(
    req: Request,
    res: Response
) {
    try {
        const authenticatedRequest = req as AuthenticatedRequest;
        const user = await authService.getProfile(authenticatedRequest.user.userId);

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

export async function verifyEmail(req: Request, res: Response) {
    try {
        const input = verifyEmailSchema.parse(req.body);

        const result = await authService.verifyEmail(input);

        return res.status(200).json({
            success: true,
            message: "Xác thực tài khoản thành công",
            data: result,
        });
    } catch (error) {
        if (error instanceof ZodError) {
            return res.status(400).json({
                success: false,
                message: "Dữ liệu xác thực không hợp lệ",
                errors: error.issues,
            });
        }

        if (error instanceof Error) {
            if (error.message === "Tài khoản không tồn tại") {
                return res.status(404).json({
                    success: false,
                    message: error.message,
                });
            }
            if (
                error.message === "Mã xác thực không chính xác" ||
                error.message.includes("đã hết hạn") ||
                error.message.includes("đã được xác thực")
            ) {
                return res.status(400).json({
                    success: false,
                    message: error.message,
                });
            }
        }

        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Đã xảy ra lỗi trong quá trình xác thực email",
            ...(process.env.NODE_ENV !== "production" && error instanceof Error
                ? { details: error.message }
                : {}),
        });
    }
}

export async function resendVerification(req: Request, res: Response) {
    try {
        const input = resendVerificationSchema.parse(req.body);

        await authService.resendVerificationCode(input.email);

        return res.status(200).json({
            success: true,
            message: "Mã xác thực mới đã được gửi tới email của bạn",
        });
    } catch (error) {
        if (error instanceof ZodError) {
            return res.status(400).json({
                success: false,
                message: "Email không hợp lệ",
                errors: error.issues,
            });
        }

        if (error instanceof Error) {
            if (error.message === "Tài khoản không tồn tại") {
                return res.status(404).json({
                    success: false,
                    message: error.message,
                });
            }
            if (error.message.includes("Vui lòng đợi")) {
                return res.status(429).json({
                    success: false,
                    message: error.message,
                });
            }
            if (error.message.includes("đã được xác thực")) {
                return res.status(400).json({
                    success: false,
                    message: error.message,
                });
            }
        }

        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Đã xảy ra lỗi khi gửi lại mã xác thực",
            ...(process.env.NODE_ENV !== "production" && error instanceof Error
                ? { details: error.message }
                : {}),
        });
    }
}
