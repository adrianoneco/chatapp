import { db } from "../db";
import { channels, channelConnections, conversations, messages } from "@shared/schema";
import { eq, and } from "drizzle-orm";

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || "";
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || "";

interface EvolutionMessage {
  key: {
    remoteJid: string;
    id: string;
  };
  message?: {
    conversation?: string;
    extendedTextMessage?: { text: string };
  };
  messageTimestamp: number;
}

export class EvolutionService {
  private async sendRequest(endpoint: string, method: string = "GET", data?: any) {
    const url = `${EVOLUTION_API_URL}${endpoint}`;
    
    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        "apikey": EVOLUTION_API_KEY,
      },
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      throw new Error(`Evolution API error: ${response.statusText}`);
    }

    return await response.json();
  }

  async sendTextMessage(instanceName: string, remoteJid: string, text: string) {
    return await this.sendRequest(`/message/sendText/${instanceName}`, "POST", {
      number: remoteJid,
      text,
    });
  }

  async getInstanceStatus(instanceName: string) {
    return await this.sendRequest(`/instance/connectionState/${instanceName}`);
  }

  async setWebhook(instanceName: string, webhookUrl: string) {
    return await this.sendRequest(`/webhook/set/${instanceName}`, "POST", {
      url: webhookUrl,
      webhook_by_events: false,
      events: ["MESSAGES_UPSERT", "MESSAGES_UPDATE", "SEND_MESSAGE"],
    });
  }

  async processIncomingMessage(data: EvolutionMessage, channelId: string) {
    const remoteJid = data.key.remoteJid;
    const messageText = data.message?.conversation || data.message?.extendedTextMessage?.text || "";
    
    if (!messageText) return;

    let conversation = await db.query.conversations.findFirst({
      where: and(
        eq(conversations.channelId, channelId),
        eq(conversations.externalContactId, remoteJid)
      ),
    });

    if (!conversation) {
      const [newConversation] = await db.insert(conversations).values({
        channelId,
        externalContactId: remoteJid,
        status: "open",
        lastMessageAt: new Date(),
        metadata: { whatsappJid: remoteJid },
      }).returning();
      
      conversation = newConversation;
    }

    await db.insert(messages).values({
      conversationId: conversation.id,
      senderType: "customer",
      direction: "inbound",
      content: { text: messageText },
      messageType: "text",
      externalId: data.key.id,
    });

    await db.update(conversations)
      .set({ lastMessageAt: new Date() })
      .where(eq(conversations.id, conversation.id));

    return conversation;
  }

  async sendOutboundMessage(conversationId: string, text: string, senderId: string) {
    const conversation = await db.query.conversations.findFirst({
      where: eq(conversations.id, conversationId),
      with: { channel: true },
    });

    if (!conversation || !conversation.externalContactId) {
      throw new Error("Conversation not found or missing external contact");
    }

    const connection = await db.query.channelConnections.findFirst({
      where: eq(channelConnections.channelId, conversation.channelId),
    });

    if (!connection || !connection.instanceId) {
      throw new Error("Channel connection not found");
    }

    const result = await this.sendTextMessage(
      connection.instanceId,
      conversation.externalContactId,
      text
    );

    await db.insert(messages).values({
      conversationId,
      senderType: "user",
      senderId,
      direction: "outbound",
      content: { text },
      messageType: "text",
      externalId: result.key?.id || null,
    });

    return result;
  }
}

export const evolutionService = new EvolutionService();
