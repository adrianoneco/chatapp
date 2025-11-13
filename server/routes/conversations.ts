import { Router } from "express";
import type { IStorage } from "../storage";
import { requireAuth } from "../middleware/auth";
import { insertConversationSchema, updateConversationSchema, insertMessageSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";

export function createConversationsRouter(storage: IStorage): Router {
  const router = Router();

  router.get("/channels", requireAuth, async (req, res, next) => {
    try {
      const channels = await storage.getChannels();
      res.json(channels);
    } catch (error) {
      next(error);
    }
  });

  router.get("/channels/:id", requireAuth, async (req, res, next) => {
    try {
      const channel = await storage.getChannelById(req.params.id);
      if (!channel) {
        return res.status(404).json({ message: "Canal não encontrado" });
      }
      res.json(channel);
    } catch (error) {
      next(error);
    }
  });

  router.get("/conversations", requireAuth, async (req, res, next) => {
    try {
      const params = {
        channelId: req.query.channelId as string | undefined,
        status: req.query.status as string | undefined,
        assignedTo: req.query.assignedTo as string | undefined,
      };
      
      const conversations = await storage.getConversations(params);
      res.json(conversations);
    } catch (error) {
      next(error);
    }
  });

  router.get("/conversations/:id", requireAuth, async (req, res, next) => {
    try {
      const conversation = await storage.getConversationById(req.params.id);
      if (!conversation) {
        return res.status(404).json({ message: "Conversa não encontrada" });
      }
      res.json(conversation);
    } catch (error) {
      next(error);
    }
  });

  router.post("/conversations", requireAuth, async (req, res, next) => {
    try {
      const parsed = insertConversationSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          message: fromZodError(parsed.error).message,
        });
      }

      if (parsed.data.channelId && parsed.data.externalContactId) {
        const { conversation, created } = await storage.findOrCreateConversation(
          parsed.data.channelId,
          parsed.data.externalContactId
        );
        const status = created ? 201 : 200;
        if (created) {
          res.setHeader("Location", `/api/conversations/${conversation.id}`);
        }
        return res.status(status).json(conversation);
      }

      const conversation = await storage.createConversation(parsed.data);
      res.status(201).json(conversation);
    } catch (error) {
      next(error);
    }
  });

  router.patch("/conversations/:id", requireAuth, async (req, res, next) => {
    try {
      const parsed = updateConversationSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          message: fromZodError(parsed.error).message,
        });
      }

      const conversation = await storage.updateConversation(req.params.id, parsed.data);
      if (!conversation) {
        return res.status(404).json({ message: "Conversa não encontrada" });
      }
      res.json(conversation);
    } catch (error) {
      next(error);
    }
  });

  router.get("/conversations/:id/messages", requireAuth, async (req, res, next) => {
    try {
      const conversation = await storage.getConversationById(req.params.id);
      if (!conversation) {
        return res.status(404).json({ message: "Conversa não encontrada" });
      }

      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const messages = await storage.getMessages(req.params.id, limit);
      res.json(messages);
    } catch (error) {
      next(error);
    }
  });

  router.post("/conversations/:id/messages", requireAuth, async (req, res, next) => {
    try {
      const conversation = await storage.getConversationById(req.params.id);
      if (!conversation) {
        return res.status(404).json({ message: "Conversa não encontrada" });
      }

      const parsed = insertMessageSchema.safeParse({
        ...req.body,
        conversationId: req.params.id,
      });

      if (!parsed.success) {
        return res.status(400).json({
          message: fromZodError(parsed.error).message,
        });
      }

      const message = await storage.createMessage(parsed.data);
      res.status(201).json(message);
    } catch (error) {
      next(error);
    }
  });

  router.post("/conversations/:id/transcribe", requireAuth, async (req, res, next) => {
    try {
      const conversation = await storage.getConversationById(req.params.id);
      if (!conversation) {
        return res.status(404).json({ message: "Conversa não encontrada" });
      }

      const messages = await storage.getMessages(req.params.id);

      const transcript = await Promise.all(messages.map(async (msg) => {
        let name = "Sistema";
        if (msg.senderId) {
          const sender = await storage.getUser(msg.senderId);
          name = sender?.name || "Desconhecido";
        }
        const time = new Date(msg.createdAt).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
        return `[${time}] ${name}: ${msg.content.text || ''}`;
      }));

      const transcriptText = transcript.join('\n');

      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="conversa-${req.params.id}.txt"`);
      res.send(transcriptText);
    } catch (error) {
      next(error);
    }
  });

  router.patch("/conversations/:id/transfer", requireAuth, async (req, res, next) => {
    try {
      const { attendantId } = req.body;
      if (!attendantId) {
        return res.status(400).json({ message: "ID do atendente é obrigatório" });
      }

      const conversation = await storage.updateConversation(req.params.id, { assignedTo: attendantId });
      if (!conversation) {
        return res.status(404).json({ message: "Conversa não encontrada" });
      }

      res.json(conversation);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
