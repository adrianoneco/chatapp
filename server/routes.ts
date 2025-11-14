import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { db } from "./db";
import { triggersEvents } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import authRoutes from "./routes/auth";
import userRoutes from "./routes/user";
import contactsRoutes from "./routes/contacts";
import attendantsRoutes from "./routes/attendants";
import meetingsRoutes from "./routes/meetings";
import aiRoutes from "./routes/ai";
import templatesRoutes from "./routes/templates";
import settingsRoutes from "./routes/settings";
import webhooksRoutes from "./routes/webhooks";
import triggersRoutes from "./routes/triggers";
import conversationExportRoutes from "./routes/conversation-export";
import uploadsRoutes from "./routes/uploads";
import webhookEchoRoutes from "./routes/webhook-echo";
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
  app.use("/api", triggersRoutes);
  app.use("/api", createConversationsRouter(storage));

  app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
  app.use("/api", webhookEchoRoutes);

  const httpServer = createServer(app);

  // Fire-and-forget: ensure default trigger-event registrations exist
  (async () => {
    try {
      const defaultTriggers: Array<{ route: string; event: string; description?: string; groupName?: string }> = [
        { route: "/api/messages", event: "message.created", description: "Mensagem criada", groupName: "Messages" },
        { route: "/api/messages", event: "message.updated", description: "Mensagem atualizada", groupName: "Messages" },
        { route: "/api/conversations", event: "conversation.created", description: "Conversa criada", groupName: "Conversations" },
        { route: "/api/conversations", event: "conversation.updated", description: "Conversa atualizada", groupName: "Conversations" },
        { route: "/api/conversations", event: "conversation.closed", description: "Conversa encerrada", groupName: "Conversations" },
        { route: "/api/calls", event: "call.started", description: "Chamada iniciada", groupName: "Calls" },
        { route: "/api/calls", event: "call.ended", description: "Chamada finalizada", groupName: "Calls" },
      ];

      for (const t of defaultTriggers) {
  const exists = await db.select().from(triggersEvents).where(and(eq(triggersEvents.route, t.route), eq(triggersEvents.event, t.event)));
        if (!exists || exists.length === 0) {
          await db.insert(triggersEvents).values({ route: t.route, event: t.event, description: t.description, groupName: t.groupName });
          console.log(`[triggers] registered trigger for event=${t.event} route=${t.route}`);
        }
      }
    } catch (err) {
      const e = err as any;
      console.error("[triggers] failed to register default triggers:", e?.message || e);
    }
  })();

  return httpServer;
}
