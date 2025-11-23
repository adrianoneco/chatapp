import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp } from "drizzle-orm/pg-core";
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

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type UserPublic = z.infer<typeof selectUserSchema>;
