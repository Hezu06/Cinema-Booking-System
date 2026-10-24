import { Router } from "express";
import {
    getMe,
    login,
    register,
    googleAuth,
    verifyEmail,
    resendVerification,
    forgotPassword,
    resetPassword,
    changePassword,
} from "../controllers/auth.controller.js";
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

authRouter.post("/register", validateBody(registerSchema), register);
authRouter.post("/login", validateBody(loginSchema), login);
authRouter.post("/google", validateBody(googleAuthSchema), googleAuth);
authRouter.post("/verify-email", validateBody(verifyEmailSchema), verifyEmail);
authRouter.post("/resend-verification", validateBody(resendVerificationSchema), resendVerification);
authRouter.post("/forgot-password", validateBody(forgotPasswordSchema), forgotPassword);
authRouter.post("/reset-password", validateBody(resetPasswordSchema), resetPassword);
authRouter.put("/change-password", authMiddleware, validateBody(changePasswordSchema), changePassword);
authRouter.get("/me", authMiddleware, getMe);
authRouter.get("/protected", authMiddleware, (req, res) => {
    res.json({
        success: true,
        message: "Bạn đã đăng nhập",
    });
});

export default authRouter;
