import { Router } from "express";
import { db } from "../db";
import { channels } from "@shared/schema";
import { eq } from "drizzle-orm";
import { evolutionService } from "../services/evolution";

const router = Router();

router.post("/evolution/:channelId", async (req, res) => {
  try {
    const { channelId } = req.params;
    const webhookData = req.body;

    console.log("[WEBHOOK] Evolution incoming:", { channelId, event: webhookData.event });

    const channel = await db.query.channels.findFirst({
      where: eq(channels.id, channelId),
    });

    if (!channel) {
      return res.status(404).json({ error: "Channel not found" });
    }

    if (webhookData.event === "messages.upsert") {
      const messages = webhookData.data?.messages || [];
      
      for (const message of messages) {
        if (message.key.fromMe) {
          console.log("[WEBHOOK] Ignoring outbound message");
          continue;
        }

        await evolutionService.processIncomingMessage(message, channelId);
        console.log("[WEBHOOK] Processed message:", message.key.id);
      }
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error("[WEBHOOK] Evolution error:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
