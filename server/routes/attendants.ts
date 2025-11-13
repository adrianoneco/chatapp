import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import { storage } from "../storage";
import { requireAdmin } from "../utils/validation";
import { hashPassword } from "../auth";
import { insertAttendantSchema, updateAttendantSchema, type PublicUser } from "@shared/schema";

const router = Router();

router.post("/attendants", requireAdmin, async (req, res, next) => {
  try {
    const result = insertAttendantSchema.safeParse(req.body);
    
    if (!result.success) {
      return res.status(400).json({ message: "Dados inválidos", errors: result.error.errors });
    }

    const existingUsername = await storage.getUserByUsername(result.data.username);
    if (existingUsername) {
      return res.status(400).json({ message: "Username já está em uso" });
    }

    const existingEmail = await storage.getUserByEmail(result.data.email);
    if (existingEmail) {
      return res.status(400).json({ message: "Email já está em uso" });
    }

    const hashedPassword = await hashPassword(result.data.password);
    const attendant = await storage.createAttendant({
      ...result.data,
      password: hashedPassword,
    });

    const { password, ...publicAttendant } = attendant;
    res.status(201).json(publicAttendant);
  } catch (error) {
    next(error);
  }
});

router.get("/attendants", requireAdmin, async (req, res, next) => {
  try {
    const attendants = await storage.getAttendants();
    const publicAttendants = attendants.map(({ password, ...rest }) => rest);
    res.json(publicAttendants);
  } catch (error) {
    next(error);
  }
});

router.get("/attendants/:id", requireAdmin, async (req, res, next) => {
  try {
    const attendant = await storage.getAttendantById(req.params.id);
    
    if (!attendant) {
      return res.status(404).json({ message: "Atendente não encontrado" });
    }

    const { password, ...publicAttendant } = attendant;
    res.json(publicAttendant);
  } catch (error) {
    next(error);
  }
});

router.patch("/attendants/:id", requireAdmin, async (req, res, next) => {
  try {
    const result = updateAttendantSchema.safeParse(req.body);
    
    if (!result.success) {
      return res.status(400).json({ message: "Dados inválidos", errors: result.error.errors });
    }

    const existingAttendant = await storage.getAttendantById(req.params.id);
    if (!existingAttendant) {
      return res.status(404).json({ message: "Atendente não encontrado" });
    }

    if (result.data.username && result.data.username !== existingAttendant.username) {
      const usernameExists = await storage.getUserByUsername(result.data.username);
      if (usernameExists) {
        return res.status(400).json({ message: "Username já está em uso" });
      }
    }

    if (result.data.email && result.data.email !== existingAttendant.email) {
      const emailExists = await storage.getUserByEmail(result.data.email);
      if (emailExists) {
        return res.status(400).json({ message: "Email já está em uso" });
      }
    }

    const updates: any = { ...result.data };
    if (result.data.password) {
      updates.password = await hashPassword(result.data.password);
    }

    const attendant = await storage.updateAttendant(req.params.id, updates);
    
    if (!attendant) {
      return res.status(404).json({ message: "Atendente não encontrado" });
    }

    const { password, ...publicAttendant } = attendant;
    res.json(publicAttendant);
  } catch (error) {
    next(error);
  }
});

router.delete("/attendants/:id", requireAdmin, async (req, res, next) => {
  try {
    const existingAttendant = await storage.getAttendantById(req.params.id);
    if (!existingAttendant) {
      return res.status(404).json({ message: "Atendente não encontrado" });
    }

    const deleted = await storage.deleteAttendant(req.params.id);
    
    if (!deleted) {
      return res.status(404).json({ message: "Atendente não encontrado" });
    }

    res.status(200).json({ message: "Atendente excluído com sucesso" });
  } catch (error) {
    next(error);
  }
});

export default router;
