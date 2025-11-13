import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import authRoutes from "./routes/auth";
import userRoutes from "./routes/user";
import contactsRoutes from "./routes/contacts";

export function registerRoutes(app: Express): Server {
  setupAuth(app);

  app.use("/api", authRoutes);
  app.use("/api", userRoutes);
  app.use("/api", contactsRoutes);

  const httpServer = createServer(app);

  return httpServer;
}
