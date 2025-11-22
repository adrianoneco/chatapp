import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import type { SafeUser } from "@shared/schema";

if (!process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET environment variable is required");
}

const JWT_SECRET = process.env.SESSION_SECRET;

export interface AuthRequest extends Request {
  user?: SafeUser;
}

export function generateToken(user: SafeUser): string {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

export function verifyToken(token: string): SafeUser | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as SafeUser;
    return decoded;
  } catch (error) {
    return null;
  }
}

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const COOKIE_NAME = process.env.APP_COOKIE_NAME || "token";
  const token = req.cookies?.[COOKIE_NAME];

  if (!token) {
    return res.status(401).json({ message: "Autenticação necessária" });
  }

  const user = verifyToken(token);
  if (!user) {
    return res.status(401).json({ message: "Token inválido ou expirado" });
  }

  req.user = user;
  next();
}

export function requireRole(...allowedRoles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Autenticação necessária" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "Permissão negada" });
    }

    next();
  };
}
