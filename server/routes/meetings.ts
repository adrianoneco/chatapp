import { Router } from "express";
import { storage } from "../storage";
import { requireAuth } from "../utils/validation";
import { insertMeetingSchema, updateMeetingSchema } from "@shared/schema";

const router = Router();

router.post("/meetings", requireAuth, async (req, res, next) => {
  try {
    const result = insertMeetingSchema.safeParse(req.body);
    
    if (!result.success) {
      return res.status(400).json({ message: "Dados inválidos", errors: result.error.errors });
    }
    
    const meeting = await storage.createMeeting({
      ...result.data,
      scheduledAt: new Date(result.data.scheduledAt) as any,
    }, req.user!.id);
    res.status(201).json(meeting);
  } catch (error) {
    next(error);
  }
});

router.get("/meetings", requireAuth, async (req, res, next) => {
  try {
    const meetings = await storage.getMeetings(req.user!.id);
    res.json(meetings);
  } catch (error) {
    next(error);
  }
});

router.get("/meetings/:id", requireAuth, async (req, res, next) => {
  try {
    const meeting = await storage.getMeetingById(req.params.id, req.user!.id);
    
    if (!meeting) {
      return res.status(404).json({ message: "Reunião não encontrada" });
    }
    
    res.json(meeting);
  } catch (error) {
    next(error);
  }
});

router.patch("/meetings/:id", requireAuth, async (req, res, next) => {
  try {
    const updates = updateMeetingSchema.safeParse(req.body);
    
    if (!updates.success) {
      return res.status(400).json({ message: "Dados inválidos", errors: updates.error.errors });
    }
    
    const patchData: any = { ...updates.data };
    if (patchData.scheduledAt) {
      patchData.scheduledAt = new Date(patchData.scheduledAt);
    }
    
    const meeting = await storage.updateMeeting(req.params.id, req.user!.id, patchData);
    
    if (!meeting) {
      return res.status(404).json({ message: "Reunião não encontrada" });
    }
    
    res.json(meeting);
  } catch (error) {
    next(error);
  }
});

router.delete("/meetings/:id", requireAuth, async (req, res, next) => {
  try {
    const deleted = await storage.deleteMeeting(req.params.id, req.user!.id);
    
    if (!deleted) {
      return res.status(404).json({ message: "Reunião não encontrada" });
    }
    
    res.json({ message: "Reunião excluída com sucesso" });
  } catch (error) {
    next(error);
  }
});

router.get("/m/:linkId", async (req, res, next) => {
  try {
    const meeting = await storage.getMeetingByLinkId(req.params.linkId);
    
    if (!meeting) {
      return res.status(404).json({ message: "Reunião não encontrada" });
    }
    
    if (meeting.isPublic) {
      const { createdBy, ...publicMeeting } = meeting;
      return res.json(publicMeeting);
    }
    
    if (!req.user) {
      return res.status(401).json({ message: "Autenticação necessária para acessar esta reunião" });
    }
    
    const isOwner = req.user.id === meeting.createdBy;
    
    if (!isOwner) {
      return res.status(403).json({ message: "Acesso negado. Apenas o criador pode acessar esta reunião" });
    }
    
    res.json(meeting);
  } catch (error) {
    next(error);
  }
});

export default router;
