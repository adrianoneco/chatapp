import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { z } from "zod";
import { eq, or, like } from "drizzle-orm";
import { db } from "./db";
import { users } from "@shared/schema";
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

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path.join(process.cwd(), "uploads", "avatars");
      fs.mkdirSync(uploadDir, { recursive: true });
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error("Apenas imagens são permitidas"));
  },
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

  // Serve uploaded avatars statically
  app.use("/uploads", (req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    next();
  });
  app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

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

      res.json({ message: "Se o email existir, você receberá instruções para recuperação", token });
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

      let conditions = [];
      
      if (role) {
        conditions.push(eq(users.role, role));
      }

      if (search) {
        conditions.push(
          or(
            like(users.displayName, `%${search}%`),
            like(users.email, `%${search}%`)
          )
        );
      }

      const allUsers = conditions.length > 0
        ? await db.select().from(users).where(or(...conditions))
        : await db.select().from(users);

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
      const [deleted] = await db.delete(users)
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

  app.post("/api/users/:id/avatar", requireAuth, upload.single("avatar"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Nenhum arquivo enviado" });
      }

      const avatarUrl = `/uploads/avatars/${req.file.filename}`;
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

  return httpServer;
}
