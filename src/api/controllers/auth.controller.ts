import type { Request, Response } from "express";
import type {
    ChangePasswordInput,
    ForgotPasswordInput,
    GoogleAuthInput,
    LoginInput,
    RegisterInput,
    ResendVerificationInput,
    ResetPasswordInput,
    VerifyEmailInput,
} from "../validators/auth.validator.js";
import { AuthService } from "../../business/services/auth.service.js";
import { userRepository } from "../../data-access/repositories/user.repository.js";
import { emailService } from "../../data-access/gateways/email.gateway.js";
import { googleOAuthGateway } from "../../data-access/gateways/google-oauth.gateway.js";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware.js";
import { asyncHandler } from "../utils/async-handler.util.js";
import { NotFoundError, UnauthorizedError } from "../../shared/errors/index.js";

const authService = new AuthService(userRepository, emailService, googleOAuthGateway);

export const register = asyncHandler(async (req: Request, res: Response) => {
    const input = req.body as RegisterInput;
    const user = await authService.register(input);

    return res.status(201).json({
        success: true,
        message: "Đăng ký thành công. Vui lòng kiểm tra email để lấy mã xác thực.",
        data: {
            user,
            requireVerification: true,
        },
    });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
    const input = req.body as LoginInput;
    const result = await authService.login(input.email, input.password);

    return res.status(200).json({
        success: true,
        data: result,
    });
});

export const googleAuth = asyncHandler(async (req: Request, res: Response) => {
    const input = req.body as GoogleAuthInput;
    const result = await authService.loginWithGoogle(input.idToken);

    return res.status(200).json({
        success: true,
        data: result,
    });
});

export const getMe = asyncHandler(async (req: Request, res: Response) => {
    const authenticatedRequest = req as AuthenticatedRequest;
    const user = await authService.getProfile(authenticatedRequest.user.userId);

    if (!user) {
        throw new NotFoundError("Không tìm thấy người dùng");
    }

    return res.status(200).json({
        success: true,
        data: user,
    });
});

export const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
    const input = req.body as VerifyEmailInput;
    const result = await authService.verifyEmail(input);

    return res.status(200).json({
        success: true,
        message: "Xác thực tài khoản thành công",
        data: result,
    });
});

export const resendVerification = asyncHandler(async (req: Request, res: Response) => {
    const input = req.body as ResendVerificationInput;
    await authService.resendVerificationCode(input.email, input.force);

    return res.status(200).json({
        success: true,
        message: "Mã xác thực mới đã được gửi tới email của bạn",
    });
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
    const input = req.body as ForgotPasswordInput;
    await authService.forgotPassword(input);

    return res.status(200).json({
        success: true,
        message: "Mã xác thực đặt lại mật khẩu đã được gửi tới email của bạn",
    });
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
    const input = req.body as ResetPasswordInput;
    await authService.resetPassword(input);

    return res.status(200).json({
        success: true,
        message: "Đặt lại mật khẩu thành công. Bạn có thể đăng nhập bằng mật khẩu mới",
    });
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
    const input = req.body as ChangePasswordInput;
    const authenticatedRequest = req as AuthenticatedRequest;
    const userId = authenticatedRequest.user?.userId;

    if (!userId) {
        throw new UnauthorizedError("Vui lòng đăng nhập để thực hiện chức năng này");
    }

    await authService.changePassword({
        userId,
        currentPassword: input.currentPassword,
        newPassword: input.newPassword,
    });

    return res.status(200).json({
        success: true,
        message: "Đổi mật khẩu thành công",
    });
});
