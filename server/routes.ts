import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import authRoutes from "./routes/auth";
import userRoutes from "./routes/user";
import contactsRoutes from "./routes/contacts";
import attendantsRoutes from "./routes/attendants";
import meetingsRoutes from "./routes/meetings";

export function registerRoutes(app: Express): Server {
  setupAuth(app);

  app.use("/api", authRoutes);
  app.use("/api", userRoutes);
  app.use("/api", contactsRoutes);
  app.use("/api", attendantsRoutes);
  app.use("/api", meetingsRoutes);

  const httpServer = createServer(app);

  return httpServer;
}
