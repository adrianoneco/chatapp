import { Router } from "express";
import { storage } from "../storage";
import { requireAuth, requireRole } from "../middleware/auth";
import { insertWebhookSchema, insertEvolutionInstanceSchema } from "@shared/schema";

const router = Router();

router.get("/webhooks", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const webhooks = await storage.getWebhooks(req.user!.id);
    res.json(webhooks);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch webhooks" });
  }
});

router.post("/webhooks", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const parsed = insertWebhookSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.message });
    }
    const webhook = await storage.createWebhook(parsed.data, req.user!.id);
    res.status(201).json(webhook);
  } catch (error) {
    res.status(500).json({ error: "Failed to create webhook" });
  }
});

router.delete("/webhooks/:id", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const success = await storage.deleteWebhook(req.params.id, req.user!.id);
    if (!success) {
      return res.status(404).json({ error: "Webhook not found" });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: "Failed to delete webhook" });
  }
});

router.get("/evolution-instances", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const instances = await storage.getEvolutionInstances();
    res.json(instances);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch evolution instances" });
  }
});

router.post("/evolution-instances", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const parsed = insertEvolutionInstanceSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.message });
    }
    const instance = await storage.createEvolutionInstance(parsed.data);
    res.status(201).json(instance);
  } catch (error) {
    res.status(500).json({ error: "Failed to create evolution instance" });
  }
});

router.delete("/evolution-instances/:id", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const success = await storage.deleteEvolutionInstance(req.params.id);
    if (!success) {
      return res.status(404).json({ error: "Instance not found" });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: "Failed to delete evolution instance" });
  }
});

export default router;
