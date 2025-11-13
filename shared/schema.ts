import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, foreignKey, jsonb, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable(
  "users",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    name: text("name").notNull(),
    email: text("email").unique(),
    username: text("username").unique(),
    password: text("password"),
    role: text("role", { enum: ["client", "admin", "attendant"] }).notNull().default("client"),
    phone: text("phone"),
    notes: text("notes"),
    avatarUrl: text("avatar_url"),
    isOnline: boolean("is_online").notNull().default(false),
    lastSeenAt: timestamp("last_seen_at"),
    createdBy: varchar("created_by"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    createdByFk: foreignKey({
      columns: [table.createdBy],
      foreignColumns: [table.id],
    }).onDelete("set null"),
  })
);

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = insertUserSchema.extend({
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export const registerApiSchema = insertUserSchema;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type PublicUser = Omit<User, 'password'>;
export type LoginData = z.infer<typeof loginSchema>;
export type RegisterData = z.infer<typeof registerSchema>;

export const contacts = pgTable("contacts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  notes: text("notes"),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
});

export const insertContactSchema = createInsertSchema(contacts).omit({
  id: true,
});

export type InsertContact = z.infer<typeof insertContactSchema>;
export type Contact = typeof contacts.$inferSelect;

export const insertClientSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.union([z.string().email("Email inválido"), z.literal("")]).optional(),
  username: z.union([z.string().min(3, "Username mínimo 3 caracteres"), z.literal("")]).optional(),
  password: z.union([z.string().min(6, "Senha mínima 6 caracteres"), z.literal("")]).optional(),
  phone: z.string().optional(),
  notes: z.string().optional(),
  avatarUrl: z.string().optional(),
});

export const updateClientSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").optional(),
  email: z.union([z.string().email("Email inválido"), z.literal("")]).optional(),
  username: z.union([z.string().min(3, "Username mínimo 3 caracteres"), z.literal("")]).optional(),
  password: z.union([
    z.string().min(6, "Senha mínima 6 caracteres"),
    z.literal(""),
  ]).optional(),
  phone: z.string().optional(),
  notes: z.string().optional(),
  avatarUrl: z.string().optional(),
});

export type InsertClient = z.infer<typeof insertClientSchema>;
export type UpdateClient = z.infer<typeof updateClientSchema>;

export const insertAttendantSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido"),
  username: z.string().min(3, "Username mínimo 3 caracteres"),
  password: z.string().min(6, "Senha mínima 6 caracteres"),
  phone: z.string().optional(),
  notes: z.string().optional(),
  avatarUrl: z.string().optional(),
});

export const updateAttendantSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  email: z.string().email("Invalid email").optional(),
  username: z.string().min(3, "Username must be at least 3 characters").optional(),
  password: z.union([
    z.string().min(6, "Password must be at least 6 characters"),
    z.literal(""),
  ]).optional(),
  phone: z.string().optional(),
  notes: z.string().optional(),
  avatarUrl: z.string().optional(),
});

export type InsertAttendant = z.infer<typeof insertAttendantSchema>;
export type UpdateAttendant = z.infer<typeof updateAttendantSchema>;

export const meetings = pgTable("meetings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  scheduledAt: timestamp("scheduled_at").notNull(),
  isPublic: boolean("is_public").notNull().default(false),
  linkId: varchar("link_id", { length: 21 }).notNull().unique(),
  status: text("status", { enum: ["scheduled", "live", "ended", "cancelled"] }).notNull().default("scheduled"),
  notes: text("notes"),
  participants: jsonb("participants").$type<Array<{ userId: string; joinedAt: string; leftAt?: string }>>().default(sql`'[]'::jsonb`),
  mentionedParticipants: jsonb("mentioned_participants").$type<Array<string>>().default(sql`'[]'::jsonb`),
  chatMessages: jsonb("chat_messages").$type<Array<{ userId: string; text: string; timestamp: string }>>().default(sql`'[]'::jsonb`),
  createdBy: varchar("created_by").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertMeetingSchema = createInsertSchema(meetings).omit({
  id: true,
  linkId: true,
  createdBy: true,
  createdAt: true,
}).extend({
  scheduledAt: z.string().min(1, "Data e hora são obrigatórias"),
});

export const updateMeetingSchema = z.object({
  title: z.string().min(1, "Título é obrigatório").optional(),
  scheduledAt: z.string().min(1, "Data e hora são obrigatórias").optional(),
  isPublic: z.boolean().optional(),
});

export type InsertMeeting = z.infer<typeof insertMeetingSchema>;
export type UpdateMeeting = z.infer<typeof updateMeetingSchema>;
export type Meeting = typeof meetings.$inferSelect;

export const channels = pgTable("channels", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  slug: text("slug").notNull().unique(),
  provider: text("provider", { enum: ["web", "whatsapp", "telegram", "instagram"] }).notNull(),
  name: text("name").notNull(),
  config: jsonb("config").$type<Record<string, any>>(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const channelConnections = pgTable("channel_connections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  channelId: varchar("channel_id").notNull().references(() => channels.id, { onDelete: "cascade" }),
  instanceId: text("instance_id").notNull().unique(),
  apiKey: text("api_key"),
  webhookSecret: text("webhook_secret"),
  status: text("status", { enum: ["connected", "disconnected", "error"] }).notNull().default("disconnected"),
  metadata: jsonb("metadata").$type<Record<string, any>>(),
  lastSyncAt: timestamp("last_sync_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const conversations = pgTable("conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  channelId: varchar("channel_id").notNull().references(() => channels.id, { onDelete: "cascade" }),
  customerContactId: varchar("customer_contact_id").references(() => users.id, { onDelete: "set null" }),
  externalContactId: text("external_contact_id"),
  protocol: text("protocol"),
  createdBy: varchar("created_by").references(() => users.id, { onDelete: "set null" }),
  assignedTo: varchar("assigned_to").references(() => users.id, { onDelete: "set null" }),
  status: text("status", { enum: ["open", "pending", "resolved", "closed"] }).notNull().default("open"),
  lastMessageAt: timestamp("last_message_at"),
  metadata: jsonb("metadata").$type<Record<string, any>>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  uniqueChannelExternal: uniqueIndex("conversations_channel_external_unique").on(table.channelId, table.externalContactId),
}));

export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  senderType: text("sender_type", { enum: ["user", "customer", "system"] }).notNull(),
  senderId: varchar("sender_id").references(() => users.id, { onDelete: "set null" }),
  direction: text("direction", { enum: ["inbound", "outbound"] }).notNull(),
  content: jsonb("content").$type<{ text?: string; mediaUrl?: string; caption?: string }>().notNull(),
  messageType: text("message_type", { enum: ["text", "image", "audio", "video", "file", "system"] }).notNull().default("text"),
  externalId: text("external_id"),
  replyToId: varchar("reply_to_id"),
  forwardedFromId: varchar("forwarded_from_id"),
  reactions: jsonb("reactions").$type<Array<{ userId: string; emoji: string }>>().default(sql`'[]'::jsonb`),
  isPrivate: boolean("is_private").notNull().default(false),
  deliveredAt: timestamp("delivered_at"),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  uniqueExternalId: uniqueIndex("messages_external_id_unique").on(table.externalId),
}));

export const insertChannelSchema = createInsertSchema(channels).omit({
  id: true,
  createdAt: true,
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
  lastMessageAt: true,
  createdBy: true,
});

export const updateConversationSchema = z.object({
  assignedTo: z.string().uuid().nullable().optional(),
  status: z.enum(["open", "pending", "resolved", "closed"]).optional(),
  metadata: z.record(z.any()).optional(),
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
  deliveredAt: true,
  readAt: true,
  reactions: true,
}).extend({
  content: z.object({
    text: z.string().optional(),
    mediaUrl: z.string().url().optional(),
    caption: z.string().optional(),
  }),
  replyToId: z.string().uuid().optional(),
  forwardedFromId: z.string().uuid().optional(),
  isPrivate: z.boolean().optional().default(false),
});

export const insertChannelConnectionSchema = createInsertSchema(channelConnections).omit({
  id: true,
  createdAt: true,
  lastSyncAt: true,
});

export type Channel = typeof channels.$inferSelect;
export type InsertChannel = z.infer<typeof insertChannelSchema>;

export type ChannelConnection = typeof channelConnections.$inferSelect;
export type InsertChannelConnection = z.infer<typeof insertChannelConnectionSchema>;

export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type UpdateConversation = z.infer<typeof updateConversationSchema>;

export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

export const responseTemplates = pgTable("response_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  content: text("content").notNull(),
  category: text("category").default("geral"),
  createdBy: varchar("created_by").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertResponseTemplateSchema = createInsertSchema(responseTemplates).omit({
  id: true,
  createdBy: true,
  createdAt: true,
});

export const updateResponseTemplateSchema = z.object({
  title: z.string().min(1, "Título é obrigatório").optional(),
  content: z.string().min(1, "Conteúdo é obrigatório").optional(),
  category: z.string().optional(),
});

export type ResponseTemplate = typeof responseTemplates.$inferSelect;
export type InsertResponseTemplate = z.infer<typeof insertResponseTemplateSchema>;
export type UpdateResponseTemplate = z.infer<typeof updateResponseTemplateSchema>;

// AI Templates
export const aiTemplates = pgTable("ai_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  content: text("content").notNull(),
  parameters: jsonb("parameters").$type<string[]>().default(sql`'[]'::jsonb`),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdBy: varchar("created_by").references(() => users.id, { onDelete: "set null" }),
});

export const insertAITemplateSchema = createInsertSchema(aiTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type AITemplate = typeof aiTemplates.$inferSelect;
export type InsertAITemplate = z.infer<typeof insertAITemplateSchema>;

// Webhooks
export const webhooks = pgTable("webhooks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  targetUrl: text("target_url").notNull(),
  authType: text("auth_type", { enum: ["none", "bearer", "api_key", "basic"] }).notNull().default("none"),
  authPayload: jsonb("auth_payload").$type<{ token?: string; key?: string; username?: string; password?: string }>(),
  events: jsonb("events").$type<string[]>().default(sql`'[]'::jsonb`),
  headers: jsonb("headers").$type<Record<string, string>>().default(sql`'{}'::jsonb`),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdBy: varchar("created_by").references(() => users.id, { onDelete: "set null" }),
});

export const insertWebhookSchema = createInsertSchema(webhooks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  createdBy: true,
});

export type Webhook = typeof webhooks.$inferSelect;
export type InsertWebhook = z.infer<typeof insertWebhookSchema>;

// Evolution API Instances
export const evolutionInstances = pgTable("evolution_instances", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  label: text("label").notNull(),
  baseUrl: text("base_url").notNull(),
  apiKey: text("api_key").notNull(),
  instanceId: text("instance_id").notNull(),
  channelId: varchar("channel_id").references(() => channels.id, { onDelete: "set null" }),
  status: text("status", { enum: ["connected", "disconnected", "pending"] }).notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertEvolutionInstanceSchema = createInsertSchema(evolutionInstances).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type EvolutionInstance = typeof evolutionInstances.$inferSelect;
export type InsertEvolutionInstance = z.infer<typeof insertEvolutionInstanceSchema>;

export const calls = pgTable("calls", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").references(() => conversations.id, { onDelete: "cascade" }),
  meetingId: varchar("meeting_id").references(() => meetings.id, { onDelete: "cascade" }),
  type: text("type", { enum: ["audio", "video"] }).notNull(),
  status: text("status", { enum: ["ringing", "ongoing", "ended", "missed", "rejected"] }).notNull().default("ringing"),
  initiatedBy: varchar("initiated_by").notNull().references(() => users.id, { onDelete: "cascade" }),
  participants: jsonb("participants").$type<Array<{ userId: string; joinedAt?: string; leftAt?: string }>>().default(sql`'[]'::jsonb`),
  startedAt: timestamp("started_at"),
  endedAt: timestamp("ended_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCallSchema = createInsertSchema(calls).omit({
  id: true,
  createdAt: true,
});

export type Call = typeof calls.$inferSelect;
export type InsertCall = z.infer<typeof insertCallSchema>;
