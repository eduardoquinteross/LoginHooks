import type { RequestHandler } from "express";
import { env } from "../config/env";
import { isValidCsrfRequest } from "../lib/auth";
import { ApiError } from "./errors";

export const requireCsrfProtection: RequestHandler = (request, _response, next) => {
  const origin = request.get("origin");

  if (origin !== env.CLIENT_ORIGIN || !isValidCsrfRequest(request)) {
    next(new ApiError(403, "Solicitud no autorizada."));
    return;
  }

  next();
};
