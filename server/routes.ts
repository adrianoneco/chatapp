import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import { broadcastToAll, initWebSocketServer } from "./websocket";
import { eq, or, like, desc, and, sql, inArray, ne } from "drizzle-orm";
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

const uploadDocument = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path.join(process.cwd(), "data", "documents");
      fs.mkdirSync(uploadDir, { recursive: true });
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
    },
  }),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB for documents
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

  // Initialize WebSocket server on the same HTTP server but separate path
  initWebSocketServer(httpServer);

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

      // Get conversations where user is either client or attendant (excluding deleted)
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
          and(
            eq(conversations.deleted, false),
            userRole === "client"
              ? eq(conversations.clientId, userId)
              : or(eq(conversations.attendantId, userId), eq(conversations.status, "waiting"))
          )
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
        .where(
          and(
            eq(conversations.id, req.params.id),
            eq(conversations.deleted, false)
          )
        );

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

  app.get("/api/conversations/:id/history", requireAuth, async (req, res) => {
    try {
      // Get the current conversation to find the client
      const [currentConversation] = await db
        .select({ clientId: conversations.clientId })
        .from(conversations)
        .where(
          and(
            eq(conversations.id, req.params.id),
            eq(conversations.deleted, false)
          )
        );

      if (!currentConversation) {
        return res.status(404).json({ message: "Conversa não encontrada" });
      }

      // Get all conversations for this client, excluding the current one
      const attendantUser = alias(users, "attendantUser");
      
      const history = await db
        .select({
          conversation: conversations,
          attendant: attendantUser,
        })
        .from(conversations)
        .leftJoin(attendantUser, eq(conversations.attendantId, attendantUser.id))
        .where(
          and(
            eq(conversations.clientId, currentConversation.clientId),
            ne(conversations.id, req.params.id),
            eq(conversations.deleted, false)
          )
        )
        .orderBy(desc(conversations.createdAt))
        .limit(10);

      const formattedHistory = history.map(h => ({
        ...h.conversation,
        attendant: h.attendant ? sanitizeUser(h.attendant) : null,
      }));

      res.json(formattedHistory);
    } catch (error) {
      console.error("Error fetching conversation history:", error);
      res.status(500).json({ message: "Erro ao buscar histórico de conversas" });
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

      broadcastToAll({ type: "conversation:created", conversation });
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

      // Check conversation exists and is not deleted
      const [current] = await db
        .select()
        .from(conversations)
        .where(
          and(
            eq(conversations.id, req.params.id),
            eq(conversations.deleted, false)
          )
        );

      if (!current) {
        return res.status(404).json({ message: "Conversa não encontrada" });
      }

      if (current.status !== "waiting") {
        return res.status(400).json({ message: "Apenas conversas aguardando podem ser assumidas" });
      }

      const [updated] = await db
        .update(conversations)
        .set({ 
          attendantId: user.id,
          status: "active",
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(conversations.id, req.params.id),
            eq(conversations.deleted, false),
            eq(conversations.status, "waiting")
          )
        )
        .returning();

      if (!updated) {
        return res.status(409).json({ message: "Conversa foi alterada por outro usuário" });
      }

      broadcastToAll({ type: "conversation:assigned", conversation: updated });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Erro ao assumir conversa" });
    }
  });

  app.patch("/api/conversations/:id/transfer", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const { attendantId } = req.body;
      
      if (user.role !== "attendant" && user.role !== "admin") {
        return res.status(403).json({ message: "Apenas atendentes podem transferir conversas" });
      }

      if (!attendantId) {
        return res.status(400).json({ message: "ID do atendente é obrigatório" });
      }

      // Verify the target attendant exists and has the right role
      const [targetAttendant] = await db
        .select()
        .from(users)
        .where(eq(users.id, attendantId));

      if (!targetAttendant || (targetAttendant.role !== "attendant" && targetAttendant.role !== "admin")) {
        return res.status(400).json({ message: "Atendente inválido" });
      }

      // Check current conversation
      const [current] = await db
        .select()
        .from(conversations)
        .where(
          and(
            eq(conversations.id, req.params.id),
            eq(conversations.deleted, false)
          )
        );

      if (!current) {
        return res.status(404).json({ message: "Conversa não encontrada" });
      }

      if (current.attendantId === attendantId) {
        return res.status(400).json({ message: "A conversa já está atribuída a este atendente" });
      }

      const [updated] = await db
        .update(conversations)
        .set({ 
          attendantId,
          updatedAt: new Date(),
        })
        .where(eq(conversations.id, req.params.id))
        .returning();

      if (!updated) {
        return res.status(500).json({ message: "Erro ao transferir conversa" });
      }

      broadcastToAll({ type: "conversation:updated", conversation: updated });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Erro ao transferir conversa" });
    }
  });

  app.patch("/api/conversations/:id/start", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      
      if (user.role !== "attendant" && user.role !== "admin") {
        return res.status(403).json({ message: "Apenas atendentes podem iniciar conversas" });
      }

      // Check current conversation status
      const [current] = await db
        .select()
        .from(conversations)
        .where(
          and(
            eq(conversations.id, req.params.id),
            eq(conversations.deleted, false)
          )
        );

      if (!current) {
        return res.status(404).json({ message: "Conversa não encontrada" });
      }

      if (current.status !== "waiting") {
        return res.status(400).json({ message: "Apenas conversas aguardando podem ser iniciadas" });
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
        return res.status(500).json({ message: "Erro ao atualizar conversa" });
      }

      broadcastToAll({ type: "conversation:updated", conversation: updated });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Erro ao iniciar conversa" });
    }
  });

  app.patch("/api/conversations/:id/close", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      
      if (user.role !== "attendant" && user.role !== "admin") {
        return res.status(403).json({ message: "Apenas atendentes podem encerrar conversas" });
      }

      // Check current conversation status
      const [current] = await db
        .select()
        .from(conversations)
        .where(
          and(
            eq(conversations.id, req.params.id),
            eq(conversations.deleted, false)
          )
        );

      if (!current) {
        return res.status(404).json({ message: "Conversa não encontrada" });
      }

      if (current.status !== "active") {
        return res.status(400).json({ message: "Apenas conversas ativas podem ser encerradas" });
      }

      const [updated] = await db
        .update(conversations)
        .set({ 
          status: "closed",
          updatedAt: new Date(),
        })
        .where(eq(conversations.id, req.params.id))
        .returning();

      if (!updated) {
        return res.status(500).json({ message: "Erro ao atualizar conversa" });
      }

      broadcastToAll({ type: "conversation:updated", conversation: updated });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Erro ao encerrar conversa" });
    }
  });

  app.patch("/api/conversations/:id/reopen", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      
      if (user.role !== "attendant" && user.role !== "admin") {
        return res.status(403).json({ message: "Apenas atendentes podem reabrir conversas" });
      }

      // Check current conversation status
      const [current] = await db
        .select()
        .from(conversations)
        .where(
          and(
            eq(conversations.id, req.params.id),
            eq(conversations.deleted, false)
          )
        );

      if (!current) {
        return res.status(404).json({ message: "Conversa não encontrada" });
      }

      if (current.status !== "closed") {
        return res.status(400).json({ message: "Apenas conversas encerradas podem ser reabertas" });
      }

      const [updated] = await db
        .update(conversations)
        .set({ 
          status: "active",
          updatedAt: new Date(),
        })
        .where(eq(conversations.id, req.params.id))
        .returning();

      if (!updated) {
        return res.status(500).json({ message: "Erro ao atualizar conversa" });
      }

      broadcastToAll({ type: "conversation:updated", conversation: updated });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Erro ao reabrir conversa" });
    }
  });

  app.delete("/api/conversations/:id", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      
      if (user.role !== "attendant" && user.role !== "admin") {
        return res.status(403).json({ message: "Apenas atendentes podem deletar conversas" });
      }

      // Check conversation exists and is not already deleted
      const [current] = await db
        .select()
        .from(conversations)
        .where(
          and(
            eq(conversations.id, req.params.id),
            eq(conversations.deleted, false)
          )
        );

      if (!current) {
        return res.status(404).json({ message: "Conversa não encontrada ou já foi deletada" });
      }

      const [updated] = await db
        .update(conversations)
        .set({ 
          deleted: true,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(conversations.id, req.params.id),
            eq(conversations.deleted, false)
          )
        )
        .returning();

      if (!updated) {
        return res.status(409).json({ message: "Conversa foi alterada por outro usuário" });
      }

      broadcastToAll({ type: "conversation:updated", conversation: updated });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Erro ao deletar conversa" });
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
            .where(inArray(messageReactions.messageId, messageIds))
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
      
      // Get the conversation to check permissions
      const [conversation] = await db
        .select()
        .from(conversations)
        .where(eq(conversations.id, req.params.id));

      if (!conversation) {
        return res.status(404).json({ message: "Conversa não encontrada" });
      }

      // Permission check: only admin or assigned attendant can send messages
      const isAssignedAttendant = conversation.attendantId === user.id;
      const isAdmin = user.role === "admin";
      const canSend = isAdmin || isAssignedAttendant;

      if (!canSend) {
        return res.status(403).json({ message: "Apenas o atendente vinculado pode enviar mensagens nesta conversa" });
      }
      
      console.log("[Server] Creating message with data:", {
        type: req.body.type,
        hasMetadata: !!req.body.metadata,
        metadata: req.body.metadata,
        duration: req.body.duration
      });

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

      console.log("[Server] Message created:", {
        id: message.id,
        type: message.type,
        hasMetadata: !!message.metadata,
        metadata: message.metadata,
        duration: message.duration
      });

      // Update conversation timestamp
      await db
        .update(conversations)
        .set({ updatedAt: new Date() })
        .where(eq(conversations.id, req.params.id));

      broadcastToAll({ type: "message:created", message, conversationId: req.params.id });
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

      if (updated.deleted) {
        broadcastToAll({ 
          type: "message:deleted", 
          messageId: req.params.id, 
          conversationId: updated.conversationId 
        });
      } else {
        broadcastToAll({ 
          type: "message:updated", 
          message: updated, 
          conversationId: updated.conversationId 
        });
      }

      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Erro ao atualizar mensagem" });
    }
  });

  app.patch("/api/messages/:id/metadata", requireAuth, async (req, res) => {
    try {
      const { metadata, duration } = req.body;
      
      const updateData: any = {
        updatedAt: new Date(),
      };
      
      if (metadata) {
        updateData.metadata = metadata;
      }
      
      if (duration) {
        updateData.duration = duration;
      }

      const [updated] = await db
        .update(messages)
        .set(updateData)
        .where(eq(messages.id, req.params.id))
        .returning();

      if (!updated) {
        return res.status(404).json({ message: "Mensagem não encontrada" });
      }

      broadcastToAll({ 
        type: "message:updated", 
        message: updated, 
        conversationId: updated.conversationId 
      });

      res.json(updated);
    } catch (error) {
      console.error("Error updating message metadata:", error);
      res.status(500).json({ message: "Erro ao atualizar metadados da mensagem" });
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

      // Get the message to find the conversationId
      const [message] = await db
        .select()
        .from(messages)
        .where(eq(messages.id, req.params.id));

      if (message) {
        broadcastToAll({ 
          type: "reaction:added", 
          reaction, 
          messageId: req.params.id,
          conversationId: message.conversationId 
        });
      }

      res.status(201).json(reaction);
    } catch (error) {
      res.status(500).json({ message: "Erro ao adicionar reação" });
    }
  });

  // AI text correction route (using Groq)
  app.post("/api/messages/correct-text", requireAuth, async (req, res) => {
    try {
      const { correctText } = await import("./groq");
      const correctedText = await correctText(req.body.text);
      res.json({ correctedText });
    } catch (error: any) {
      console.error("Erro ao corrigir texto:", error);
      res.status(500).json({ message: error.message || "Erro ao corrigir texto" });
    }
  });

  // Quick messages route
  app.get("/api/quick-messages", requireAuth, async (req, res) => {
    try {
      // Predefined quick messages in Portuguese
      const quickMessages = [
        { id: "1", text: "Olá! Como posso ajudar você hoje?", category: "saudacao" },
        { id: "2", text: "Entendi sua solicitação. Vou verificar isso para você.", category: "confirmacao" },
        { id: "3", text: "Obrigado por entrar em contato! Retornaremos em breve.", category: "agradecimento" },
        { id: "4", text: "Estou verificando as informações. Aguarde um momento, por favor.", category: "espera" },
        { id: "5", text: "Posso ajudar com mais alguma coisa?", category: "oferta" },
        { id: "6", text: "Fico feliz em ajudar! Tenha um ótimo dia!", category: "despedida" },
        { id: "7", text: "Desculpe pelo inconveniente. Vou resolver isso imediatamente.", category: "desculpa" },
        { id: "8", text: "Sua solicitação foi registrada com sucesso!", category: "confirmacao" },
        { id: "9", text: "Estamos à disposição de segunda a sexta, das 9h às 18h.", category: "horario" },
        { id: "10", text: "Para mais informações, você pode acessar nosso site.", category: "informacao" },
      ];
      res.json({ quickMessages });
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar mensagens prontas" });
    }
  });

  // Media upload routes
  app.post("/api/upload/image", requireAuth, uploadImage.single("image"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Nenhuma imagem fornecida" });
      }
      const url = `/data/images/${req.file.filename}`;
      res.json({ url });
    } catch (error) {
      console.error("Error uploading image:", error);
      res.status(500).json({ message: "Erro ao fazer upload da imagem" });
    }
  });

  app.post("/api/upload/video", requireAuth, uploadVideo.single("video"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Nenhum vídeo fornecido" });
      }
      const url = `/data/videos/${req.file.filename}`;
      res.json({ url });
    } catch (error) {
      console.error("Error uploading video:", error);
      res.status(500).json({ message: "Erro ao fazer upload do vídeo" });
    }
  });

  app.post("/api/upload/audio", requireAuth, uploadAudio.single("audio"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Nenhum áudio fornecido" });
      }
      const url = `/data/audio/${req.file.filename}`;
      res.json({ url });
    } catch (error) {
      console.error("Error uploading audio:", error);
      res.status(500).json({ message: "Erro ao fazer upload do áudio" });
    }
  });

  app.post("/api/upload/document", requireAuth, uploadDocument.single("document"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Nenhum documento fornecido" });
      }
      const url = `/data/documents/${req.file.filename}`;
      res.json({ url });
    } catch (error) {
      console.error("Error uploading document:", error);
      res.status(500).json({ message: "Erro ao fazer upload do documento" });
    }
  });

  return httpServer;
}
