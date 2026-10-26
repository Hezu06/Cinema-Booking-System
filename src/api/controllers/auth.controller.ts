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
import type { AuthenticatedRequest } from "../middlewares/auth.middleware.js";
import { asyncHandler } from "../utils/async-handler.util.js";
import { NotFoundError, UnauthorizedError } from "../../shared/errors/index.js";

export class AuthController {
    constructor(private readonly authService: AuthService) {}

    register = asyncHandler(async (req: Request, res: Response) => {
        const input = req.body as RegisterInput;
        const user = await this.authService.register(input);

        return res.status(201).json({
            success: true,
            message: "Đăng ký thành công. Vui lòng kiểm tra email để lấy mã xác thực.",
            data: {
                user,
                requireVerification: true,
            },
        });
    });

    login = asyncHandler(async (req: Request, res: Response) => {
        const input = req.body as LoginInput;
        const result = await this.authService.login(input.email, input.password);

        return res.status(200).json({
            success: true,
            data: result,
        });
    });

    googleAuth = asyncHandler(async (req: Request, res: Response) => {
        const input = req.body as GoogleAuthInput;
        const result = await this.authService.loginWithGoogle(input.idToken);

        return res.status(200).json({
            success: true,
            data: result,
        });
    });

    getMe = asyncHandler(async (req: Request, res: Response) => {
        const authenticatedRequest = req as AuthenticatedRequest;
        const user = await this.authService.getProfile(authenticatedRequest.user.userId);

        if (!user) {
            throw new NotFoundError("Không tìm thấy người dùng");
        }

        return res.status(200).json({
            success: true,
            data: user,
        });
    });

    verifyEmail = asyncHandler(async (req: Request, res: Response) => {
        const input = req.body as VerifyEmailInput;
        const result = await this.authService.verifyEmail(input);

        return res.status(200).json({
            success: true,
            message: "Xác thực tài khoản thành công",
            data: result,
        });
    });

    resendVerification = asyncHandler(async (req: Request, res: Response) => {
        const input = req.body as ResendVerificationInput;
        await this.authService.resendVerificationCode(input.email, input.force);

        return res.status(200).json({
            success: true,
            message: "Mã xác thực mới đã được gửi tới email của bạn",
        });
    });

    forgotPassword = asyncHandler(async (req: Request, res: Response) => {
        const input = req.body as ForgotPasswordInput;
        await this.authService.forgotPassword(input);

        return res.status(200).json({
            success: true,
            message: "Mã xác thực đặt lại mật khẩu đã được gửi tới email của bạn",
        });
    });

    resetPassword = asyncHandler(async (req: Request, res: Response) => {
        const input = req.body as ResetPasswordInput;
        await this.authService.resetPassword(input);

        return res.status(200).json({
            success: true,
            message: "Đặt lại mật khẩu thành công. Bạn có thể đăng nhập bằng mật khẩu mới",
        });
    });

    changePassword = asyncHandler(async (req: Request, res: Response) => {
        const input = req.body as ChangePasswordInput;
        const authenticatedRequest = req as AuthenticatedRequest;
        const userId = authenticatedRequest.user?.userId;

        if (!userId) {
            throw new UnauthorizedError("Vui lòng đăng nhập để thực hiện chức năng này");
        }

        await this.authService.changePassword({
            userId,
            currentPassword: input.currentPassword,
            newPassword: input.newPassword,
        });

        return res.status(200).json({
            success: true,
            message: "Đổi mật khẩu thành công",
        });
    });
}
