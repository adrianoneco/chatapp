import { Request, Response, NextFunction } from "express";
import type { SafeUser } from "@shared/schema";

// Extend express-session to include our user type
declare module "express-session" {
  interface SessionData {
    userId?: string;
    user?: SafeUser;
  }
}

export interface AuthRequest extends Request {
  user?: SafeUser;
}

// Middleware to check if user is authenticated
export function authenticateUser(req: AuthRequest, res: Response, next: NextFunction) {
  // Debug: log session info
  console.log('[Auth] Session ID:', req.sessionID);
  console.log('[Auth] Session userId:', req.session.userId);
  console.log('[Auth] Cookie:', req.headers.cookie);
  
  if (!req.session.userId || !req.session.user) {
    console.log('[Auth] Authentication failed - no session data');
    return res.status(401).json({ message: "Autenticação necessária" });
  }

  req.user = req.session.user;
  console.log('[Auth] Authenticated as:', req.user.email);
  next();
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
