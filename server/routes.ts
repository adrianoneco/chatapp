import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { z } from "zod";
import { eq, or, like, desc, and, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "./db";
import { users, conversations, messages, messageReactions } from "@shared/schema";
import {
  createUser,
  getUserByEmail,
  getUserById,
  sanitizeUser,
  verifyPassword,
  updatePasswordResetToken,
  resetPassword,
} from "./auth";
import { requireAuth } from "./middleware";
import { randomBytes } from "crypto";
import multer from "multer";
import path from "path";
import fs from "fs";

type WSMessage = 
  | { type: "user:created"; user: any }
  | { type: "user:updated"; user: any }
  | { type: "user:deleted"; id: string }
  | { type: "avatar:updated"; user: any };

const imageFilter = (req: any, file: any, cb: any) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  if (extname && mimetype) {
    return cb(null, true);
  }
  cb(new Error("Apenas imagens são permitidas"));
};

const uploadAvatar = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path.join(process.cwd(), "data", "avatars");
      fs.mkdirSync(uploadDir, { recursive: true });
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: imageFilter,
});

const uploadImage = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path.join(process.cwd(), "data", "images");
      fs.mkdirSync(uploadDir, { recursive: true });
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
});

const uploadVideo = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path.join(process.cwd(), "data", "videos");
      fs.mkdirSync(uploadDir, { recursive: true });
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
    },
  }),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB for videos
});

const uploadAudio = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path.join(process.cwd(), "data", "audio");
      fs.mkdirSync(uploadDir, { recursive: true });
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
    },
  }),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB for audio
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  displayName: z.string().min(2),
  role: z.enum(["client", "attendant", "admin"]).optional(),
});

const recoverRequestSchema = z.object({
  email: z.string().email(),
});

const recoverConfirmSchema = z.object({
  token: z.string(),
  password: z.string().min(6),
});

const updateUserSchema = z.object({
  displayName: z.string().min(2).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  role: z.enum(["client", "attendant", "admin"]).optional(),
});

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // WebSocket setup
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

  function broadcastToAll(message: WSMessage) {
    const payload = JSON.stringify(message);
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    });
  }

  wss.on("connection", (ws) => {
    ws.on("error", console.error);
  });

  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const data = registerSchema.parse(req.body);
      const existingUser = await getUserByEmail(data.email);
      
      if (existingUser) {
        return res.status(400).json({ message: "Email já cadastrado" });
      }

      const user = await createUser(
        data.email,
        data.password,
        data.displayName,
        data.role || "client"
      );

      req.session.userId = user.id;
      broadcastToAll({ type: "user:created", user });
      res.json({ user });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      console.error("[ERROR] Failed to create user:", error);
      res.status(500).json({ message: "Erro ao criar usuário" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const data = loginSchema.parse(req.body);
      const user = await getUserByEmail(data.email);

      if (!user || !(await verifyPassword(user.passwordHash, data.password))) {
        return res.status(401).json({ message: "Email ou senha inválidos" });
      }

      req.session.userId = user.id;
      res.json({ user: sanitizeUser(user) });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos" });
      }
      res.status(500).json({ message: "Erro ao fazer login" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Erro ao fazer logout" });
      }
      res.clearCookie("connect.sid");
      res.json({ message: "Logout realizado com sucesso" });
    });
  });

  app.get("/api/auth/me", requireAuth, async (req, res) => {
    try {
      const user = await getUserById(req.session.userId!);
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      res.json({ user: sanitizeUser(user) });
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar usuário" });
    }
  });

  app.post("/api/auth/recover/request", async (req, res) => {
    try {
      const { email } = recoverRequestSchema.parse(req.body);
      const user = await getUserByEmail(email);

      if (!user) {
        return res.json({ message: "Se o email existir, você receberá instruções para recuperação" });
      }

      const token = randomBytes(32).toString("hex");
      const expires = new Date(Date.now() + 3600000); // 1 hour

      await updatePasswordResetToken(email, token, expires);

      // TODO: Integrar com serviço de email para enviar token de forma segura
      // Exemplo: await emailService.sendPasswordResetEmail(email, token);

      res.json({ message: "Se o email existir, você receberá instruções para recuperação" });
    } catch (error) {
      res.status(500).json({ message: "Erro ao solicitar recuperação" });
    }
  });

  app.post("/api/auth/recover/confirm", async (req, res) => {
    try {
      const data = recoverConfirmSchema.parse(req.body);
      const success = await resetPassword(data.token, data.password);

      if (!success) {
        return res.status(400).json({ message: "Token inválido ou expirado" });
      }

      res.json({ message: "Senha redefinida com sucesso" });
    } catch (error) {
      res.status(500).json({ message: "Erro ao redefinir senha" });
    }
  });

  // Users routes
  app.get("/api/users", requireAuth, async (req, res) => {
    try {
      const role = req.query.role as "client" | "attendant" | "admin" | undefined;
      const search = req.query.search as string | undefined;

      let conditions = [eq(users.deleted, false)];
      
      if (role) {
        conditions.push(eq(users.role, role));
      }

      if (search) {
        const searchCondition = or(
          like(users.displayName, `%${search}%`),
          like(users.email, `%${search}%`)
        );
        if (searchCondition) {
          conditions.push(searchCondition);
        }
      }

      const allUsers = await db.select().from(users).where(and(...conditions));

      res.json({ users: allUsers.map(sanitizeUser) });
    } catch (error) {
      res.status(500).json({ message: "Erro ao listar usuários" });
    }
  });

  app.get("/api/users/:id", requireAuth, async (req, res) => {
    try {
      const user = await getUserById(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      res.json({ user: sanitizeUser(user) });
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar usuário" });
    }
  });

  app.patch("/api/users/:id", requireAuth, async (req, res) => {
    try {
      const data = updateUserSchema.parse(req.body);
      const [updated] = await db.update(users)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(users.id, req.params.id))
        .returning();

      if (!updated) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      const sanitized = sanitizeUser(updated);
      broadcastToAll({ type: "user:updated", user: sanitized });
      res.json({ user: sanitized });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos" });
      }
      res.status(500).json({ message: "Erro ao atualizar usuário" });
    }
  });

  app.delete("/api/users/:id", requireAuth, async (req, res) => {
    try {
      const [deleted] = await db.update(users)
        .set({ deleted: true, updatedAt: new Date() })
        .where(eq(users.id, req.params.id))
        .returning();

      if (!deleted) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      broadcastToAll({ type: "user:deleted", id: req.params.id });
      res.json({ message: "Usuário excluído com sucesso" });
    } catch (error) {
      res.status(500).json({ message: "Erro ao excluir usuário" });
    }
  });

  app.post("/api/users/:id/avatar", requireAuth, uploadAvatar.single("avatar"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Nenhum arquivo enviado" });
      }

      const avatarUrl = `/data/avatars/${req.file.filename}`;
      const [updated] = await db.update(users)
        .set({ avatarUrl, updatedAt: new Date() })
        .where(eq(users.id, req.params.id))
        .returning();

      if (!updated) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      const sanitized = sanitizeUser(updated);
      broadcastToAll({ type: "avatar:updated", user: sanitized });
      res.json({ user: sanitized, avatarUrl });
    } catch (error) {
      res.status(500).json({ message: "Erro ao fazer upload do avatar" });
    }
  });

  // Conversations routes
  app.get("/api/conversations", requireAuth, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const userRole = (req.user as any).role;

      // Create aliases for multiple joins on users table
      const clientUser = alias(users, "clientUser");
      const attendantUser = alias(users, "attendantUser");

      // Get conversations where user is either client or attendant
      const userConversations = await db
        .select({
          conversation: conversations,
          client: clientUser,
          attendant: attendantUser,
        })
        .from(conversations)
        .leftJoin(clientUser, eq(conversations.clientId, clientUser.id))
        .leftJoin(attendantUser, eq(conversations.attendantId, attendantUser.id))
        .where(
          userRole === "client"
            ? eq(conversations.clientId, userId)
            : or(eq(conversations.attendantId, userId), eq(conversations.status, "waiting"))
        )
        .orderBy(desc(conversations.updatedAt));

      // Get last message for each conversation
      const conversationsWithLastMessage = await Promise.all(
        userConversations.map(async ({ conversation, client, attendant }) => {
          const [lastMessage] = await db
            .select()
            .from(messages)
            .where(eq(messages.conversationId, conversation.id))
            .orderBy(desc(messages.createdAt))
            .limit(1);

          // Count unread messages (simplified - messages after user's last read)
          const unreadCount = 0; // TODO: implement proper read tracking

          return {
            ...conversation,
            client: client ? sanitizeUser(client) : null,
            attendant: attendant ? sanitizeUser(attendant) : null,
            lastMessage,
            unreadCount,
          };
        })
      );

      res.json(conversationsWithLastMessage);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ message: "Erro ao buscar conversas" });
    }
  });

  app.get("/api/conversations/:id", requireAuth, async (req, res) => {
    try {
      // Create aliases for multiple joins on users table
      const clientUser = alias(users, "clientUser");
      const attendantUser = alias(users, "attendantUser");

      const [conversation] = await db
        .select({
          conversation: conversations,
          client: clientUser,
          attendant: attendantUser,
        })
        .from(conversations)
        .leftJoin(clientUser, eq(conversations.clientId, clientUser.id))
        .leftJoin(attendantUser, eq(conversations.attendantId, attendantUser.id))
        .where(eq(conversations.id, req.params.id));

      if (!conversation) {
        return res.status(404).json({ message: "Conversa não encontrada" });
      }

      res.json({
        ...conversation.conversation,
        client: conversation.client ? sanitizeUser(conversation.client) : null,
        attendant: conversation.attendant ? sanitizeUser(conversation.attendant) : null,
      });
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar conversa" });
    }
  });

  app.post("/api/conversations", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const protocol = `WEB-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;
      
      const [conversation] = await db
        .insert(conversations)
        .values({
          protocol,
          channel: "webchat",
          clientId: user.role === "client" ? user.id : req.body.clientId,
          attendantId: user.role === "attendant" ? user.id : null,
          status: "waiting",
          clientIp: req.ip,
          clientLocation: req.body.clientLocation || null,
        })
        .returning();

      res.status(201).json(conversation);
    } catch (error) {
      console.error("Error creating conversation:", error);
      res.status(500).json({ message: "Erro ao criar conversa" });
    }
  });

  app.patch("/api/conversations/:id/assign", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      
      if (user.role !== "attendant" && user.role !== "admin") {
        return res.status(403).json({ message: "Apenas atendentes podem assumir conversas" });
      }

      const [updated] = await db
        .update(conversations)
        .set({ 
          attendantId: user.id,
          status: "active",
          updatedAt: new Date(),
        })
        .where(eq(conversations.id, req.params.id))
        .returning();

      if (!updated) {
        return res.status(404).json({ message: "Conversa não encontrada" });
      }

      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Erro ao assumir conversa" });
    }
  });

  // Messages routes
  app.get("/api/conversations/:id/messages", requireAuth, async (req, res) => {
    try {
      const conversationMessages = await db
        .select()
        .from(messages)
        .leftJoin(users, eq(messages.senderId, users.id))
        .where(eq(messages.conversationId, req.params.id))
        .orderBy(messages.createdAt);

      // Get reactions for all messages
      const messageIds = conversationMessages.map(m => m.messages.id);
      const reactions = messageIds.length > 0
        ? await db
            .select({
              messageId: messageReactions.messageId,
              emoji: messageReactions.emoji,
              count: sql<number>`count(*)::int`,
            })
            .from(messageReactions)
            .where(sql`${messageReactions.messageId} = ANY(${messageIds})`)
            .groupBy(messageReactions.messageId, messageReactions.emoji)
        : [];

      const messagesWithReactions = conversationMessages.map(({ messages: message, users: sender }) => ({
        ...message,
        sender: sender ? sanitizeUser(sender) : null,
        reactions: reactions
          .filter(r => r.messageId === message.id)
          .map(r => ({ emoji: r.emoji, count: r.count })),
      }));

      res.json(messagesWithReactions);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Erro ao buscar mensagens" });
    }
  });

  app.post("/api/conversations/:id/messages", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      
      const [message] = await db
        .insert(messages)
        .values({
          conversationId: req.params.id,
          senderId: user.id,
          content: req.body.content,
          type: req.body.type || "text",
          mediaUrl: req.body.mediaUrl || null,
          duration: req.body.duration || null,
          caption: req.body.caption || null,
          recorded: req.body.recorded || false,
          forwarded: req.body.forwarded || false,
          replyToId: req.body.replyToId || null,
          metadata: req.body.metadata || null,
        })
        .returning();

      // Update conversation timestamp
      await db
        .update(conversations)
        .set({ updatedAt: new Date() })
        .where(eq(conversations.id, req.params.id));

      res.status(201).json(message);
    } catch (error) {
      console.error("Error creating message:", error);
      res.status(500).json({ message: "Erro ao enviar mensagem" });
    }
  });

  app.patch("/api/messages/:id", requireAuth, async (req, res) => {
    try {
      const [updated] = await db
        .update(messages)
        .set({ 
          deleted: req.body.deleted || false,
          updatedAt: new Date(),
        })
        .where(eq(messages.id, req.params.id))
        .returning();

      if (!updated) {
        return res.status(404).json({ message: "Mensagem não encontrada" });
      }

      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Erro ao atualizar mensagem" });
    }
  });

  app.post("/api/messages/:id/reactions", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      
      const [reaction] = await db
        .insert(messageReactions)
        .values({
          messageId: req.params.id,
          userId: user.id,
          emoji: req.body.emoji,
        })
        .returning();

      res.status(201).json(reaction);
    } catch (error) {
      res.status(500).json({ message: "Erro ao adicionar reação" });
    }
  });

  return httpServer;
}
