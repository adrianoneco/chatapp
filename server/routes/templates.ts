import { Router } from "express";
import { storage } from "../storage";
import { requireAuth } from "../middleware/auth";
import { insertResponseTemplateSchema, updateResponseTemplateSchema } from "@shared/schema";
import { ZodError } from "zod";

const router = Router();

router.get("/templates", requireAuth, async (req, res) => {
  try {
    const templates = await storage.getResponseTemplates(req.user!.id);
    res.json(templates);
  } catch (error) {
    console.error("[templates] Error getting templates:", error);
    res.status(500).json({ error: "Erro ao carregar templates" });
  }
});

router.get("/templates/:id", requireAuth, async (req, res) => {
  try {
    const template = await storage.getResponseTemplateById(req.params.id, req.user!.id);
    if (!template) {
      return res.status(404).json({ error: "Template não encontrado" });
    }
    res.json(template);
  } catch (error) {
    console.error("[templates] Error getting template:", error);
    res.status(500).json({ error: "Erro ao carregar template" });
  }
});

router.post("/templates", requireAuth, async (req, res) => {
  try {
    const validated = insertResponseTemplateSchema.parse(req.body);
    const template = await storage.createResponseTemplate(validated, req.user!.id);
    res.status(201).json(template);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: "Dados inválidos", details: error.errors });
    }
    console.error("[templates] Error creating template:", error);
    res.status(500).json({ error: "Erro ao criar template" });
  }
});

router.patch("/templates/:id", requireAuth, async (req, res) => {
  try {
    const validated = updateResponseTemplateSchema.parse(req.body);
    const template = await storage.updateResponseTemplate(req.params.id, req.user!.id, validated);
    if (!template) {
      return res.status(404).json({ error: "Template não encontrado" });
    }
    res.json(template);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: "Dados inválidos", details: error.errors });
    }
    console.error("[templates] Error updating template:", error);
    res.status(500).json({ error: "Erro ao atualizar template" });
  }
});

router.delete("/templates/:id", requireAuth, async (req, res) => {
  try {
    const deleted = await storage.deleteResponseTemplate(req.params.id, req.user!.id);
    if (!deleted) {
      return res.status(404).json({ error: "Template não encontrado" });
    }
    res.status(204).send();
  } catch (error) {
    console.error("[templates] Error deleting template:", error);
    res.status(500).json({ error: "Erro ao deletar template" });
  }
});

export default router;
