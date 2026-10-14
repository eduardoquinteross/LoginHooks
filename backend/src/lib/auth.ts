import { randomBytes, timingSafeEqual } from "node:crypto";
import type { CookieOptions, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";

export const authCookieName = "auth_session";
export const csrfCookieName = "csrf_token";
const csrfHeaderName = "x-csrf-token";
const tokenLifetimeMs = 15 * 60 * 1000;

const cookieOptions: CookieOptions = {
  secure: env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/api",
};

export function issueSessionCookie(response: Response, userId: string): void {
  const token = jwt.sign({}, env.JWT_SECRET, {
    algorithm: "HS256",
    subject: userId,
    issuer: "secure-auth-api",
    audience: "secure-auth-web",
    expiresIn: "15m",
  });

  response.cookie(authCookieName, token, {
    ...cookieOptions,
    httpOnly: true,
    maxAge: tokenLifetimeMs,
  });
}

export function clearSessionCookie(response: Response): void {
  response.clearCookie(authCookieName, {
    ...cookieOptions,
    httpOnly: true,
  });
}

export function issueCsrfToken(response: Response): string {
  const token = randomBytes(32).toString("hex");
  response.cookie(csrfCookieName, token, {
    ...cookieOptions,
    httpOnly: false,
    maxAge: tokenLifetimeMs,
  });
  return token;
}

export function isValidCsrfRequest(request: Request): boolean {
  const cookieToken = request.cookies?.[csrfCookieName];
  const headerToken = request.get(csrfHeaderName);

  if (
    typeof cookieToken !== "string" ||
    typeof headerToken !== "string" ||
    cookieToken.length !== headerToken.length
  ) {
    return false;
  }

  return timingSafeEqual(Buffer.from(cookieToken), Buffer.from(headerToken));
}

export function verifySessionToken(token: string): string | null {
  try {
    const payload = jwt.verify(token, env.JWT_SECRET, {
      algorithms: ["HS256"],
      issuer: "secure-auth-api",
      audience: "secure-auth-web",
    });
    return typeof payload === "object" && typeof payload.sub === "string"
      ? payload.sub
      : null;
  } catch {
    return null;
  }
}
