import express, { type Express } from "express";
import helmet from "helmet";
import cors from "cors";

const app: Express = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
    res.status(200).json({
        success: true,
        message: "Cinema Booking System API is running"
    });
});

export default app;