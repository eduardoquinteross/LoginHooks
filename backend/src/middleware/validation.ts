import type { RequestHandler } from "express";
import type { ZodType } from "zod";
import { ApiError } from "./errors";

export function validateBody(schema: ZodType): RequestHandler {
  return (request, _response, next) => {
    const result = schema.safeParse(request.body);

    if (!result.success) {
      next(new ApiError(400, "Los datos enviados no son válidos."));
      return;
    }

    request.body = result.data;
    next();
  };
}
