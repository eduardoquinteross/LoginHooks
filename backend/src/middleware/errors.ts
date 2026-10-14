import type { ErrorRequestHandler, RequestHandler } from "express";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export const notFoundHandler: RequestHandler = (_request, response) => {
  response.status(404).json({ error: "Ruta no encontrada." });
};

export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  if (error instanceof ApiError) {
    response.status(error.status).json({ error: error.message });
    return;
  }

  if (
    error instanceof SyntaxError &&
    "status" in error &&
    error.status === 400
  ) {
    response.status(400).json({ error: "El cuerpo JSON de la solicitud no es válido." });
    return;
  }

  console.error("Error interno de la API:", error);
  response.status(500).json({ error: "Error interno del servidor." });
};
