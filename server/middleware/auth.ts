import { Request, Response, NextFunction } from "express";
import type { SafeUser } from "@shared/schema";
import { verifyToken } from "../lib/jwt";

export interface AuthRequest extends Request {
  user?: SafeUser;
}

// Middleware to check if user is authenticated using JWT access token.
export function authenticateUser(req: AuthRequest, res: Response, next: NextFunction) {
  const cookies = req.cookies || {};
  const accessName = process.env.ACCESS_COOKIE_NAME || "chatapp_access";
  const token = cookies[accessName] || (() => {
    const auth = req.headers.authorization;
    if (!auth) return undefined;
    const m = auth.match(/^Bearer (.+)$/);
    return m ? m[1] : undefined;
  })();

  if (!token) return res.status(401).json({ message: "Autenticação necessária" });

  try {
    const decoded = verifyToken<{ id: string; email?: string; role?: string }>(token as string);
    req.user = { id: decoded.id, email: decoded.email || "", name: "", image: undefined, role: decoded.role || "client", remoteJid: undefined, deleted: false, preferences: {}, createdAt: new Date(), updatedAt: new Date() } as SafeUser;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Token inválido" });
  }
}

// Middleware to require specific roles
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
