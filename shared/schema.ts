import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, jsonb, real, serial } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  displayName: text("display_name"),
  role: text("role").notNull().$type<"client" | "attendant" | "admin">().default("client"),
  avatarUrl: text("avatar_url"),
  phone: text("phone"),
  remoteJid: text("remote_jid"),
  channel: text("channel").$type<"webchat" | "whatsapp" | "telegram">(),
  deleted: boolean("deleted").default(false).notNull(),
  passwordResetToken: text("password_reset_token"),
  passwordResetExpires: timestamp("password_reset_expires"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const protocols = pgTable("protocols", {
  id: serial("id").primaryKey(),
  protocol: varchar("protocol", { length: 10 }).notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const conversations = pgTable("conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  protocol: text("protocol").notNull().unique(),
  sequenceNumber: serial("sequence_number"),
  channel: text("channel").notNull().$type<"webchat" | "whatsapp" | "telegram">().default("webchat"),
  clientId: varchar("client_id").notNull().references(() => users.id),
  attendantId: varchar("attendant_id").references(() => users.id),
  status: text("status").notNull().$type<"active" | "waiting" | "closed">().default("waiting"),
  clientIp: text("client_ip"),
  clientLocation: text("client_location"),
  gpsLocation: boolean("gps_location").default(false),
  latitude: real("latitude"),
  longitude: real("longitude"),
  messageRef: text("message_ref"),
  deleted: boolean("deleted").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  senderId: varchar("sender_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  type: text("type").notNull().$type<"text" | "image" | "video" | "audio" | "document" | "contact" | "location">().default("text"),
  mediaUrl: text("media_url"),
  duration: text("duration"),
  caption: text("caption"),
  recorded: boolean("recorded").default(false),
  forwarded: boolean("forwarded").default(false),
  forMe: boolean("for_me").default(false),
  deleted: boolean("deleted").default(false),
  messageStatus: text("message_status").$type<"sent" | "delivered" | "read">().default("sent"),
  replyToId: varchar("reply_to_id").references((): any => messages.id),
  fileName: text("file_name"),
  fileSize: text("file_size"),
  metadata: jsonb("metadata").$type<{
    audio_tags?: {
      title: string;
      artist: string;
      album?: string;
      year?: string;
      cover: string | null;
    };
    file?: {
      name: string;
      size: string;
      type: string;
    };
    contact?: {
      id: string;
      name: string;
      email?: string;
      phone?: string;
      avatarUrl?: string;
    };
    location?: {
      latitude: number;
      longitude: number;
      address?: string;
      name?: string;
    };
  } | null>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const messageReactions = pgTable("message_reactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  messageId: varchar("message_id").notNull().references(() => messages.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id),
  emoji: text("emoji").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const channels = pgTable("channels", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  imageUrl: text("image_url"),
  enabled: boolean("enabled").default(true).notNull(),
  locked: boolean("locked").default(false).notNull(),
  isDefault: boolean("is_default").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const webhooks = pgTable("webhooks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  url: text("url").notNull(),
  enabled: boolean("enabled").default(true).notNull(),
  authType: text("auth_type").notNull().$type<"none" | "apikey" | "bearer" | "basic">(),
  authConfig: jsonb("auth_config").$type<{
    apikey?: { header: string; value: string };
    bearer?: { token: string };
    basic?: { username: string; password: string };
  } | null>(),
  headers: jsonb("headers").$type<Record<string, string>>().default({}),
  events: jsonb("events").$type<string[]>().notNull().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const webhookLogs = pgTable("webhook_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  webhookId: varchar("webhook_id").notNull().references(() => webhooks.id, { onDelete: "cascade" }),
  eventType: varchar("event_type", { length: 100 }).notNull(),
  payload: jsonb("payload").notNull(),
  responseStatus: integer("response_status"),
  responseBody: text("response_body"),
  success: boolean("success").notNull(),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  passwordResetToken: true,
  passwordResetExpires: true,
  createdAt: true,
  updatedAt: true,
});

export const selectUserSchema = createSelectSchema(users).omit({
  passwordHash: true,
  passwordResetToken: true,
  passwordResetExpires: true,
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const selectConversationSchema = createSelectSchema(conversations);

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const selectMessageSchema = createSelectSchema(messages);

export const insertMessageReactionSchema = createInsertSchema(messageReactions).omit({
  id: true,
  createdAt: true,
});

export const insertChannelSchema = createInsertSchema(channels).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const selectChannelSchema = createSelectSchema(channels);

export const insertProtocolSchema = createInsertSchema(protocols).omit({
  id: true,
  createdAt: true,
});

export const selectProtocolSchema = createSelectSchema(protocols);

export const insertWebhookSchema = createInsertSchema(webhooks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const selectWebhookSchema = createSelectSchema(webhooks);

export const insertWebhookLogSchema = createInsertSchema(webhookLogs).omit({
  id: true,
  createdAt: true,
});

export const selectWebhookLogSchema = createSelectSchema(webhookLogs);

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type UserPublic = z.infer<typeof selectUserSchema>;

export type InsertProtocol = z.infer<typeof insertProtocolSchema>;
export type Protocol = typeof protocols.$inferSelect;

export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Conversation = typeof conversations.$inferSelect;

export type InsertWebhook = z.infer<typeof insertWebhookSchema>;
export type Webhook = typeof webhooks.$inferSelect;

export type InsertWebhookLog = z.infer<typeof insertWebhookLogSchema>;
export type WebhookLog = typeof webhookLogs.$inferSelect;

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

export type InsertMessageReaction = z.infer<typeof insertMessageReactionSchema>;
export type MessageReaction = typeof messageReactions.$inferSelect;

export type InsertChannel = z.infer<typeof insertChannelSchema>;
export type Channel = typeof channels.$inferSelect;
