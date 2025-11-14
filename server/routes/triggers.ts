import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth";
import { db } from "../db";
import { triggersEvents } from "@shared/schema";
import { dispatchWebhookEvent } from "../services/webhooks";
import { eq } from "drizzle-orm";

const router = Router();

// Return registered triggers/events
router.get("/triggers", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const rows = await db.select().from(triggersEvents).orderBy(triggersEvents.route, triggersEvents.event as any);
    res.json(rows);
  } catch (err) {
      const e = err as any;
      console.error("[triggers] GET /api/triggers error:", e?.message || e);
    res.status(500).json({ error: "Failed to fetch triggers" });
  }
});

// Trigger an event manually for testing (protected)
router.post("/webhooks/trigger", requireAuth, requireRole("admin"), async (req, res) => {
  try {

    const { event } = req.body as { event?: string };
    if (!event) return res.status(400).json({ error: "event required" });

    // treat an empty object payload as missing and use a default diagnostic payload
    const rawPayload = (req.body as any).payload;
    let mockPayload: any;
    if (rawPayload && typeof rawPayload === 'object' && !Array.isArray(rawPayload) && Object.keys(rawPayload).length === 0) {
      mockPayload = { __emptyProvidedPayload: true, triggeredBy: (req.user as any)?.id || "api" };
    } else {
      mockPayload = rawPayload || { test: true, triggeredBy: (req.user as any)?.id || "api" };
    }

    // call dispatch and return immediately
    await dispatchWebhookEvent(event, mockPayload);

    res.json({ success: true, event });
  } catch (err: any) {
    const e = err as any;
    console.error("[triggers] POST /api/webhooks/trigger error:", e?.message || e);
    res.status(500).json({ error: "Failed to trigger event" });
  }
});

export default router;
