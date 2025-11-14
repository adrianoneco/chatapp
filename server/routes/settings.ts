import { Router } from "express";
import { storage } from "../storage";
import { requireAuth, requireRole } from "../middleware/auth";
import { insertWebhookSchema, insertEvolutionInstanceSchema } from "@shared/schema";
import { randomBytes } from "crypto";
import { nanoid } from "nanoid";

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
  const userId = (req.user as any)?.id || null;
  const webhook = await storage.createWebhook(parsed.data, userId);
    res.status(201).json(webhook);
  } catch (error) {
    console.error("[routes] POST /api/webhooks error:", error);
    const err: any = error;
    const payload: any = { error: "Failed to create webhook" };
    // Provide additional debug details when not in production
    if (process.env.NODE_ENV !== "production") {
      payload.details = err.message || String(err);
      if (err.code) payload.code = err.code;
      if (err.constraint) payload.constraint = err.constraint;
      if (err.detail) payload.detail = err.detail;
      // include stack for local debugging
      payload.stack = err.stack;
    }
    res.status(500).json(payload);
  }
});

router.put("/webhooks/:id", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const parsed = insertWebhookSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.message });
    }
    const webhook = await storage.updateWebhook(req.params.id, parsed.data, req.user!.id);
    if (!webhook) {
      return res.status(404).json({ error: "Webhook not found" });
    }
    res.json(webhook);
  } catch (error) {
    res.status(500).json({ error: "Failed to update webhook" });
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

router.post("/webhooks/generate-key", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const apiKey = randomBytes(32).toString("hex").toUpperCase();
    res.json({ key: apiKey });
  } catch (error) {
    res.status(500).json({ error: "Failed to generate API key" });
  }
});

router.post("/webhooks/generate-jwt", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const jwtToken = `eyJ${nanoid(16)}.${nanoid(32)}.${nanoid(43)}`;
    res.json({ token: jwtToken });
  } catch (error) {
    res.status(500).json({ error: "Failed to generate JWT token" });
  }
});

router.post("/webhooks/:id/test", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const webhook = await storage.getWebhookById(req.params.id, req.user!.id);
    if (!webhook) {
      return res.status(404).json({ error: "Webhook not found" });
    }

    if (!webhook.targetUrl || !webhook.targetUrl.startsWith("http")) {
      return res.status(400).json({ 
        success: false,
        error: "Invalid webhook URL",
      });
    }

    const mockData = {
      event: "message.created",
      timestamp: new Date().toISOString(),
      data: {
        id: nanoid(),
        conversationId: nanoid(),
        senderId: req.user!.id,
        senderName: req.user!.name,
        text: "Esta é uma mensagem de teste do webhook",
        createdAt: new Date().toISOString(),
      },
      metadata: {
        source: "chatapp_webhook_test",
        version: "1.0",
      },
    };

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "User-Agent": "ChatApp-Webhook/1.0",
      ...(webhook.headers || {}),
    };

    if (webhook.authType === "bearer" && webhook.authPayload?.token) {
      headers["Authorization"] = `Bearer ${webhook.authPayload.token}`;
    } else if (webhook.authType === "api_key" && webhook.authPayload?.key) {
      headers["X-API-Key"] = webhook.authPayload.key;
    } else if (webhook.authType === "basic" && webhook.authPayload?.username && webhook.authPayload?.password) {
      const credentials = Buffer.from(`${webhook.authPayload.username}:${webhook.authPayload.password}`).toString("base64");
      headers["Authorization"] = `Basic ${credentials}`;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const startTime = Date.now();
    const response = await fetch(webhook.targetUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(mockData),
      signal: controller.signal,
    });

    clearTimeout(timeout);
    const duration = Date.now() - startTime;
    const responseText = await response.text();
    
    let responseBody;
    try {
      responseBody = JSON.parse(responseText);
    } catch {
      responseBody = responseText;
    }

    res.json({
      success: response.ok,
      status: response.status,
      statusText: response.statusText,
      duration,
      mockData,
      response: responseBody,
      headers: Object.fromEntries(response.headers.entries()),
    });
  } catch (error: any) {
    if (error.name === "AbortError") {
      return res.status(408).json({ 
        success: false,
        error: "Webhook test timeout (10s)",
      });
    }
    res.status(500).json({ 
      success: false,
      error: error.message || "Failed to test webhook",
    });
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
