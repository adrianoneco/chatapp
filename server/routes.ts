import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import authRoutes from "./routes/auth";
import userRoutes from "./routes/user";
import contactsRoutes from "./routes/contacts";
import attendantsRoutes from "./routes/attendants";
import meetingsRoutes from "./routes/meetings";
import aiRoutes from "./routes/ai";
import templatesRoutes from "./routes/templates";
import settingsRoutes from "./routes/settings";
import webhooksRoutes from "./routes/webhooks";
import conversationExportRoutes from "./routes/conversation-export";
import uploadsRoutes from "./routes/uploads";
import { createConversationsRouter } from "./routes/conversations";
import express from "express";
import path from "path";

export function registerRoutes(app: Express): Server {
  setupAuth(app);

  app.use("/api", authRoutes);
  app.use("/api", userRoutes);
  app.use("/api", contactsRoutes);
  app.use("/api", attendantsRoutes);
  app.use("/api", meetingsRoutes);
  app.use("/api", aiRoutes);
  app.use("/api", templatesRoutes);
  app.use("/api", settingsRoutes);
  app.use("/api", conversationExportRoutes);
  app.use("/api/uploads", uploadsRoutes);
  app.use("/webhooks", webhooksRoutes);
  app.use("/api", createConversationsRouter(storage));

  app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

  const httpServer = createServer(app);

  return httpServer;
}
