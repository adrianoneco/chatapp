import { type Express } from "express";
import { eq, desc } from "drizzle-orm";
import { db } from "./db";
import { webhooks, webhookLogs } from "@shared/schema";
import { requireAuth, requireRole } from "./middleware";

export function registerWebhookRoutes(app: Express) {
  // Get all webhooks
  app.get("/api/webhooks", requireAuth, requireRole(["admin"]), async (req, res) => {
    try {
      const allWebhooks = await db.select().from(webhooks).orderBy(desc(webhooks.createdAt));
      res.json(allWebhooks);
    } catch (error) {
      console.error("Error fetching webhooks:", error);
      res.status(500).json({ message: "Erro ao buscar webhooks" });
    }
  });

  // Get webhook by ID
  app.get("/api/webhooks/:id", requireAuth, requireRole(["admin"]), async (req, res) => {
    try {
      const [webhook] = await db.select().from(webhooks).where(eq(webhooks.id, req.params.id));
      if (!webhook) {
        return res.status(404).json({ message: "Webhook não encontrado" });
      }
      res.json(webhook);
    } catch (error) {
      console.error("Error fetching webhook:", error);
      res.status(500).json({ message: "Erro ao buscar webhook" });
    }
  });

  // Create webhook
  app.post("/api/webhooks", requireAuth, requireRole(["admin"]), async (req, res) => {
    try {
      const { name, url, enabled, authType, authConfig, headers, events } = req.body;

      if (!name || !url || !authType) {
        return res.status(400).json({ message: "Nome, URL e tipo de autenticação são obrigatórios" });
      }

      const [webhook] = await db.insert(webhooks).values({
        name,
        url,
        enabled: enabled ?? true,
        authType,
        authConfig: authConfig || null,
        headers: headers || {},
        events: events || [],
      }).returning();

      res.json(webhook);
    } catch (error) {
      console.error("Error creating webhook:", error);
      res.status(500).json({ message: "Erro ao criar webhook" });
    }
  });

  // Update webhook
  app.patch("/api/webhooks/:id", requireAuth, requireRole(["admin"]), async (req, res) => {
    try {
      const { id } = req.params;
      const { name, url, enabled, authType, authConfig, headers, events } = req.body;

      const [webhook] = await db.select().from(webhooks).where(eq(webhooks.id, id));
      if (!webhook) {
        return res.status(404).json({ message: "Webhook não encontrado" });
      }

      const [updated] = await db.update(webhooks)
        .set({ 
          name, 
          url, 
          enabled, 
          authType, 
          authConfig, 
          headers, 
          events,
          updatedAt: new Date() 
        })
        .where(eq(webhooks.id, id))
        .returning();

      res.json(updated);
    } catch (error) {
      console.error("Error updating webhook:", error);
      res.status(500).json({ message: "Erro ao atualizar webhook" });
    }
  });

  // Delete webhook
  app.delete("/api/webhooks/:id", requireAuth, requireRole(["admin"]), async (req, res) => {
    try {
      const { id } = req.params;

      const [webhook] = await db.select().from(webhooks).where(eq(webhooks.id, id));
      if (!webhook) {
        return res.status(404).json({ message: "Webhook não encontrado" });
      }

      await db.delete(webhooks).where(eq(webhooks.id, id));
      res.json({ message: "Webhook deletado com sucesso" });
    } catch (error) {
      console.error("Error deleting webhook:", error);
      res.status(500).json({ message: "Erro ao deletar webhook" });
    }
  });

  // Test webhook
  app.post("/api/webhooks/:id/test", requireAuth, requireRole(["admin"]), async (req, res) => {
    try {
      const { id } = req.params;
      const { event, payload } = req.body;

      const [webhook] = await db.select().from(webhooks).where(eq(webhooks.id, id));
      if (!webhook) {
        return res.status(404).json({ message: "Webhook não encontrado" });
      }

      const testPayload = payload || {
        event: event || "test",
        timestamp: new Date().toISOString(),
        data: { message: "Test webhook payload" }
      };

      const result = await triggerWebhook(webhook, event || "test", testPayload);
      res.json(result);
    } catch (error) {
      console.error("Error testing webhook:", error);
      res.status(500).json({ message: "Erro ao testar webhook" });
    }
  });

  // Get webhook logs
  app.get("/api/webhooks/:id/logs", requireAuth, requireRole(["admin"]), async (req, res) => {
    try {
      const { id } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;

      const logs = await db.select()
        .from(webhookLogs)
        .where(eq(webhookLogs.webhookId, id))
        .orderBy(desc(webhookLogs.createdAt))
        .limit(limit);

      res.json(logs);
    } catch (error) {
      console.error("Error fetching webhook logs:", error);
      res.status(500).json({ message: "Erro ao buscar logs" });
    }
  });
}

// Helper function to trigger webhook
export async function triggerWebhook(webhook: any, eventType: string, payload: any) {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...webhook.headers
    };

    // Add authentication
    if (webhook.authType === 'apikey' && webhook.authConfig?.apikey) {
      headers[webhook.authConfig.apikey.header] = webhook.authConfig.apikey.value;
    } else if (webhook.authType === 'bearer' && webhook.authConfig?.bearer) {
      headers['Authorization'] = `Bearer ${webhook.authConfig.bearer.token}`;
    } else if (webhook.authType === 'basic' && webhook.authConfig?.basic) {
      const credentials = Buffer.from(
        `${webhook.authConfig.basic.username}:${webhook.authConfig.basic.password}`
      ).toString('base64');
      headers['Authorization'] = `Basic ${credentials}`;
    }

    const response = await fetch(webhook.url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    const responseBody = await response.text();
    const success = response.status >= 200 && response.status < 300;

    // Log the webhook call
    await db.insert(webhookLogs).values({
      webhookId: webhook.id,
      eventType,
      payload,
      responseStatus: response.status,
      responseBody,
      success,
      errorMessage: success ? null : `HTTP ${response.status}: ${response.statusText}`
    });

    return {
      success,
      status: response.status,
      statusText: response.statusText,
      body: responseBody
    };
  } catch (error: any) {
    // Log the error
    await db.insert(webhookLogs).values({
      webhookId: webhook.id,
      eventType,
      payload,
      responseStatus: null,
      responseBody: null,
      success: false,
      errorMessage: error.message
    });

    return {
      success: false,
      error: error.message
    };
  }
}

// Function to trigger webhooks for an event
export async function triggerWebhooksForEvent(eventType: string, payload: any) {
  try {
    const activeWebhooks = await db.select()
      .from(webhooks)
      .where(eq(webhooks.enabled, true));

    const promises = activeWebhooks
      .filter(webhook => webhook.events.includes(eventType))
      .map(webhook => triggerWebhook(webhook, eventType, payload));

    await Promise.allSettled(promises);
  } catch (error) {
    console.error(`Error triggering webhooks for event ${eventType}:`, error);
  }
}
