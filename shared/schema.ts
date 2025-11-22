import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, integer, uuid, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User preferences type
export type UserPreferences = {
  sidebarCollapsed?: boolean;
  theme?: 'light' | 'dark' | 'system';
  conversationSidebarWidth?: number; // Width in pixels for conversation sidebar
};

// Users table with roles and soft delete
export const users = pgTable("users", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  image: text("image"),
  role: text("role").notNull().default("client"), // client, attendant, admin
  remoteJid: text("remote_jid"), // WhatsApp number/ID
  deleted: boolean("deleted").notNull().default(false),
  preferences: jsonb("preferences").$type<UserPreferences>().notNull().default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Password reset tokens table
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => users.id),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Insert schemas for validation
export const insertUserSchema = createInsertSchema(users, {
  email: z.string().email("Email inválido"),
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  role: z.enum(["client", "attendant", "admin"]),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const registerUserSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  role: z.enum(["client", "attendant", "admin"]).optional().default("client"),
});

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Senha é obrigatória"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Email inválido"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token é obrigatório"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
});

export const updateUserSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").optional(),
  email: z.string().email("Email inválido").optional(),
  role: z.enum(["client", "attendant", "admin"]).optional(),
  image: z.string().optional(),
  remoteJid: z.string().optional(),
});

export const updatePreferencesSchema = z.object({
  sidebarCollapsed: z.boolean().optional(),
  theme: z.enum(['light', 'dark', 'system']).optional(),
  conversationSidebarWidth: z.number().min(200).max(600).optional(),
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type RegisterUser = z.infer<typeof registerUserSchema>;
export type LoginUser = z.infer<typeof loginSchema>;
export type ForgotPassword = z.infer<typeof forgotPasswordSchema>;
export type ResetPassword = z.infer<typeof resetPasswordSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;
export type UpdatePreferences = z.infer<typeof updatePreferencesSchema>;
export type User = typeof users.$inferSelect;
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;

// User without sensitive data
export type SafeUser = Omit<User, "passwordHash">;

// Conversations table
export const conversations = pgTable("conversations", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: uuid("client_id").notNull().references(() => users.id),
  attendantId: uuid("attendant_id").references(() => users.id),
  status: text("status").notNull().default("pending"), // pending, attending, closed
  deleted: boolean("deleted").notNull().default(false),
  lastMessageAt: timestamp("last_message_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Protocols table - manages conversation protocols
export const protocols = pgTable("protocols", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: uuid("conversation_id").notNull().unique().references(() => conversations.id),
  protocol: varchar("protocol", { length: 10 }).notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Messages table
export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: uuid("conversation_id").notNull().references(() => conversations.id),
  senderId: uuid("sender_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  type: text("type").notNull().default("text"), // text, image, file, etc
  read: boolean("read").notNull().default(false),
  quotedMessageId: uuid("quoted_message_id"), // For replies - self-referencing
  forwardedFromMessageId: uuid("forwarded_from_message_id"), // For forwards - self-referencing
  status: text("status").notNull().default("sent"), // sent, deleted, edited
  reactions: jsonb("reactions").$type<Record<string, string[]>>().default(sql`'{}'::jsonb`), // emoji -> [userId1, userId2]
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Insert schemas
export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProtocolSchema = createInsertSchema(protocols).omit({
  id: true,
  createdAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

// Schema for creating messages via API (conversationId and senderId come from route params and auth)
export const createMessageSchema = z.object({
  content: z.string().min(1, "Conteúdo é obrigatório"),
  type: z.string().default("text"),
  quotedMessageId: z.string().uuid().optional(),
  forwardedFromMessageId: z.string().uuid().optional(),
});

// Quick Messages table - predefined messages with parameters
export const quickMessages = pgTable("quick_messages", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  content: text("content").notNull(),
  icon: text("icon").notNull().default("MessageCircle"),
  parameters: text("parameters").array().notNull().default(sql`ARRAY[]::text[]`),
  createdBy: uuid("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Insert schemas
export const insertQuickMessageSchema = createInsertSchema(quickMessages, {
  title: z.string().min(1, "Título é obrigatório"),
  content: z.string().min(1, "Conteúdo é obrigatório"),
  icon: z.string().min(1, "Ícone é obrigatório"),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// General Settings table
export const generalSettings = pgTable("general_settings", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  companyName: text("company_name").notNull().default(""),
  companyEmail: text("company_email").notNull().default(""),
  companyPhone: text("company_phone"),
  welcomeMessage: text("welcome_message"),
  awayMessage: text("away_message"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// API Keys table
export const apiKeys = pgTable("api_keys", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  key: text("key").notNull().unique(),
  jwtToken: text("jwt_token").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Webhooks table
export const webhooks = pgTable("webhooks", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  url: text("url").notNull(),
  apiKey: text("api_key").notNull(),
  events: text("events").array().notNull().default(sql`ARRAY[]::text[]`),
  headers: jsonb("headers").$type<Record<string, string>>().default(sql`'{}'::jsonb`),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Insert schemas
export const insertGeneralSettingsSchema = createInsertSchema(generalSettings, {
  companyName: z.string().min(1, "Nome da empresa é obrigatório"),
  companyEmail: z.string().email("Email inválido"),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWebhookSchema = createInsertSchema(webhooks, {
  name: z.string().min(1, "Nome é obrigatório"),
  url: z.string().url("URL inválida"),
  events: z.array(z.string()).min(1, "Selecione pelo menos um evento"),
}).omit({
  id: true,
  apiKey: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type Conversation = typeof conversations.$inferSelect;
export type Protocol = typeof protocols.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type QuickMessage = typeof quickMessages.$inferSelect;
export type GeneralSettings = typeof generalSettings.$inferSelect;
export type ApiKey = typeof apiKeys.$inferSelect;
export type Webhook = typeof webhooks.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type InsertProtocol = z.infer<typeof insertProtocolSchema>;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type CreateMessage = z.infer<typeof createMessageSchema>;
export type InsertQuickMessage = z.infer<typeof insertQuickMessageSchema>;
export type InsertGeneralSettings = z.infer<typeof insertGeneralSettingsSchema>;
export type InsertWebhook = z.infer<typeof insertWebhookSchema>;
