import bcrypt from "bcryptjs";
import type { RequestHandler } from "express";
import { Prisma } from "@prisma/client";
import { randomBytes } from "node:crypto";
import { prisma } from "../lib/prisma";
import {
  clearSessionCookie,
  issueCsrfToken,
  issueSessionCookie,
  verifySessionToken,
} from "../lib/auth";
import { ApiError } from "../middleware/errors";
import type { LoginInput, RegisterInput } from "./auth.schemas";

const bcryptCost = 12;
const dummyPasswordHash = bcrypt.hashSync(randomBytes(32).toString("hex"), bcryptCost);

export const getCsrfToken: RequestHandler = (_request, response) => {
  response.json({ csrfToken: issueCsrfToken(response) });
};

export const register: RequestHandler = async (request, response) => {
  const { email, password } = request.body as RegisterInput;
  const passwordHash = await bcrypt.hash(password, bcryptCost);

  try {
    const user = await prisma.user.create({
      data: { email, passwordHash },
      select: { id: true, email: true, createdAt: true },
    });

    issueSessionCookie(response, user.id);
    response.status(201).json({ user });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new ApiError(409, "Ya existe una cuenta con ese correo electrónico.");
    }

    throw error;
  }
};

export const login: RequestHandler = async (request, response) => {
  const { email, password } = request.body as LoginInput;
  const user = await prisma.user.findUnique({ where: { email } });
  const passwordIsValid = await bcrypt.compare(
    password,
    user?.passwordHash ?? dummyPasswordHash,
  );

  if (!user || !passwordIsValid) {
    throw new ApiError(401, "Correo electrónico o contraseña incorrectos.");
  }

  issueSessionCookie(response, user.id);
  response.json({
    user: { id: user.id, email: user.email, createdAt: user.createdAt },
  });
};

export const getCurrentUser: RequestHandler = async (request, response) => {
  const token = request.cookies?.auth_session;
  const userId = typeof token === "string" ? verifySessionToken(token) : null;

  if (!userId) {
    throw new ApiError(401, "La sesión no es válida o ha caducado.");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, createdAt: true },
  });

  if (!user) {
    throw new ApiError(401, "La sesión no es válida o ha caducado.");
  }

  response.json({ user });
};

export const logout: RequestHandler = (_request, response) => {
  clearSessionCookie(response);
  response.status(204).end();
};
