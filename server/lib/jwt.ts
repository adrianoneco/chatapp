import jwt from "jsonwebtoken";
import type { SafeUser } from "@shared/schema";

if (!process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET environment variable is required");
}

const JWT_SECRET = process.env.SESSION_SECRET;

export function signAccessToken(user: SafeUser) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET as string,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRES || "15m" },
  );
}

export function signRefreshToken(user: SafeUser) {
  return jwt.sign(
    { id: user.id },
    JWT_SECRET as string,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRES || "7d" },
  );
}

export function verifyToken<T = any>(token: string): T {
  return jwt.verify(token, JWT_SECRET as string) as T;
}

export function cookieOptions() {
  // If a CORS origin is configured, prefer `None` so the browser will
  // send cookies on cross-site requests. This is safe because in
  // production you should set SESSION_COOKIE_SECURE=true and use HTTPS.
  const inferredSameSite = process.env.CORS_ORIGIN ? "none" : "lax";
  const sameSite = (process.env.SESSION_COOKIE_SAMESITE || inferredSameSite) as any;
  const domain = process.env.SESSION_COOKIE_DOMAIN || undefined;
  const secure = typeof process.env.SESSION_COOKIE_SECURE !== "undefined"
    ? process.env.SESSION_COOKIE_SECURE === "true"
    : undefined;
  // Browsers require `Secure` when `SameSite=None`. If Secure isn't enabled
  // (likely local HTTP dev), downgrade to `lax` to avoid the cookie being
  // silently rejected by the browser.
  const finalSameSite = sameSite === "none" && !secure ? "lax" : sameSite;
  const maxAge = parseInt(process.env.SESSION_COOKIE_MAXAGE || String(7 * 24 * 60 * 60 * 1000), 10);
  return { sameSite: finalSameSite, domain, secure, maxAge } as const;
}
