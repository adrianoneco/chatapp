import { type Request, type Response, type NextFunction } from "express";

declare module "express-session" {
  interface SessionData {
    userId: string;
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Não autenticado" });
  }
  next();
}
