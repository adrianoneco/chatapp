import { type User, type InsertUser } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
  listUsers(role?: "client" | "attendant" | "admin"): Promise<User[]>;
  updatePasswordResetToken(email: string, token: string | null, expires: Date | null): Promise<User | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;

  constructor() {
    this.users = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const now = new Date();
    const user: User = {
      ...insertUser,
      id,
      role: insertUser.role || "client",
      avatarUrl: insertUser.avatarUrl || null,
      phone: insertUser.phone || null,
      passwordResetToken: null,
      passwordResetExpires: null,
      createdAt: now,
      updatedAt: now,
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser: User = {
      ...user,
      ...updates,
      updatedAt: new Date(),
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: string): Promise<boolean> {
    return this.users.delete(id);
  }

  async listUsers(role?: "client" | "attendant" | "admin"): Promise<User[]> {
    const allUsers = Array.from(this.users.values());
    if (role) {
      return allUsers.filter((user) => user.role === role);
    }
    return allUsers;
  }

  async updatePasswordResetToken(email: string, token: string | null, expires: Date | null): Promise<User | undefined> {
    const user = await this.getUserByEmail(email);
    if (!user) return undefined;
    
    const updatedUser: User = {
      ...user,
      passwordResetToken: token,
      passwordResetExpires: expires,
      updatedAt: new Date(),
    };
    this.users.set(user.id, updatedUser);
    return updatedUser;
  }
}

export const storage = new MemStorage();
