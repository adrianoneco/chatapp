import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  displayName: text("display_name").notNull(),
  role: text("role").notNull().$type<"client" | "attendant" | "admin">().default("client"),
  avatarUrl: text("avatar_url"),
  phone: text("phone"),
  passwordResetToken: text("password_reset_token"),
  passwordResetExpires: timestamp("password_reset_expires"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const conversations = pgTable("conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  protocol: text("protocol").notNull().unique(),
  channel: text("channel").notNull().$type<"webchat" | "whatsapp" | "telegram">().default("webchat"),
  clientId: varchar("client_id").notNull().references(() => users.id),
  attendantId: varchar("attendant_id").references(() => users.id),
  status: text("status").notNull().$type<"active" | "waiting" | "closed">().default("waiting"),
  clientIp: text("client_ip"),
  clientLocation: text("client_location"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  senderId: varchar("sender_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  type: text("type").notNull().$type<"text" | "image" | "video" | "audio">().default("text"),
  mediaUrl: text("media_url"),
  duration: text("duration"),
  caption: text("caption"),
  recorded: boolean("recorded").default(false),
  forwarded: boolean("forwarded").default(false),
  deleted: boolean("deleted").default(false),
  replyToId: varchar("reply_to_id").references((): any => messages.id),
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

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type UserPublic = z.infer<typeof selectUserSchema>;

export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Conversation = typeof conversations.$inferSelect;

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

export type InsertMessageReaction = z.infer<typeof insertMessageReactionSchema>;
export type MessageReaction = typeof messageReactions.$inferSelect;
