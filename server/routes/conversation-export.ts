import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth";
import { db } from "../db";
import { conversations, messages, users } from "@shared/schema";
import { eq } from "drizzle-orm";
import { emailService } from "../services/email";

const router = Router();

router.post("/conversations/:id/export", requireAuth, requireRole("attendant", "admin"), async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user as any;

    if (!user?.email) {
      return res.status(400).json({ error: "Usuário não possui email cadastrado" });
    }

    const conversation = await db.query.conversations.findFirst({
      where: eq(conversations.id, id),
    });

    if (!conversation) {
      return res.status(404).json({ error: "Conversa não encontrada" });
    }

    const conversationMessages = await db.query.messages.findMany({
      where: eq(messages.conversationId, id),
      orderBy: (messages, { asc }) => [asc(messages.createdAt)],
    });

    const senderIds = Array.from(new Set(conversationMessages.map(m => m.senderId).filter(Boolean)));
    const senders = senderIds.length > 0 
      ? await db.query.users.findMany({
          where: (users, { inArray }) => inArray(users.id, senderIds as string[]),
        })
      : [];
    
    const sendersMap = new Map(senders.map(s => [s.id, s.name]));

    const formattedMessages = conversationMessages.map(msg => ({
      sender: msg.senderId ? sendersMap.get(msg.senderId) || "Usuário" : msg.senderType === "customer" ? "Cliente" : "Sistema",
      content: (msg.content as any)?.text || JSON.stringify(msg.content),
      timestamp: msg.createdAt || new Date(),
    }));

    await emailService.sendConversationTranscription(
      user.email,
      id,
      formattedMessages
    );

    res.json({
      success: true,
      message: `Transcrição enviada para ${user.email}`,
    });
  } catch (error: any) {
    console.error("[EXPORT] Error:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
