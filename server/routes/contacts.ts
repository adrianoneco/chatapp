import { Router } from "express";
import { storage } from "../storage";
import { requireAuth } from "../utils/validation";
import { insertClientSchema, updateClientSchema, type User } from "@shared/schema";

const router = Router();

function sanitizeUser(user: User) {
  const { password, ...publicUser } = user;
  return publicUser;
}

router.post("/contacts", requireAuth, async (req, res, next) => {
  try {
    const result = insertClientSchema.safeParse(req.body);
    
    if (!result.success) {
      return res.status(400).json({ message: "Dados inválidos", errors: result.error.errors });
    }
    
    const client = await storage.createClient(result.data, req.user!.id);
    res.status(201).json(sanitizeUser(client));
  } catch (error) {
    next(error);
  }
});

router.get("/contacts", requireAuth, async (req, res, next) => {
  try {
    // Return all users with role = 'client'
    const clients = await storage.getAllClients();
    res.json(clients.map(sanitizeUser));
  } catch (error) {
    next(error);
  }
});

router.get("/contacts/:id", requireAuth, async (req, res, next) => {
  try {
    const client = await storage.getClientById(req.params.id, req.user!.id);
    
    if (!client) {
      return res.status(404).json({ message: "Contato não encontrado" });
    }
    
    res.json(sanitizeUser(client));
  } catch (error) {
    next(error);
  }
});

router.patch("/contacts/:id", requireAuth, async (req, res, next) => {
  try {
    const updates = updateClientSchema.safeParse(req.body);
    
    if (!updates.success) {
      return res.status(400).json({ message: "Dados inválidos", errors: updates.error.errors });
    }
    
    const client = await storage.updateClient(req.params.id, req.user!.id, updates.data);
    
    if (!client) {
      return res.status(404).json({ message: "Contato não encontrado" });
    }
    
    res.json(sanitizeUser(client));
  } catch (error) {
    next(error);
  }
});

router.delete("/contacts/:id", requireAuth, async (req, res, next) => {
  try {
    const deleted = await storage.deleteClient(req.params.id, req.user!.id);
    
    if (!deleted) {
      return res.status(404).json({ message: "Contato não encontrado" });
    }
    
    res.json({ message: "Contato excluído com sucesso" });
  } catch (error) {
    next(error);
  }
});

export default router;
