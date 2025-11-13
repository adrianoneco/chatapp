import "dotenv/config";
import { storage } from "../server/storage";

async function run() {
  try {
    const webhookData = {
      name: "Script Test Webhook",
      targetUrl: "https://example.com/webhook",
      authType: "none",
      authPayload: {},
      events: ["message.created"],
      headers: {},
      isActive: true,
    } as any;

    // Pass null as user id to avoid FK issues (createdBy is nullable)
    const result = await storage.createWebhook(webhookData, null as any);
    console.log("Created webhook:", result);
  } catch (err: any) {
    console.error("Error creating webhook:", err?.message || err, err?.stack || "no stack");
    if (err?.cause) console.error("Cause:", err.cause);
    process.exit(1);
  }
}

run();
