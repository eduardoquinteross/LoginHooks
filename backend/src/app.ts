import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { env } from "./config/env";
import { authRouter } from "./auth/auth.routes";
import { errorHandler, notFoundHandler } from "./middleware/errors";

export const app = express();

app.disable("x-powered-by");
app.use(helmet());
app.use(
  cors({
    origin: env.CLIENT_ORIGIN,
    credentials: true,
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "X-CSRF-Token"],
  }),
);
app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());
app.use("/api/auth", authRouter);
app.use(notFoundHandler);
app.use(errorHandler);
