import { 
  users, type User, type InsertUser, type InsertClient, type UpdateClient, 
  meetings, type Meeting, type InsertMeeting, type UpdateMeeting,
  channels, type Channel, type InsertChannel,
  conversations, type Conversation, type InsertConversation, type UpdateConversation,
  messages, type Message, type InsertMessage
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, isNull, or, sql } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";
import { generateNanoid } from "./utils/nanoid";
import { hashPassword } from "./utils/auth";
import { randomBytes } from "crypto";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  createClient(client: InsertClient, createdBy: string): Promise<User>;
  getClients(createdBy: string): Promise<User[]>;
  getClientById(id: string, createdBy: string): Promise<User | undefined>;
  updateClient(id: string, createdBy: string, updates: UpdateClient): Promise<User | undefined>;
  deleteClient(id: string, createdBy: string): Promise<boolean>;
  createAttendant(attendant: InsertUser): Promise<User>;
  getAttendants(): Promise<User[]>;
  getAttendantById(id: string): Promise<User | undefined>;
  updateAttendant(id: string, updates: Partial<Omit<InsertUser, "role">>): Promise<User | undefined>;
  deleteAttendant(id: string): Promise<boolean>;
  createMeeting(meeting: InsertMeeting, userId: string): Promise<Meeting>;
  getMeetings(userId: string): Promise<Meeting[]>;
  getMeetingById(id: string, userId: string): Promise<Meeting | undefined>;
  getMeetingByLinkId(linkId: string): Promise<Meeting | undefined>;
  updateMeeting(id: string, userId: string, updates: UpdateMeeting): Promise<Meeting | undefined>;
  deleteMeeting(id: string, userId: string): Promise<boolean>;
  
  getChannels(): Promise<Channel[]>;
  getChannelById(id: string): Promise<Channel | undefined>;
  getChannelBySlug(slug: string): Promise<Channel | undefined>;
  createChannel(channel: InsertChannel): Promise<Channel>;
  
  getConversations(params: { channelId?: string; status?: string; assignedTo?: string }): Promise<Conversation[]>;
  getConversationById(id: string): Promise<Conversation | undefined>;
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  updateConversation(id: string, updates: UpdateConversation): Promise<Conversation | undefined>;
  findOrCreateConversation(channelId: string, externalContactId: string): Promise<Conversation>;
  
  getMessages(conversationId: string, limit?: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  findMessageByExternalId(externalId: string): Promise<Message | undefined>;
  
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

  async createClient(insertClient: InsertClient, createdBy: string): Promise<User> {
    const cleanEmail = insertClient.email === "" ? null : insertClient.email;
    const cleanUsername = insertClient.username === "" ? null : insertClient.username;
    const cleanPassword = insertClient.password === "" ? null : insertClient.password;
    
    const clientData = {
      name: insertClient.name,
      email: cleanEmail || null,
      username: cleanUsername || null,
      password: cleanPassword ? await hashPassword(cleanPassword) : null,
      role: "client" as const,
      phone: insertClient.phone || null,
      notes: insertClient.notes || null,
      createdBy: createdBy,
    };
    
    const [client] = await db.insert(users).values(clientData).returning();
    return client;
  }

  async getClients(createdBy: string): Promise<User[]> {
    return await db.select().from(users).where(
      and(eq(users.role, "client"), eq(users.createdBy, createdBy))
    );
  }

  async getClientById(id: string, createdBy: string): Promise<User | undefined> {
    const [client] = await db.select().from(users).where(
      and(eq(users.id, id), eq(users.role, "client"), eq(users.createdBy, createdBy))
    );
    return client || undefined;
  }

  async updateClient(id: string, createdBy: string, updates: UpdateClient): Promise<User | undefined> {
    const processedUpdates: any = {};
    
    if (updates.name !== undefined) {
      processedUpdates.name = updates.name;
    }
    
    if (updates.email !== undefined) {
      processedUpdates.email = updates.email === "" ? null : updates.email;
    }
    
    if (updates.username !== undefined) {
      processedUpdates.username = updates.username === "" ? null : updates.username;
    }
    
    if (updates.password !== undefined) {
      if (updates.password === "") {
        processedUpdates.password = null;
      } else {
        processedUpdates.password = await hashPassword(updates.password);
      }
    }
    
    if (updates.phone !== undefined) {
      processedUpdates.phone = updates.phone === "" ? null : updates.phone;
    }
    
    if (updates.notes !== undefined) {
      processedUpdates.notes = updates.notes === "" ? null : updates.notes;
    }
    
    const [client] = await db.update(users).set(processedUpdates).where(
      and(eq(users.id, id), eq(users.role, "client"), eq(users.createdBy, createdBy))
    ).returning();
    return client || undefined;
  }

  async deleteClient(id: string, createdBy: string): Promise<boolean> {
    const result = await db.delete(users).where(
      and(eq(users.id, id), eq(users.role, "client"), eq(users.createdBy, createdBy))
    );
    return result.rowCount !== null && result.rowCount > 0;
  }

  async createAttendant(insertAttendant: InsertUser): Promise<User> {
    const [attendant] = await db
      .insert(users)
      .values({ ...insertAttendant, role: "attendant" })
      .returning();
    return attendant;
  }

  async getAttendants(): Promise<User[]> {
    return await db.select().from(users).where(eq(users.role, "attendant"));
  }

  async getAttendantById(id: string): Promise<User | undefined> {
    const [attendant] = await db
      .select()
      .from(users)
      .where(and(eq(users.id, id), eq(users.role, "attendant")));
    return attendant || undefined;
  }

  async updateAttendant(id: string, updates: Partial<Omit<InsertUser, "role">>): Promise<User | undefined> {
    const [attendant] = await db
      .update(users)
      .set(updates)
      .where(and(eq(users.id, id), eq(users.role, "attendant")))
      .returning();
    return attendant || undefined;
  }

  async deleteAttendant(id: string): Promise<boolean> {
    const result = await db
      .delete(users)
      .where(and(eq(users.id, id), eq(users.role, "attendant")));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async createMeeting(insertMeeting: InsertMeeting, userId: string): Promise<Meeting> {
    let linkId = generateNanoid();
    let attempts = 0;
    const maxAttempts = 5;

    while (attempts < maxAttempts) {
      try {
        const [meeting] = await db
          .insert(meetings)
          .values({
            ...insertMeeting,
            linkId,
            createdBy: userId,
          })
          .returning();
        return meeting;
      } catch (error: any) {
        if (error.code === '23505' && error.constraint === 'meetings_link_id_unique') {
          linkId = generateNanoid();
          attempts++;
        } else {
          throw error;
        }
      }
    }
    throw new Error('Failed to generate unique linkId after maximum attempts');
  }

  async getMeetings(userId: string): Promise<Meeting[]> {
    return await db.select().from(meetings).where(eq(meetings.createdBy, userId));
  }

  async getMeetingById(id: string, userId: string): Promise<Meeting | undefined> {
    const [meeting] = await db
      .select()
      .from(meetings)
      .where(and(eq(meetings.id, id), eq(meetings.createdBy, userId)));
    return meeting || undefined;
  }

  async getMeetingByLinkId(linkId: string): Promise<Meeting | undefined> {
    const [meeting] = await db
      .select()
      .from(meetings)
      .where(eq(meetings.linkId, linkId));
    return meeting || undefined;
  }

  async updateMeeting(id: string, userId: string, updates: UpdateMeeting): Promise<Meeting | undefined> {
    const [meeting] = await db
      .update(meetings)
      .set(updates)
      .where(and(eq(meetings.id, id), eq(meetings.createdBy, userId)))
      .returning();
    return meeting || undefined;
  }

  async deleteMeeting(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(meetings)
      .where(and(eq(meetings.id, id), eq(meetings.createdBy, userId)));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async getChannels(): Promise<Channel[]> {
    return await db.select().from(channels).where(eq(channels.isActive, true));
  }

  async getChannelById(id: string): Promise<Channel | undefined> {
    const [channel] = await db.select().from(channels).where(eq(channels.id, id));
    return channel || undefined;
  }

  async getChannelBySlug(slug: string): Promise<Channel | undefined> {
    const [channel] = await db.select().from(channels).where(eq(channels.slug, slug));
    return channel || undefined;
  }

  async createChannel(insertChannel: InsertChannel): Promise<Channel> {
    const [channel] = await db.insert(channels).values(insertChannel).returning();
    return channel;
  }

  async getConversations(params: { channelId?: string; status?: string; assignedTo?: string }): Promise<Conversation[]> {
    let query = db.select().from(conversations);
    
    const conditions = [];
    if (params.channelId) {
      conditions.push(eq(conversations.channelId, params.channelId));
    }
    if (params.status) {
      conditions.push(eq(conversations.status, params.status as any));
    }
    if (params.assignedTo) {
      conditions.push(eq(conversations.assignedTo, params.assignedTo));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    return await query.orderBy(
      sql`${conversations.lastMessageAt} DESC NULLS LAST`,
      desc(conversations.createdAt)
    );
  }

  async getConversationById(id: string): Promise<Conversation | undefined> {
    const [conversation] = await db.select().from(conversations).where(eq(conversations.id, id));
    return conversation || undefined;
  }

  async createConversation(insertConversation: InsertConversation): Promise<Conversation> {
    const [conversation] = await db.insert(conversations).values(insertConversation).returning();
    return conversation;
  }

  async updateConversation(id: string, updates: UpdateConversation): Promise<Conversation | undefined> {
    const [conversation] = await db
      .update(conversations)
      .set(updates)
      .where(eq(conversations.id, id))
      .returning();
    return conversation || undefined;
  }

  async findOrCreateConversation(channelId: string, externalContactId: string): Promise<Conversation> {
    const result = await db
      .insert(conversations)
      .values({
        channelId,
        externalContactId,
        status: "open",
      })
      .onConflictDoUpdate({
        target: [conversations.channelId, conversations.externalContactId],
        set: {
          status: sql`CASE 
            WHEN conversations.status IN ('open', 'pending') THEN conversations.status 
            ELSE 'open' 
          END`,
        },
      })
      .returning();
    
    return result[0];
  }

  async getMessages(conversationId: string, limit: number = 100): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(desc(messages.createdAt))
      .limit(limit);
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    if (insertMessage.externalId) {
      const [message] = await db
        .insert(messages)
        .values(insertMessage)
        .onConflictDoNothing({ target: messages.externalId })
        .returning();
      
      if (!message) {
        const existing = await this.findMessageByExternalId(insertMessage.externalId);
        if (existing) {
          return existing;
        }
        throw new Error("Failed to create or find message by externalId");
      }
      
      await db
        .update(conversations)
        .set({ lastMessageAt: message.createdAt })
        .where(eq(conversations.id, insertMessage.conversationId));
      
      return message;
    }

    const [message] = await db.insert(messages).values(insertMessage).returning();
    
    await db
      .update(conversations)
      .set({ lastMessageAt: message.createdAt })
      .where(eq(conversations.id, insertMessage.conversationId));
    
    return message;
  }

  async findMessageByExternalId(externalId: string): Promise<Message | undefined> {
    const [message] = await db
      .select()
      .from(messages)
      .where(eq(messages.externalId, externalId))
      .limit(1);
    return message || undefined;
  }
}

export const storage = new DatabaseStorage();
