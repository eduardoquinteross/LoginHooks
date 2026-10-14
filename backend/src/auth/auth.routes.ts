import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import {
  getCsrfToken,
  getCurrentUser,
  login,
  logout,
  register,
} from "./auth.controller";
import { loginSchema, registerSchema } from "./auth.schemas";
import { requireCsrfProtection } from "../middleware/csrf";
import { validateBody } from "../middleware/validation";

export const authRouter = Router();

const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Demasiados intentos. Inténtalo de nuevo más tarde." },
});

authRouter.get("/csrf", getCsrfToken);
authRouter.post(
  "/register",
  authRateLimit,
  requireCsrfProtection,
  validateBody(registerSchema),
  register,
);
authRouter.post(
  "/login",
  authRateLimit,
  requireCsrfProtection,
  validateBody(loginSchema),
  login,
);
authRouter.get("/me", getCurrentUser);
authRouter.post("/logout", requireCsrfProtection, logout);
