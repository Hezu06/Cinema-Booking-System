import { Router } from "express";
import { container } from "../../config/container.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { validateBody } from "../middlewares/validate.middleware.js";
import {
  authLimiter,
  emailLimiter,
} from "../middlewares/rate-limit.middleware.js";
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

authRouter.post(
  "/register",
  authLimiter,
  validateBody(registerSchema),
  container.authController.register,
);
authRouter.post(
  "/login",
  authLimiter,
  validateBody(loginSchema),
  container.authController.login,
);
authRouter.post(
  "/google",
  authLimiter,
  validateBody(googleAuthSchema),
  container.authController.googleAuth,
);
authRouter.post(
  "/verify-email",
  validateBody(verifyEmailSchema),
  container.authController.verifyEmail,
);
authRouter.post(
  "/resend-verification",
  emailLimiter,
  validateBody(resendVerificationSchema),
  container.authController.resendVerification,
);
authRouter.post(
  "/forgot-password",
  authLimiter,
  validateBody(forgotPasswordSchema),
  container.authController.forgotPassword,
);
authRouter.post(
  "/reset-password",
  authLimiter,
  validateBody(resetPasswordSchema),
  container.authController.resetPassword,
);
authRouter.put(
  "/change-password",
  authMiddleware,
  validateBody(changePasswordSchema),
  container.authController.changePassword,
);
authRouter.get("/me", authMiddleware, container.authController.getMe);
authRouter.get("/protected", authMiddleware, (_req, res) => {
  res.json({
    success: true,
    message: "Bạn đã đăng nhập",
  });
});

export default authRouter;
