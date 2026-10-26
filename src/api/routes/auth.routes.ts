import { Router } from "express";
import { container } from "../../config/container.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { validateBody } from "../middlewares/validate.middleware.js";
import {
    loginSchema,
    registerSchema,
    googleAuthSchema,
    verifyEmailSchema,
    resendVerificationSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
    changePasswordSchema,
} from "../validators/auth.validator.js";

const authRouter = Router();

authRouter.post("/register", validateBody(registerSchema), container.authController.register);
authRouter.post("/login", validateBody(loginSchema), container.authController.login);
authRouter.post("/google", validateBody(googleAuthSchema), container.authController.googleAuth);
authRouter.post("/verify-email", validateBody(verifyEmailSchema), container.authController.verifyEmail);
authRouter.post("/resend-verification", validateBody(resendVerificationSchema), container.authController.resendVerification);
authRouter.post("/forgot-password", validateBody(forgotPasswordSchema), container.authController.forgotPassword);
authRouter.post("/reset-password", validateBody(resetPasswordSchema), container.authController.resetPassword);
authRouter.put("/change-password", authMiddleware, validateBody(changePasswordSchema), container.authController.changePassword);
authRouter.get("/me", authMiddleware, container.authController.getMe);
authRouter.get("/protected", authMiddleware, (req, res) => {
    res.json({
        success: true,
        message: "Bạn đã đăng nhập",
    });
});

export default authRouter;
