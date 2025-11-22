import type { Express } from "express";
import { createServer, type Server } from "http";
import { pool } from "./database";
import bcrypt from "bcrypt";
import crypto from "crypto";
import multer from "multer";
import path from "path";
import { authenticateToken, requireRole, generateToken, type AuthRequest } from "./middleware/auth";
import { sendPasswordResetEmail } from "./services/email";
import {
  registerUserSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateUserSchema,
  type SafeUser,
} from "@shared/schema";

const upload = multer({
  storage: multer.diskStorage({
    destination: "uploads/",
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error("Apenas imagens são permitidas"));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Helper to convert DB row to SafeUser
  const toSafeUser = (row: any): SafeUser => ({
    id: row.id,
    email: row.email,
    name: row.name,
    image: row.image,
    role: row.role,
    deleted: row.deleted,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });

  // AUTH ROUTES
  app.post("/api/auth/register", async (req, res) => {
    try {
      const data = registerUserSchema.parse(req.body);
      const passwordHash = await bcrypt.hash(data.password, 10);

      const result = await pool.query(
        `INSERT INTO users (email, password_hash, name, role) 
         VALUES ($1, $2, $3, $4) 
         RETURNING id, email, name, image, role, deleted, created_at, updated_at`,
        [data.email, passwordHash, data.name, data.role || "client"]
      );

      const user = toSafeUser(result.rows[0]);
      res.status(201).json(user);
    } catch (error: any) {
      if (error.code === "23505") {
        return res.status(400).json({ message: "Email já cadastrado" });
      }
      res.status(400).json({ message: error.message || "Erro ao registrar usuário" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const data = loginSchema.parse(req.body);

      const result = await pool.query(
        "SELECT * FROM users WHERE email = $1 AND deleted = false",
        [data.email]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({ message: "Credenciais inválidas" });
      }

      const user = result.rows[0];
      const passwordMatch = await bcrypt.compare(data.password, user.password_hash);

      if (!passwordMatch) {
        return res.status(401).json({ message: "Credenciais inválidas" });
      }

      const safeUser = toSafeUser(user);
      const token = generateToken(safeUser);

      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.json(safeUser);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Erro ao fazer login" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    res.clearCookie("token");
    res.json({ message: "Logout realizado com sucesso" });
  });

  app.get("/api/auth/me", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const result = await pool.query(
        "SELECT id, email, name, image, role, deleted, created_at, updated_at FROM users WHERE id = $1 AND deleted = false",
        [req.user!.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      const safeUser = toSafeUser(result.rows[0]);
      res.json(safeUser);
    } catch (error: any) {
      res.status(500).json({ message: "Erro ao buscar usuário" });
    }
  });

  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const data = forgotPasswordSchema.parse(req.body);

      const result = await pool.query(
        "SELECT * FROM users WHERE email = $1 AND deleted = false",
        [data.email]
      );

      if (result.rows.length === 0) {
        // Don't reveal if email exists
        return res.json({ message: "Se o email existir, você receberá instruções" });
      }

      const user = result.rows[0];
      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await pool.query(
        `INSERT INTO password_reset_tokens (user_id, token, expires_at) 
         VALUES ($1, $2, $3)`,
        [user.id, token, expiresAt]
      );

      await sendPasswordResetEmail(data.email, token);

      res.json({ message: "Se o email existir, você receberá instruções" });
    } catch (error: any) {
      console.error("Forgot password error:", error);
      res.status(500).json({ message: "Erro ao processar solicitação" });
    }
  });

  app.post("/api/auth/reset-password", async (req, res) => {
    const client = await pool.connect();
    
    try {
      const data = resetPasswordSchema.parse(req.body);

      // Check if token exists, is not used, and has not expired
      const tokenResult = await client.query(
        `SELECT * FROM password_reset_tokens 
         WHERE token = $1 AND used = false AND expires_at > NOW()`,
        [data.token]
      );

      if (tokenResult.rows.length === 0) {
        return res.status(400).json({ message: "Token inválido ou expirado" });
      }

      const resetToken = tokenResult.rows[0];

      // Verify the user still exists
      const userResult = await client.query(
        "SELECT id FROM users WHERE id = $1 AND deleted = false",
        [resetToken.user_id]
      );

      if (userResult.rows.length === 0) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      const passwordHash = await bcrypt.hash(data.password, 10);

      await client.query("BEGIN");

      // Update password
      await client.query(
        "UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2",
        [passwordHash, resetToken.user_id]
      );

      // Mark token as used
      await client.query(
        "UPDATE password_reset_tokens SET used = true WHERE id = $1",
        [resetToken.id]
      );

      // Invalidate all other tokens for this user
      await client.query(
        "UPDATE password_reset_tokens SET used = true WHERE user_id = $1 AND id != $2",
        [resetToken.user_id, resetToken.id]
      );

      await client.query("COMMIT");

      res.json({ message: "Senha redefinida com sucesso" });
    } catch (error: any) {
      await client.query("ROLLBACK");
      console.error("Reset password error:", error);
      res.status(400).json({ message: error.message || "Erro ao redefinir senha" });
    } finally {
      client.release();
    }
  });

  // USER ROUTES
  app.get("/api/users", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const role = req.query.role as string | undefined;
      const currentUser = req.user!;

      // Attendants can only see clients
      if (currentUser.role === "attendant" && role !== "client") {
        return res.status(403).json({ message: "Permissão negada" });
      }

      // Attendants can only see clients, admins can see all
      if (currentUser.role === "attendant" && !role) {
        return res.status(403).json({ message: "Permissão negada" });
      }

      let query = "SELECT id, email, name, image, role, deleted, created_at, updated_at FROM users WHERE deleted = false";
      const params: any[] = [];

      if (role) {
        params.push(role);
        query += ` AND role = $${params.length}`;
      }

      query += " ORDER BY created_at DESC";

      const result = await pool.query(query, params);
      const users = result.rows.map(toSafeUser);

      res.json(users);
    } catch (error: any) {
      res.status(500).json({ message: "Erro ao buscar usuários" });
    }
  });

  app.post("/api/users", authenticateToken, requireRole("admin"), async (req: AuthRequest, res) => {
    try {
      const { name, email, role, image, password } = req.body;

      if (!password || password.length < 6) {
        return res.status(400).json({ message: "Senha é obrigatória e deve ter pelo menos 6 caracteres" });
      }

      const passwordHash = await bcrypt.hash(password, 10);

      const result = await pool.query(
        `INSERT INTO users (email, password_hash, name, role, image) 
         VALUES ($1, $2, $3, $4, $5) 
         RETURNING id, email, name, image, role, deleted, created_at, updated_at`,
        [email, passwordHash, name, role || "client", image || null]
      );

      const user = toSafeUser(result.rows[0]);
      res.status(201).json(user);
    } catch (error: any) {
      if (error.code === "23505") {
        return res.status(400).json({ message: "Email já cadastrado" });
      }
      res.status(400).json({ message: error.message || "Erro ao criar usuário" });
    }
  });

  app.get("/api/users/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const currentUser = req.user!;

      const result = await pool.query(
        "SELECT id, email, name, image, role, deleted, created_at, updated_at FROM users WHERE id = $1 AND deleted = false",
        [req.params.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      const user = result.rows[0];

      // Attendants can only view clients
      if (currentUser.role === "attendant" && user.role !== "client") {
        return res.status(403).json({ message: "Permissão negada" });
      }

      const safeUser = toSafeUser(user);
      res.json(safeUser);
    } catch (error: any) {
      res.status(500).json({ message: "Erro ao buscar usuário" });
    }
  });

  app.patch("/api/users/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const data = updateUserSchema.parse(req.body);
      const currentUser = req.user!;

      // Only admins can update other users
      if (currentUser.role !== "admin" && currentUser.id !== req.params.id) {
        return res.status(403).json({ message: "Permissão negada" });
      }

      const updates: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      if (data.name) {
        updates.push(`name = $${paramCount}`);
        values.push(data.name);
        paramCount++;
      }

      if (data.email) {
        updates.push(`email = $${paramCount}`);
        values.push(data.email);
        paramCount++;
      }

      if (data.role && currentUser.role === "admin") {
        updates.push(`role = $${paramCount}`);
        values.push(data.role);
        paramCount++;
      }

      if (data.image !== undefined) {
        updates.push(`image = $${paramCount}`);
        values.push(data.image);
        paramCount++;
      }

      if (updates.length === 0) {
        return res.status(400).json({ message: "Nenhum dado para atualizar" });
      }

      updates.push("updated_at = NOW()");
      values.push(req.params.id);

      const result = await pool.query(
        `UPDATE users SET ${updates.join(", ")} WHERE id = $${paramCount} AND deleted = false RETURNING id, email, name, image, role, deleted, created_at, updated_at`,
        values
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      const user = toSafeUser(result.rows[0]);
      res.json(user);
    } catch (error: any) {
      if (error.code === "23505") {
        return res.status(400).json({ message: "Email já cadastrado" });
      }
      res.status(400).json({ message: error.message || "Erro ao atualizar usuário" });
    }
  });

  app.delete("/api/users/:id", authenticateToken, requireRole("admin"), async (req: AuthRequest, res) => {
    try {
      const result = await pool.query(
        "UPDATE users SET deleted = true, updated_at = NOW() WHERE id = $1 AND deleted = false RETURNING id",
        [req.params.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      res.json({ message: "Usuário excluído com sucesso" });
    } catch (error: any) {
      res.status(500).json({ message: "Erro ao excluir usuário" });
    }
  });

  // UPLOAD ROUTE
  app.post("/api/upload", authenticateToken, upload.single("file"), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "Nenhum arquivo enviado" });
    }

    const url = `/uploads/${req.file.filename}`;
    res.json({ url });
  });

  const httpServer = createServer(app);
  return httpServer;
}
