import { Router } from "express";
import { storage } from "../storage";
import { requireAuth } from "../utils/validation";
import { insertContactSchema } from "@shared/schema";

const router = Router();

router.post("/contacts", requireAuth, async (req, res, next) => {
  try {
    const result = insertContactSchema.safeParse({ ...req.body, userId: req.user!.id });
    
    if (!result.success) {
      return res.status(400).json({ message: "Dados inválidos", errors: result.error.errors });
    }
    
    const contact = await storage.createContact(result.data);
    res.status(201).json(contact);
  } catch (error) {
    next(error);
  }
});

router.get("/contacts", requireAuth, async (req, res, next) => {
  try {
    const contacts = await storage.getContacts(req.user!.id);
    res.json(contacts);
  } catch (error) {
    next(error);
  }
});

router.get("/contacts/:id", requireAuth, async (req, res, next) => {
  try {
    const contact = await storage.getContactById(req.params.id, req.user!.id);
    
    if (!contact) {
      return res.status(404).json({ message: "Contato não encontrado" });
    }
    
    res.json(contact);
  } catch (error) {
    next(error);
  }
});

router.patch("/contacts/:id", requireAuth, async (req, res, next) => {
  try {
    const updates = insertContactSchema.partial().omit({ userId: true }).safeParse(req.body);
    
    if (!updates.success) {
      return res.status(400).json({ message: "Dados inválidos", errors: updates.error.errors });
    }
    
    const contact = await storage.updateContact(req.params.id, req.user!.id, updates.data);
    
    if (!contact) {
      return res.status(404).json({ message: "Contato não encontrado" });
    }
    
    res.json(contact);
  } catch (error) {
    next(error);
  }
});

router.delete("/contacts/:id", requireAuth, async (req, res, next) => {
  try {
    const deleted = await storage.deleteContact(req.params.id, req.user!.id);
    
    if (!deleted) {
      return res.status(404).json({ message: "Contato não encontrado" });
    }
    
    res.json({ message: "Contato excluído com sucesso" });
  } catch (error) {
    next(error);
  }
});

export default router;
