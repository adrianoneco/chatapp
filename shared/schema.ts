import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, foreignKey } from "drizzle-orm/pg-core";
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
});

export type InsertAttendant = z.infer<typeof insertAttendantSchema>;
export type UpdateAttendant = z.infer<typeof updateAttendantSchema>;

export const meetings = pgTable("meetings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  scheduledAt: timestamp("scheduled_at").notNull(),
  isPublic: boolean("is_public").notNull().default(false),
  linkId: varchar("link_id", { length: 21 }).notNull().unique(),
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
