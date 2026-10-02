import { Router } from "express";
import { getMe, login, register } from "../controllers/auth.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const authRouter = Router();

authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.get("/me", authMiddleware, getMe);
authRouter.get("/protected", authMiddleware, (req, res) => {
    res.json({
        success: true,
        message: "Bạn đã đăng nhập",
    });
});
export default authRouter;
