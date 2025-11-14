import { 
  users, type User, type InsertUser, type InsertClient, type UpdateClient, 
  meetings, type Meeting, type InsertMeeting, type UpdateMeeting,
  channels, type Channel, type InsertChannel,
  conversations, type Conversation, type InsertConversation, type UpdateConversation,
  messages, type Message, type InsertMessage,
  responseTemplates, type ResponseTemplate, type InsertResponseTemplate, type UpdateResponseTemplate,
  webhooks, type Webhook, type InsertWebhook,
  evolutionInstances, type EvolutionInstance, type InsertEvolutionInstance
} from "@shared/schema";
import { db } from "./db";
import { dispatchWebhookEvent } from "./services/webhooks";
import { eq, and, desc, asc, isNull, or, sql } from "drizzle-orm";
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
  findOrCreateConversation(channelId: string, externalContactId: string, protocol?: string): Promise<{ conversation: Conversation; created: boolean }>;
  
  getMessages(conversationId: string, limit?: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  updateMessageStatus(id: string, updates: { status?: string; deletedBy?: string | null }): Promise<Message | undefined>;
  findMessageByExternalId(externalId: string): Promise<Message | undefined>;
  addReaction(messageId: string, reaction: { userId: string; emoji: string }): Promise<Message | undefined>;
  removeReaction(messageId: string, reaction: { userId: string; emoji: string }): Promise<Message | undefined>;
  
  getResponseTemplates(userId: string): Promise<ResponseTemplate[]>;
  getResponseTemplateById(id: string, userId: string): Promise<ResponseTemplate | undefined>;
  createResponseTemplate(template: InsertResponseTemplate, userId: string): Promise<ResponseTemplate>;
  updateResponseTemplate(id: string, userId: string, updates: UpdateResponseTemplate): Promise<ResponseTemplate | undefined>;
  deleteResponseTemplate(id: string, userId: string): Promise<boolean>;
  
  getWebhooks(userId: string): Promise<Webhook[]>;
  getWebhookById(id: string, userId: string): Promise<Webhook | undefined>;
  createWebhook(webhook: InsertWebhook, userId: string): Promise<Webhook>;
  updateWebhook(id: string, webhook: InsertWebhook, userId: string): Promise<Webhook | undefined>;
  deleteWebhook(id: string, userId: string): Promise<boolean>;
  
  getEvolutionInstances(): Promise<EvolutionInstance[]>;
  getEvolutionInstanceById(id: string): Promise<EvolutionInstance | undefined>;
  createEvolutionInstance(instance: InsertEvolutionInstance): Promise<EvolutionInstance>;
  deleteEvolutionInstance(id: string): Promise<boolean>;
  
  sessionStore: any;
}

export class DatabaseStorage implements IStorage {
  sessionStore: any;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
    // Ensure the session table exists as a fallback. Some environments
    // may not allow `connect-pg-simple` to create it automatically,
    // so we run a safe `CREATE TABLE IF NOT EXISTS` here and log errors.
    pool.query(`
      CREATE TABLE IF NOT EXISTS "session" (
        "sid" varchar NOT NULL PRIMARY KEY,
        "sess" json NOT NULL,
        "expire" timestamp(6) NOT NULL
      )
    `).then(() => {
      console.log('[storage] ensured "session" table exists');
    }).catch((err) => {
      console.error('[storage] error ensuring "session" table exists:', err?.message || err);
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
      avatarUrl: insertClient.avatarUrl || null,
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

  async getAllClients(): Promise<User[]> {
    return await db.select().from(users).where(eq(users.role, "client"));
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

    if ((updates as any).avatarUrl !== undefined) {
      processedUpdates.avatarUrl = (updates as any).avatarUrl === "" ? null : (updates as any).avatarUrl;
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
        const meetingData: any = {
          ...insertMeeting,
          linkId,
          createdBy: userId,
        };
        if (insertMeeting.scheduledAt) {
          meetingData.scheduledAt = new Date(insertMeeting.scheduledAt);
        }
        const [meeting] = await db
          .insert(meetings)
          .values(meetingData)
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
    const updateData: any = updates;
    if (updates.scheduledAt) {
      updateData.scheduledAt = new Date(updates.scheduledAt);
    }
    const [meeting] = await db
      .update(meetings)
      .set(updateData)
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
    try {
      // Fire conversation.created webhook
      await dispatchWebhookEvent("conversation.created", conversation);
    } catch (err) {
      const e = err as any;
      console.error("[storage] error dispatching conversation.created", e?.message || e);
    }
    return conversation;
  }

  async updateConversation(id: string, updates: UpdateConversation): Promise<Conversation | undefined> {
    const [conversation] = await db
      .update(conversations)
      .set(updates)
      .where(eq(conversations.id, id))
      .returning();
    if (conversation) {
      try {
        // Dispatch a generic conversation.updated event
        await dispatchWebhookEvent("conversation.updated", conversation);

        // If status changed to closed, also dispatch conversation.closed
        if ((updates as any).status === "closed") {
          await dispatchWebhookEvent("conversation.closed", conversation);
        }
      } catch (err) {
        const e = err as any;
        console.error("[storage] error dispatching conversation events:", e?.message || e);
      }
    }
    return conversation || undefined;
  }

  async findOrCreateConversation(
    channelId: string,
    externalContactId: string,
    protocol?: string
  ): Promise<{ conversation: Conversation; created: boolean }> {
    interface ConversationRow {
      id: string;
      channel_id: string;
      customer_contact_id: string | null;
      external_contact_id: string | null;
      protocol: string | null;
      created_by: string | null;
      assigned_to: string | null;
      status: "open" | "pending" | "resolved" | "closed";
      last_message_at: Date | null;
      metadata: Record<string, any> | null;
      created_at: Date;
      created: boolean;
    }

    const result = await pool.query<ConversationRow>(
      `
      INSERT INTO conversations (channel_id, external_contact_id, status, protocol)
      VALUES ($1, $2, 'open', $3)
      ON CONFLICT (channel_id, external_contact_id) DO UPDATE
        SET status = CASE 
          WHEN conversations.status IN ('open', 'pending') THEN conversations.status
          ELSE 'open'
        END,
        last_message_at = conversations.last_message_at
      RETURNING *, (xmax = 0) AS created
      `,
      [channelId, externalContactId, protocol || null]
    );

    if (!result.rows[0]) {
      throw new Error("Failed to create or find conversation");
    }

    const row = result.rows[0];
    
    const conversation: Conversation = {
      id: row.id,
      channelId: row.channel_id,
      customerContactId: row.customer_contact_id,
      externalContactId: row.external_contact_id,
      protocol: row.protocol || null,
      createdBy: row.created_by,
      assignedTo: row.assigned_to,
      status: row.status,
      lastMessageAt: row.last_message_at,
      metadata: row.metadata,
      createdAt: row.created_at,
    };

    if (row.created) {
      try {
        await dispatchWebhookEvent("conversation.created", conversation);
      } catch (err) {
        const e = err as any;
        console.error("[storage] error dispatching conversation.created (findOrCreate):", e?.message || e);
      }
    }

    return { conversation, created: row.created };
  }

  async getMessages(conversationId: string, limit: number = 100): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(asc(messages.createdAt))
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
    try {
      // Fire message.created webhook
      await dispatchWebhookEvent("message.created", { message, conversationId: insertMessage.conversationId });
    } catch (err) {
      const e = err as any;
      console.error("[storage] error dispatching message.created", e?.message || e);
    }

    return message;
  }

  async updateMessageStatus(id: string, updates: { status?: string; deletedBy?: string | null }): Promise<Message | undefined> {
    try {
      const [updated] = await db
        .update(messages)
        .set({ status: updates.status as any, deletedBy: updates.deletedBy ?? null })
        .where(eq(messages.id, id))
        .returning();

      if (!updated) return undefined;

      try {
        await dispatchWebhookEvent("message.updated", { message: updated, conversationId: updated.conversationId });
      } catch (err) {
        const e = err as any;
        console.error("[storage] error dispatching message.updated", e?.message || e);
      }

      return updated;
    } catch (err) {
      const e = err as any;
      console.error("[storage] updateMessageStatus error:", e?.message || e);
      throw err;
    }
  }

  async addReaction(messageId: string, reaction: { userId: string; emoji: string }): Promise<Message | undefined> {
    try {
      // push reaction into reactions jsonb array
      const [updated] = await db
        .update(messages)
        .set({ reactions: sql`(COALESCE(${messages.reactions}, '[]'::jsonb) || ${JSON.stringify([reaction])}::jsonb)` as any })
        .where(eq(messages.id, messageId))
        .returning();

      if (!updated) return undefined;

      try {
        await dispatchWebhookEvent("message.updated", { message: updated, conversationId: updated.conversationId });
      } catch (err) {
        const e = err as any;
        console.error("[storage] error dispatching message.updated (reactions):", e?.message || e);
      }

      return updated;
    } catch (err) {
      const e = err as any;
      console.error("[storage] addReaction error:", e?.message || e);
      throw err;
    }
  }

  async removeReaction(messageId: string, reaction: { userId: string; emoji: string }): Promise<Message | undefined> {
    try {
      // remove one matching reaction from array
      // fetch current reactions
      const [msg] = await db.select().from(messages).where(eq(messages.id, messageId)).limit(1);
      if (!msg) return undefined;
      const current = (msg.reactions || []) as Array<{ userId: string; emoji: string }>;
      const idx = current.findIndex((r) => r.userId === reaction.userId && r.emoji === reaction.emoji);
      if (idx === -1) return msg;
      current.splice(idx, 1);

      const [updated] = await db
        .update(messages)
        .set({ reactions: current as any })
        .where(eq(messages.id, messageId))
        .returning();

      try {
        await dispatchWebhookEvent("message.updated", { message: updated, conversationId: updated.conversationId });
      } catch (err) {
        const e = err as any;
        console.error("[storage] error dispatching message.updated (remove reaction):", e?.message || e);
      }

      return updated;
    } catch (err) {
      const e = err as any;
      console.error("[storage] removeReaction error:", e?.message || e);
      throw err;
    }
  }

  async findMessageByExternalId(externalId: string): Promise<Message | undefined> {
    const [message] = await db
      .select()
      .from(messages)
      .where(eq(messages.externalId, externalId))
      .limit(1);
    return message || undefined;
  }

  async getResponseTemplates(userId: string): Promise<ResponseTemplate[]> {
    return await db
      .select()
      .from(responseTemplates)
      .where(eq(responseTemplates.createdBy, userId))
      .orderBy(desc(responseTemplates.createdAt));
  }

  async getResponseTemplateById(id: string, userId: string): Promise<ResponseTemplate | undefined> {
    const [template] = await db
      .select()
      .from(responseTemplates)
      .where(and(eq(responseTemplates.id, id), eq(responseTemplates.createdBy, userId)));
    return template || undefined;
  }

  async createResponseTemplate(insertTemplate: InsertResponseTemplate, userId: string): Promise<ResponseTemplate> {
    const [template] = await db
      .insert(responseTemplates)
      .values({ ...insertTemplate, createdBy: userId })
      .returning();
    return template;
  }

  async updateResponseTemplate(id: string, userId: string, updates: UpdateResponseTemplate): Promise<ResponseTemplate | undefined> {
    const [template] = await db
      .update(responseTemplates)
      .set(updates)
      .where(and(eq(responseTemplates.id, id), eq(responseTemplates.createdBy, userId)))
      .returning();
    return template || undefined;
  }

  async deleteResponseTemplate(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(responseTemplates)
      .where(and(eq(responseTemplates.id, id), eq(responseTemplates.createdBy, userId)));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async getWebhooks(userId: string): Promise<Webhook[]> {
    return db.select().from(webhooks).where(eq(webhooks.createdBy, userId));
  }

  async getWebhookById(id: string, userId: string): Promise<Webhook | undefined> {
    const [webhook] = await db
      .select()
      .from(webhooks)
      .where(and(eq(webhooks.id, id), eq(webhooks.createdBy, userId)));
    return webhook || undefined;
  }

  async createWebhook(webhook: InsertWebhook, userId: string): Promise<Webhook> {
    try {
      const [created] = await db
        .insert(webhooks)
        .values({ 
          name: webhook.name,
          targetUrl: webhook.targetUrl,
          authType: webhook.authType || "none",
          authPayload: webhook.authPayload as any,
          events: webhook.events as any,
          headers: webhook.headers as any,
          isActive: webhook.isActive ?? true,
          createdBy: userId,
        })
        .returning();
      return created;
    } catch (error: any) {
      console.error("[storage] createWebhook error:", {
        message: error?.message || error,
        stack: error?.stack,
        webhookPayload: webhook,
        userId,
      });
      throw error;
    }
  }

  async updateWebhook(id: string, webhook: InsertWebhook, userId: string): Promise<Webhook | undefined> {
    const [updated] = await db
      .update(webhooks)
      .set({ 
        name: webhook.name,
        targetUrl: webhook.targetUrl,
        authType: webhook.authType || "none",
        authPayload: webhook.authPayload as any,
        events: webhook.events as any,
        headers: webhook.headers as any,
        isActive: webhook.isActive ?? true,
        updatedAt: new Date(),
      })
      .where(and(eq(webhooks.id, id), eq(webhooks.createdBy, userId)))
      .returning();
    return updated || undefined;
  }

  async deleteWebhook(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(webhooks)
      .where(and(eq(webhooks.id, id), eq(webhooks.createdBy, userId)));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async getEvolutionInstances(): Promise<EvolutionInstance[]> {
    const instances = await db.select().from(evolutionInstances);
    return instances.map(inst => ({
      ...inst,
      apiKey: inst.apiKey.replace(/.(?=.{4})/g, '*')
    }));
  }

  async getEvolutionInstanceById(id: string): Promise<EvolutionInstance | undefined> {
    const [instance] = await db
      .select()
      .from(evolutionInstances)
      .where(eq(evolutionInstances.id, id));
    if (!instance) return undefined;
    return {
      ...instance,
      apiKey: instance.apiKey.replace(/.(?=.{4})/g, '*')
    };
  }

  async createEvolutionInstance(instance: InsertEvolutionInstance): Promise<EvolutionInstance> {
    const [created] = await db
      .insert(evolutionInstances)
      .values(instance)
      .returning();
    return created;
  }

  async deleteEvolutionInstance(id: string): Promise<boolean> {
    const result = await db
      .delete(evolutionInstances)
      .where(eq(evolutionInstances.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }
}

export const storage = new DatabaseStorage();
