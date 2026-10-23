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

const authRouter = Router();

authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.post("/google", googleAuth);
authRouter.post("/verify-email", verifyEmail);
authRouter.post("/resend-verification", resendVerification);
authRouter.post("/forgot-password", forgotPassword);
authRouter.post("/reset-password", resetPassword);
authRouter.put("/change-password", authMiddleware, changePassword);
authRouter.get("/me", authMiddleware, getMe);
authRouter.get("/protected", authMiddleware, (req, res) => {
    res.json({
        success: true,
        message: "Bạn đã đăng nhập",
    });
});
export default authRouter;
