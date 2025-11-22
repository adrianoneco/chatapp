import type { Express } from "express";
import { createServer, type Server } from "http";
import { pool } from "./database";
import bcrypt from "bcrypt";
import crypto from "crypto";
import multer from "multer";
import path from "path";
import { authenticateToken, requireRole, generateToken, type AuthRequest } from "./middleware/auth";
import { sendPasswordResetEmail } from "./services/email";
import { initializeWebSocket, getWSManager } from "./websocket";
import { correctText, generateQuickMessage } from "./services/groq";
import {
  registerUserSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateUserSchema,
  updatePreferencesSchema,
  insertConversationSchema,
  insertMessageSchema,
  createMessageSchema,
  insertQuickMessageSchema,
  type SafeUser,
  type Conversation,
  type Message,
  type QuickMessage,
} from "@shared/schema";

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const type = (req.query.type as string) || "profiles";
      const destPath = `data/uploads/${type}`;
      cb(null, destPath);
    },
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
    remoteJid: row.remote_jid,
    deleted: row.deleted,
    preferences: row.preferences || {},
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
         RETURNING id, email, name, image, role, deleted, preferences, created_at, updated_at`,
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
        "SELECT id, email, name, image, role, deleted, preferences, created_at, updated_at FROM users WHERE id = $1 AND deleted = false",
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

      let query = "SELECT id, email, name, image, role, deleted, preferences, created_at, updated_at FROM users WHERE deleted = false";
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
         RETURNING id, email, name, image, role, deleted, preferences, created_at, updated_at`,
        [email, passwordHash, name, role || "client", image || null]
      );

      const user = toSafeUser(result.rows[0]);
      
      // Broadcast update via WebSocket
      const wsManager = getWSManager();
      if (wsManager) {
        wsManager.broadcastToAll({
          type: "user_created",
          data: { user, role: user.role }
        });
      }
      
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
        "SELECT id, email, name, image, role, deleted, preferences, created_at, updated_at FROM users WHERE id = $1 AND deleted = false",
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
        `UPDATE users SET ${updates.join(", ")} WHERE id = $${paramCount} AND deleted = false RETURNING id, email, name, image, role, deleted, preferences, created_at, updated_at`,
        values
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      const user = toSafeUser(result.rows[0]);
      
      // Broadcast update via WebSocket
      const wsManager = getWSManager();
      if (wsManager) {
        wsManager.broadcastToAll({
          type: "user_updated",
          data: { user, role: user.role }
        });
      }
      
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
        "UPDATE users SET deleted = true, updated_at = NOW() WHERE id = $1 AND deleted = false RETURNING id, role",
        [req.params.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      // Broadcast update via WebSocket
      const wsManager = getWSManager();
      if (wsManager) {
        wsManager.broadcastToAll({
          type: "user_deleted",
          data: { userId: req.params.id, role: result.rows[0].role }
        });
      }

      res.json({ message: "Usuário excluído com sucesso" });
    } catch (error: any) {
      res.status(500).json({ message: "Erro ao excluir usuário" });
    }
  });

  // UPDATE PREFERENCES
  app.patch("/api/users/preferences", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const data = updatePreferencesSchema.parse(req.body);
      const currentUser = req.user!;

      const result = await pool.query(
        `UPDATE users 
         SET preferences = jsonb_set(COALESCE(preferences, '{}'::jsonb), '{}', $1::jsonb, true),
             updated_at = NOW()
         WHERE id = $2 AND deleted = false 
         RETURNING id, email, name, image, role, deleted, preferences, created_at, updated_at`,
        [JSON.stringify(data), currentUser.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      const user = toSafeUser(result.rows[0]);
      res.json(user);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Erro ao atualizar preferências" });
    }
  });

  // UPLOAD ROUTE
  app.post("/api/upload", authenticateToken, upload.single("file"), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "Nenhum arquivo enviado" });
    }

    const type = (req.query.type as string) || "profiles";
    const url = `/data/uploads/${type}/${req.file.filename}`;
    res.json({ url });
  });

  // API DOCUMENTATION ROUTE
  app.get("/api/docs", async (req: any, res) => {
    const apiKey = req.headers['x-api-key'] as string;
    const hasValidApiKey = apiKey && apiKey === process.env.GLOBAL_API_KEY;
    
    if (!hasValidApiKey) {
      const authReq = req as AuthRequest;
      authenticateToken(authReq, res, () => {
        if (!authReq.user) {
          return res.status(401).json({ 
            message: "Autenticação necessária. Use JWT (usuário autenticado) ou X-API-Key header" 
          });
        }
        sendApiDocs(req, res);
      });
      return;
    }
    
    sendApiDocs(req, res);
  });

  function sendApiDocs(req: any, res: any) {
    const baseUrl = req.protocol + '://' + req.get('host');
    
    const apiDocs = {
      version: "1.0.0",
      baseUrl,
      authentication: {
        description: "A API usa JWT para autenticação de usuários e API Key para acesso à documentação",
        methods: [
          {
            type: "JWT Cookie",
            description: "Token JWT armazenado em httpOnly cookie após login",
            header: "Cookie: token=<jwt>"
          },
          {
            type: "API Key",
            description: "Para acessar esta documentação",
            header: "X-API-Key: <sua-api-key>"
          }
        ]
      },
      endpoints: [
        {
          group: "Autenticação",
          routes: [
            {
              method: "POST",
              path: "/api/auth/register",
              description: "Registrar novo usuário",
              auth: false,
              body: {
                email: "string (email válido)",
                password: "string (mínimo 6 caracteres)",
                name: "string (mínimo 2 caracteres)",
                role: "string (client|attendant|admin) [opcional, padrão: client]"
              },
              responses: {
                "201": {
                  description: "Usuário criado com sucesso",
                  example: {
                    id: "uuid",
                    email: "user@example.com",
                    name: "Nome do Usuário",
                    image: null,
                    role: "client",
                    deleted: false,
                    createdAt: "2024-01-01T00:00:00.000Z",
                    updatedAt: "2024-01-01T00:00:00.000Z"
                  }
                },
                "400": { message: "Email já cadastrado ou dados inválidos" }
              }
            },
            {
              method: "POST",
              path: "/api/auth/login",
              description: "Fazer login (retorna JWT em cookie)",
              auth: false,
              body: {
                email: "string",
                password: "string"
              },
              responses: {
                "200": {
                  description: "Login realizado com sucesso",
                  example: {
                    id: "uuid",
                    email: "user@example.com",
                    name: "Nome",
                    role: "client"
                  }
                },
                "401": { message: "Credenciais inválidas" }
              }
            },
            {
              method: "POST",
              path: "/api/auth/logout",
              description: "Fazer logout (limpa cookie)",
              auth: false,
              responses: {
                "200": { message: "Logout realizado com sucesso" }
              }
            },
            {
              method: "GET",
              path: "/api/auth/me",
              description: "Obter dados do usuário logado",
              auth: true,
              responses: {
                "200": {
                  example: {
                    id: "uuid",
                    email: "user@example.com",
                    name: "Nome",
                    role: "client"
                  }
                },
                "401": { message: "Autenticação necessária" }
              }
            },
            {
              method: "POST",
              path: "/api/auth/forgot-password",
              description: "Solicitar reset de senha via email",
              auth: false,
              body: {
                email: "string"
              },
              responses: {
                "200": { message: "Se o email existir, você receberá instruções" }
              }
            },
            {
              method: "POST",
              path: "/api/auth/reset-password",
              description: "Redefinir senha com token",
              auth: false,
              body: {
                token: "string",
                password: "string (mínimo 6 caracteres)"
              },
              responses: {
                "200": { message: "Senha redefinida com sucesso" },
                "400": { message: "Token inválido ou expirado" }
              }
            }
          ]
        },
        {
          group: "Usuários",
          routes: [
            {
              method: "GET",
              path: "/api/users",
              description: "Listar usuários (filtrar por role)",
              auth: true,
              queryParams: {
                role: "string (client|attendant|admin) [opcional]"
              },
              permissions: "Atendentes só podem ver clientes. Admins veem todos.",
              responses: {
                "200": {
                  description: "Lista de usuários",
                  example: [
                    {
                      id: "uuid",
                      email: "user@example.com",
                      name: "Nome",
                      image: null,
                      role: "client",
                      deleted: false,
                      createdAt: "2024-01-01T00:00:00.000Z",
                      updatedAt: "2024-01-01T00:00:00.000Z"
                    }
                  ]
                },
                "403": { message: "Permissão negada" }
              }
            },
            {
              method: "POST",
              path: "/api/users",
              description: "Criar novo usuário (apenas admin)",
              auth: true,
              permissions: "Apenas administradores",
              body: {
                email: "string",
                password: "string (mínimo 6 caracteres)",
                name: "string",
                role: "string (client|attendant|admin)",
                image: "string [opcional]"
              },
              responses: {
                "201": { description: "Usuário criado" },
                "400": { message: "Email já cadastrado" },
                "403": { message: "Permissão negada" }
              }
            },
            {
              method: "GET",
              path: "/api/users/:id",
              description: "Buscar usuário por ID",
              auth: true,
              permissions: "Atendentes só podem ver clientes",
              responses: {
                "200": { description: "Dados do usuário" },
                "403": { message: "Permissão negada" },
                "404": { message: "Usuário não encontrado" }
              }
            },
            {
              method: "PATCH",
              path: "/api/users/:id",
              description: "Atualizar usuário",
              auth: true,
              permissions: "Admins podem atualizar qualquer usuário. Outros só podem atualizar a si mesmos.",
              body: {
                name: "string [opcional]",
                email: "string [opcional]",
                role: "string (apenas admin) [opcional]",
                image: "string [opcional]"
              },
              responses: {
                "200": { description: "Usuário atualizado" },
                "400": { message: "Email já cadastrado" },
                "403": { message: "Permissão negada" }
              }
            },
            {
              method: "DELETE",
              path: "/api/users/:id",
              description: "Excluir usuário (soft delete - apenas admin)",
              auth: true,
              permissions: "Apenas administradores",
              responses: {
                "200": { message: "Usuário excluído com sucesso" },
                "403": { message: "Permissão negada" },
                "404": { message: "Usuário não encontrado" }
              }
            }
          ]
        },
        {
          group: "Upload",
          routes: [
            {
              method: "POST",
              path: "/api/upload",
              description: "Upload de imagem (máx 5MB)",
              auth: true,
              contentType: "multipart/form-data",
              body: {
                file: "File (jpeg|jpg|png|gif|webp)"
              },
              responses: {
                "200": {
                  example: { url: "/uploads/1234567890-123456789.jpg" }
                },
                "400": { message: "Nenhum arquivo enviado ou tipo inválido" }
              }
            }
          ]
        }
      ]
    };

    res.json(apiDocs);
  }

  // CONVERSATIONS ROUTES
  app.get("/api/conversations", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const currentUser = req.user!;
      const status = req.query.status as string | undefined;

      let query = `
        SELECT c.*, 
          json_build_object('id', client.id, 'email', client.email, 'name', client.name, 'image', client.image, 'role', client.role) as client,
          json_build_object('id', att.id, 'email', att.email, 'name', att.name, 'image', att.image, 'role', att.role) as attendant,
          p.protocol,
          (SELECT content FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message_content
        FROM conversations c
        INNER JOIN users client ON c.client_id = client.id
        LEFT JOIN users att ON c.attendant_id = att.id
        LEFT JOIN protocols p ON p.conversation_id = c.id
        WHERE 1=1
      `;
      const params: any[] = [];

      if (currentUser.role === "client") {
        params.push(currentUser.id);
        query += ` AND c.client_id = $${params.length}`;
      } else if (currentUser.role === "attendant") {
        params.push(currentUser.id);
        query += ` AND (c.attendant_id = $${params.length} OR c.attendant_id IS NULL)`;
      }

      if (status) {
        params.push(status);
        query += ` AND c.status = $${params.length}`;
      }

      query += " ORDER BY c.last_message_at DESC NULLS LAST, c.created_at DESC";

      const result = await pool.query(query, params);
      res.json(result.rows);
    } catch (error: any) {
      console.error("Get conversations error:", error);
      res.status(500).json({ message: "Erro ao buscar conversas" });
    }
  });

  // Get conversation history for a specific client
  app.get("/api/conversations/history/:clientId", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const currentUser = req.user!;
      const { clientId } = req.params;

      // Authorization check: only the client themselves or attendants/admins can view history
      if (currentUser.role === "client" && currentUser.id !== clientId) {
        return res.status(403).json({ message: "Não autorizado a visualizar este histórico" });
      }

      const query = `
        SELECT c.*, 
          json_build_object('id', client.id, 'email', client.email, 'name', client.name, 'image', client.image, 'role', client.role) as client,
          json_build_object('id', att.id, 'email', att.email, 'name', att.name, 'image', att.image, 'role', att.role) as attendant,
          p.protocol
        FROM conversations c
        INNER JOIN users client ON c.client_id = client.id
        LEFT JOIN users att ON c.attendant_id = att.id
        LEFT JOIN protocols p ON p.conversation_id = c.id
        WHERE c.client_id = $1
        ORDER BY c.created_at DESC
        LIMIT 10
      `;

      const result = await pool.query(query, [clientId]);
      res.json(result.rows);
    } catch (error: any) {
      console.error("Get conversation history error:", error);
      res.status(500).json({ message: "Erro ao buscar histórico de conversas" });
    }
  });

  app.get("/api/conversations/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const currentUser = req.user!;

      let query = `
        SELECT c.*, 
          json_build_object('id', client.id, 'email', client.email, 'name', client.name, 'image', client.image, 'role', client.role) as client,
          json_build_object('id', att.id, 'email', att.email, 'name', att.name, 'image', att.image, 'role', att.role) as attendant,
          p.protocol
        FROM conversations c
        INNER JOIN users client ON c.client_id = client.id
        LEFT JOIN users att ON c.attendant_id = att.id
        LEFT JOIN protocols p ON p.conversation_id = c.id
        WHERE c.id = $1
      `;
      const params: any[] = [req.params.id];

      if (currentUser.role === "client") {
        params.push(currentUser.id);
        query += ` AND c.client_id = $${params.length}`;
      } else if (currentUser.role === "attendant") {
        params.push(currentUser.id);
        query += ` AND (c.attendant_id = $${params.length} OR c.attendant_id IS NULL)`;
      }

      const result = await pool.query(query, params);

      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Conversa não encontrada" });
      }

      res.json(result.rows[0]);
    } catch (error: any) {
      console.error("Get conversation error:", error);
      res.status(500).json({ message: "Erro ao buscar conversa" });
    }
  });

  app.post("/api/conversations", authenticateToken, requireRole("admin", "attendant"), async (req: AuthRequest, res) => {
    const client = await pool.connect();
    try {
      const data = insertConversationSchema.parse(req.body);

      await client.query("BEGIN");

      // Create conversation
      const convResult = await client.query(
        `INSERT INTO conversations (client_id, attendant_id, status) 
         VALUES ($1, $2, $3) 
         RETURNING *`,
        [data.clientId, data.attendantId || null, data.status || "pending"]
      );

      const conversation = convResult.rows[0];

      // Generate protocol
      const protocol = Math.random().toString(36).substring(2, 12).toUpperCase();
      await client.query(
        `INSERT INTO protocols (conversation_id, protocol) VALUES ($1, $2)`,
        [conversation.id, protocol]
      );

      await client.query("COMMIT");

      // Fetch full conversation with relations
      const fullConvResult = await client.query(
        `SELECT c.*, 
          json_build_object('id', client.id, 'email', client.email, 'name', client.name, 'image', client.image, 'role', client.role) as client,
          json_build_object('id', att.id, 'email', att.email, 'name', att.name, 'image', att.image, 'role', att.role) as attendant,
          p.protocol
        FROM conversations c
        INNER JOIN users client ON c.client_id = client.id
        LEFT JOIN users att ON c.attendant_id = att.id
        LEFT JOIN protocols p ON p.conversation_id = c.id
        WHERE c.id = $1`,
        [conversation.id]
      );

      const wsManager = getWSManager();
      if (wsManager) {
        wsManager.broadcastToAll({
          type: "conversation_created",
          data: fullConvResult.rows[0]
        });
      }

      res.status(201).json(fullConvResult.rows[0]);
    } catch (error: any) {
      await client.query("ROLLBACK");
      console.error("Create conversation error:", error);
      res.status(400).json({ message: error.message || "Erro ao criar conversa" });
    } finally {
      client.release();
    }
  });

  app.patch("/api/conversations/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const currentUser = req.user!;
      const { status, attendantId } = req.body;

      const updates: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      if (status) {
        updates.push(`status = $${paramCount}`);
        values.push(status);
        paramCount++;
      }

      if (attendantId !== undefined) {
        updates.push(`attendant_id = $${paramCount}`);
        values.push(attendantId);
        paramCount++;
      }

      if (updates.length === 0) {
        return res.status(400).json({ message: "Nenhum dado para atualizar" });
      }

      updates.push("updated_at = NOW()");
      values.push(req.params.id);

      const result = await pool.query(
        `UPDATE conversations SET ${updates.join(", ")} WHERE id = $${paramCount} RETURNING *`,
        values
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Conversa não encontrada" });
      }

      // Fetch full conversation
      const fullConvResult = await pool.query(
        `SELECT c.*, 
          json_build_object('id', client.id, 'email', client.email, 'name', client.name, 'image', client.image, 'role', client.role) as client,
          json_build_object('id', att.id, 'email', att.email, 'name', att.name, 'image', att.image, 'role', att.role) as attendant,
          p.protocol
        FROM conversations c
        INNER JOIN users client ON c.client_id = client.id
        LEFT JOIN users att ON c.attendant_id = att.id
        LEFT JOIN protocols p ON p.conversation_id = c.id
        WHERE c.id = $1`,
        [req.params.id]
      );

      const wsManager = getWSManager();
      if (wsManager) {
        wsManager.broadcastToAll({
          type: "conversation_updated",
          data: fullConvResult.rows[0]
        });
      }

      res.json(fullConvResult.rows[0]);
    } catch (error: any) {
      console.error("Update conversation error:", error);
      res.status(400).json({ message: error.message || "Erro ao atualizar conversa" });
    }
  });

  app.delete("/api/conversations/:id", authenticateToken, requireRole("admin", "attendant"), async (req: AuthRequest, res) => {
    try {
      const result = await pool.query(
        "UPDATE conversations SET deleted = true, updated_at = NOW() WHERE id = $1 RETURNING *",
        [req.params.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Conversa não encontrada" });
      }

      const wsManager = getWSManager();
      if (wsManager) {
        wsManager.broadcastToAll({
          type: "conversation_deleted",
          data: { id: req.params.id }
        });
      }

      res.json({ message: "Conversa excluída com sucesso" });
    } catch (error: any) {
      console.error("Delete conversation error:", error);
      res.status(400).json({ message: error.message || "Erro ao excluir conversa" });
    }
  });

  app.patch("/api/conversations/:id/transfer", authenticateToken, requireRole("admin", "attendant"), async (req: AuthRequest, res) => {
    try {
      const { attendantId } = req.body;

      const result = await pool.query(
        "UPDATE conversations SET attendant_id = $1, updated_at = NOW() WHERE id = $2 RETURNING *",
        [attendantId, req.params.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Conversa não encontrada" });
      }

      const fullConvResult = await pool.query(
        `SELECT c.*, 
          json_build_object('id', client.id, 'email', client.email, 'name', client.name, 'image', client.image, 'role', client.role) as client,
          json_build_object('id', att.id, 'email', att.email, 'name', att.name, 'image', att.image, 'role', att.role) as attendant,
          p.protocol
        FROM conversations c
        INNER JOIN users client ON c.client_id = client.id
        LEFT JOIN users att ON c.attendant_id = att.id
        LEFT JOIN protocols p ON p.conversation_id = c.id
        WHERE c.id = $1`,
        [req.params.id]
      );

      const wsManager = getWSManager();
      if (wsManager) {
        wsManager.broadcastToAll({
          type: "conversation_updated",
          data: fullConvResult.rows[0]
        });
      }

      res.json(fullConvResult.rows[0]);
    } catch (error: any) {
      console.error("Transfer conversation error:", error);
      res.status(400).json({ message: error.message || "Erro ao transferir conversa" });
    }
  });

  app.post("/api/conversations/:id/transcribe", authenticateToken, requireRole("admin", "attendant"), async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;

      const messagesResult = await pool.query(
        `SELECT m.*, u.name as sender_name
        FROM messages m
        INNER JOIN users u ON m.sender_id = u.id
        WHERE m.conversation_id = $1
        ORDER BY m.created_at ASC`,
        [id]
      );

      if (messagesResult.rows.length === 0) {
        return res.status(404).json({ message: "Nenhuma mensagem encontrada para transcrever" });
      }

      const transcript = messagesResult.rows.map((msg: any) => 
        `${msg.sender_name}: ${msg.content}`
      ).join("\n");

      const { summarizeConversation } = await import("./services/groq");
      const summary = await summarizeConversation(transcript);

      res.json({ transcript, summary });
    } catch (error: any) {
      console.error("Transcribe conversation error:", error);
      res.status(400).json({ message: error.message || "Erro ao transcrever conversa" });
    }
  });

  // Helper function to normalize message row from database to camelCase
  function formatMessageRow(row: any) {
    return {
      id: row.id,
      conversationId: row.conversation_id,
      senderId: row.sender_id,
      content: row.content,
      type: row.type,
      quotedMessageId: row.quoted_message_id,
      forwardedFromMessageId: row.forwarded_from_message_id,
      status: row.status,
      reactions: row.reactions || {},
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      sender: row.sender, // Already JSON object from query
      quotedMessage: row.quoted_message, // Already JSON object from query
    };
  }

  // MESSAGES ROUTES
  app.get("/api/conversations/:conversationId/messages", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const currentUser = req.user!;
      const { conversationId } = req.params;

      // Verify access to conversation
      const convCheck = await pool.query(
        "SELECT * FROM conversations WHERE id = $1",
        [conversationId]
      );

      if (convCheck.rows.length === 0) {
        return res.status(404).json({ message: "Conversa não encontrada" });
      }

      const conv = convCheck.rows[0];
      
      if (currentUser.role === "client" && conv.client_id !== currentUser.id) {
        return res.status(403).json({ message: "Permissão negada" });
      }

      if (currentUser.role === "attendant" && conv.attendant_id !== currentUser.id && conv.attendant_id !== null) {
        return res.status(403).json({ message: "Permissão negada" });
      }

      const result = await pool.query(
        `SELECT 
          m.id,
          m.conversation_id,
          m.sender_id,
          m.content,
          m.type,
          m.quoted_message_id,
          m.forwarded_from_message_id,
          m.status,
          m.reactions,
          m.created_at,
          m.updated_at,
          json_build_object('id', u.id, 'email', u.email, 'name', u.name, 'image', u.image, 'role', u.role) as sender,
          CASE 
            WHEN m.quoted_message_id IS NOT NULL THEN 
              json_build_object(
                'id', qm.id, 
                'content', qm.content,
                'createdAt', qm.created_at,
                'sender', json_build_object('id', qu.id, 'name', qu.name, 'image', qu.image)
              )
            ELSE NULL
          END as quoted_message
        FROM messages m
        INNER JOIN users u ON m.sender_id = u.id
        LEFT JOIN messages qm ON m.quoted_message_id = qm.id
        LEFT JOIN users qu ON qm.sender_id = qu.id
        WHERE m.conversation_id = $1
        ORDER BY m.created_at ASC`,
        [conversationId]
      );

      // Transform snake_case to camelCase for frontend
      const messages = result.rows.map(formatMessageRow);

      res.json(messages);
    } catch (error: any) {
      console.error("Get messages error:", error);
      res.status(500).json({ message: "Erro ao buscar mensagens" });
    }
  });

  app.post("/api/conversations/:conversationId/messages", authenticateToken, async (req: AuthRequest, res) => {
    const client = await pool.connect();
    try {
      const currentUser = req.user!;
      const { conversationId } = req.params;
      const data = createMessageSchema.parse(req.body);

      await client.query("BEGIN");

      // Verify access to conversation
      const convResult = await client.query(
        "SELECT * FROM conversations WHERE id = $1",
        [conversationId]
      );

      if (convResult.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({ message: "Conversa não encontrada" });
      }

      const conv = convResult.rows[0];

      // Insert message
      const msgResult = await client.query(
        `INSERT INTO messages (conversation_id, sender_id, content, type, quoted_message_id, forwarded_from_message_id) 
         VALUES ($1, $2, $3, $4, $5, $6) 
         RETURNING *`,
        [conversationId, currentUser.id, data.content, data.type || "text", data.quotedMessageId || null, data.forwardedFromMessageId || null]
      );

      // Update conversation last message timestamp
      await client.query(
        "UPDATE conversations SET last_message_at = NOW(), updated_at = NOW() WHERE id = $1",
        [conversationId]
      );

      await client.query("COMMIT");

      const message = msgResult.rows[0];

      // Fetch full message with sender and quoted message
      const fullMsgResult = await client.query(
        `SELECT 
          m.id,
          m.conversation_id,
          m.sender_id,
          m.content,
          m.type,
          m.quoted_message_id,
          m.forwarded_from_message_id,
          m.status,
          m.reactions,
          m.created_at,
          m.updated_at,
          json_build_object('id', u.id, 'email', u.email, 'name', u.name, 'image', u.image, 'role', u.role) as sender,
          CASE 
            WHEN m.quoted_message_id IS NOT NULL THEN 
              json_build_object(
                'id', qm.id, 
                'content', qm.content,
                'createdAt', qm.created_at,
                'sender', json_build_object('id', qu.id, 'name', qu.name, 'image', qu.image)
              )
            ELSE NULL
          END as quoted_message
        FROM messages m
        INNER JOIN users u ON m.sender_id = u.id
        LEFT JOIN messages qm ON m.quoted_message_id = qm.id
        LEFT JOIN users qu ON qm.sender_id = qu.id
        WHERE m.id = $1`,
        [message.id]
      );

      const normalizedMessage = formatMessageRow(fullMsgResult.rows[0]);

      const wsManager = getWSManager();
      if (wsManager) {
        wsManager.broadcastToAll({
          type: "message_created",
          data: normalizedMessage
        });
      }

      res.status(201).json(normalizedMessage);
    } catch (error: any) {
      await client.query("ROLLBACK");
      console.error("Create message error:", error);
      res.status(400).json({ message: error.message || "Erro ao criar mensagem" });
    } finally {
      client.release();
    }
  });

  // DELETE MESSAGE ROUTE
  app.delete("/api/conversations/:conversationId/messages/:messageId", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const currentUser = req.user!;
      const { messageId } = req.params;

      // Get message to verify ownership
      const msgResult = await pool.query(
        "SELECT * FROM messages WHERE id = $1",
        [messageId]
      );

      if (msgResult.rows.length === 0) {
        return res.status(404).json({ message: "Mensagem não encontrada" });
      }

      const message = msgResult.rows[0];

      // Only the sender can delete their message
      if (message.sender_id !== currentUser.id && currentUser.role !== "admin") {
        return res.status(403).json({ message: "Permissão negada" });
      }

      // Update message status to deleted
      await pool.query(
        "UPDATE messages SET status = 'deleted', updated_at = NOW() WHERE id = $1",
        [messageId]
      );

      const wsManager = getWSManager();
      if (wsManager) {
        wsManager.broadcastToAll({
          type: "message_deleted",
          data: { id: messageId, conversationId: req.params.conversationId }
        });
      }

      res.json({ message: "Mensagem excluída com sucesso" });
    } catch (error: any) {
      console.error("Delete message error:", error);
      res.status(500).json({ message: "Erro ao excluir mensagem" });
    }
  });

  // ADD REACTION TO MESSAGE ROUTE
  app.post("/api/conversations/:conversationId/messages/:messageId/react", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const currentUser = req.user!;
      const { messageId } = req.params;
      const { emoji } = req.body;

      if (!emoji || typeof emoji !== "string") {
        return res.status(400).json({ message: "Emoji é obrigatório" });
      }

      // Get current message
      const msgResult = await pool.query(
        "SELECT reactions FROM messages WHERE id = $1",
        [messageId]
      );

      if (msgResult.rows.length === 0) {
        return res.status(404).json({ message: "Mensagem não encontrada" });
      }

      const currentReactions = msgResult.rows[0].reactions || {};
      
      // Toggle reaction: if user already reacted with this emoji, remove it; otherwise, add it
      if (!currentReactions[emoji]) {
        currentReactions[emoji] = [];
      }

      const userIndex = currentReactions[emoji].indexOf(currentUser.id);
      if (userIndex > -1) {
        // Remove reaction
        currentReactions[emoji].splice(userIndex, 1);
        if (currentReactions[emoji].length === 0) {
          delete currentReactions[emoji];
        }
      } else {
        // Add reaction
        currentReactions[emoji].push(currentUser.id);
      }

      // Update message
      await pool.query(
        "UPDATE messages SET reactions = $1, updated_at = NOW() WHERE id = $2",
        [JSON.stringify(currentReactions), messageId]
      );

      const wsManager = getWSManager();
      if (wsManager) {
        wsManager.broadcastToAll({
          type: "message_reacted",
          data: { id: messageId, conversationId: req.params.conversationId, reactions: currentReactions }
        });
      }

      res.json({ reactions: currentReactions });
    } catch (error: any) {
      console.error("React to message error:", error);
      res.status(500).json({ message: "Erro ao reagir à mensagem" });
    }
  });

  // QUICK MESSAGES ROUTES
  app.get("/api/quick-messages", authenticateToken, requireRole("admin", "attendant"), async (req: AuthRequest, res) => {
    try {
      const result = await pool.query(
        `SELECT qm.*,
          json_build_object('id', u.id, 'email', u.email, 'name', u.name, 'image', u.image) as created_by_user
        FROM quick_messages qm
        INNER JOIN users u ON qm.created_by = u.id
        ORDER BY qm.created_at DESC`
      );

      res.json(result.rows);
    } catch (error: any) {
      console.error("Get quick messages error:", error);
      res.status(500).json({ message: "Erro ao buscar mensagens prontas" });
    }
  });

  app.post("/api/quick-messages", authenticateToken, requireRole("admin", "attendant"), async (req: AuthRequest, res) => {
    try {
      const currentUser = req.user!;
      const data = insertQuickMessageSchema.parse(req.body);

      const result = await pool.query(
        `INSERT INTO quick_messages (title, content, icon, parameters, created_by) 
         VALUES ($1, $2, $3, $4, $5) 
         RETURNING *`,
        [data.title, data.content, data.icon || "MessageCircle", data.parameters || [], currentUser.id]
      );

      const quickMessage = result.rows[0];

      const wsManager = getWSManager();
      if (wsManager) {
        wsManager.broadcastToAll({
          type: "quick_message_created",
          data: quickMessage
        });
      }

      res.status(201).json(quickMessage);
    } catch (error: any) {
      console.error("Create quick message error:", error);
      res.status(400).json({ message: error.message || "Erro ao criar mensagem pronta" });
    }
  });

  app.patch("/api/quick-messages/:id", authenticateToken, requireRole("admin", "attendant"), async (req: AuthRequest, res) => {
    try {
      const { title, content, icon, parameters } = req.body;

      const updates: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      if (title) {
        updates.push(`title = $${paramCount}`);
        values.push(title);
        paramCount++;
      }

      if (content) {
        updates.push(`content = $${paramCount}`);
        values.push(content);
        paramCount++;
      }

      if (icon) {
        updates.push(`icon = $${paramCount}`);
        values.push(icon);
        paramCount++;
      }

      if (parameters !== undefined) {
        updates.push(`parameters = $${paramCount}`);
        values.push(parameters);
        paramCount++;
      }

      if (updates.length === 0) {
        return res.status(400).json({ message: "Nenhum dado para atualizar" });
      }

      updates.push("updated_at = NOW()");
      values.push(req.params.id);

      const result = await pool.query(
        `UPDATE quick_messages SET ${updates.join(", ")} WHERE id = $${paramCount} RETURNING *`,
        values
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Mensagem pronta não encontrada" });
      }

      const wsManager = getWSManager();
      if (wsManager) {
        wsManager.broadcastToAll({
          type: "quick_message_updated",
          data: result.rows[0]
        });
      }

      res.json(result.rows[0]);
    } catch (error: any) {
      console.error("Update quick message error:", error);
      res.status(400).json({ message: error.message || "Erro ao atualizar mensagem pronta" });
    }
  });

  app.delete("/api/quick-messages/:id", authenticateToken, requireRole("admin", "attendant"), async (req: AuthRequest, res) => {
    try {
      const result = await pool.query(
        "DELETE FROM quick_messages WHERE id = $1 RETURNING id",
        [req.params.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Mensagem pronta não encontrada" });
      }

      const wsManager = getWSManager();
      if (wsManager) {
        wsManager.broadcastToAll({
          type: "quick_message_deleted",
          data: { id: req.params.id }
        });
      }

      res.json({ message: "Mensagem pronta excluída com sucesso" });
    } catch (error: any) {
      console.error("Delete quick message error:", error);
      res.status(500).json({ message: "Erro ao excluir mensagem pronta" });
    }
  });

  // AI ROUTES
  app.post("/api/ai/correct-text", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { text } = req.body;

      if (!text || typeof text !== "string") {
        return res.status(400).json({ message: "Texto é obrigatório" });
      }

      const correctedText = await correctText(text);
      res.json({ correctedText });
    } catch (error: any) {
      console.error("Correct text error:", error);
      res.status(500).json({ message: error.message || "Erro ao corrigir texto" });
    }
  });

  app.post("/api/ai/generate-message", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { prompt, parameters } = req.body;

      if (!prompt || typeof prompt !== "string") {
        return res.status(400).json({ message: "Prompt é obrigatório" });
      }

      if (!parameters || typeof parameters !== "object") {
        return res.status(400).json({ message: "Parâmetros são obrigatórios" });
      }

      const generatedMessage = await generateQuickMessage(prompt, parameters);
      res.json({ generatedMessage });
    } catch (error: any) {
      console.error("Generate message error:", error);
      res.status(500).json({ message: error.message || "Erro ao gerar mensagem" });
    }
  });

  const httpServer = createServer(app);
  
  // Initialize WebSocket server
  initializeWebSocket(httpServer);
  
  return httpServer;
}
