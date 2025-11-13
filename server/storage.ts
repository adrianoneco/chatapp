import { users, type User, type InsertUser, contacts, type Contact, type InsertContact } from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  createContact(contact: InsertContact): Promise<Contact>;
  getContacts(userId: string): Promise<Contact[]>;
  getContactById(id: string, userId: string): Promise<Contact | undefined>;
  updateContact(id: string, userId: string, updates: Partial<InsertContact>): Promise<Contact | undefined>;
  deleteContact(id: string, userId: string): Promise<boolean>;
  sessionStore: session.SessionStore;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.SessionStore;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async createContact(insertContact: InsertContact): Promise<Contact> {
    const [contact] = await db
      .insert(contacts)
      .values(insertContact)
      .returning();
    return contact;
  }

  async getContacts(userId: string): Promise<Contact[]> {
    return await db.select().from(contacts).where(eq(contacts.userId, userId));
  }

  async getContactById(id: string, userId: string): Promise<Contact | undefined> {
    const [contact] = await db
      .select()
      .from(contacts)
      .where(and(eq(contacts.id, id), eq(contacts.userId, userId)));
    return contact || undefined;
  }

  async updateContact(id: string, userId: string, updates: Partial<InsertContact>): Promise<Contact | undefined> {
    const [contact] = await db
      .update(contacts)
      .set(updates)
      .where(and(eq(contacts.id, id), eq(contacts.userId, userId)))
      .returning();
    return contact || undefined;
  }

  async deleteContact(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(contacts)
      .where(and(eq(contacts.id, id), eq(contacts.userId, userId)));
    return result.rowCount !== null && result.rowCount > 0;
  }
}

export const storage = new DatabaseStorage();
