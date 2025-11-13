import { db } from "../db";
import { webhooks as webhooksTable, type Webhook } from "@shared/schema";

export async function dispatchWebhookEvent(event: string, payload: any) {
  try {
    const all = await db.select().from(webhooksTable).where({ isActive: true } as any);
    const targets: Webhook[] = all.filter((w: any) => (w.events || []).includes(event));

    for (const wk of targets) {
      (async () => {
        try {
          const headers: Record<string, string> = {
            "Content-Type": "application/json",
            "User-Agent": "ChatApp-Webhook/1.0",
            ...(wk.headers || {}),
          };

          if (wk.authType === "bearer" && wk.authPayload?.token) {
            headers["Authorization"] = `Bearer ${wk.authPayload.token}`;
          } else if (wk.authType === "api_key" && wk.authPayload?.key) {
            headers["X-API-Key"] = wk.authPayload.key;
          } else if (wk.authType === "basic" && wk.authPayload?.username && wk.authPayload?.password) {
            const creds = Buffer.from(`${wk.authPayload.username}:${wk.authPayload.password}`).toString("base64");
            headers["Authorization"] = `Basic ${creds}`;
          }

          const body = JSON.stringify({ event, timestamp: new Date().toISOString(), data: payload });

          const res = await fetch(wk.targetUrl, {
            method: "POST",
            headers,
            body,
          });

          if (!res.ok) {
            const text = await res.text().catch(() => "");
            console.error(`[webhooks] Failed to deliver event ${event} to ${wk.targetUrl}: ${res.status} ${res.statusText} - ${text}`);
          } else {
            console.log(`[webhooks] Dispatched event ${event} to ${wk.targetUrl}`);
          }
        } catch (err) {
          console.error(`[webhooks] Error sending webhook to ${wk.targetUrl}:`, err?.message || err);
        }
      })();
    }
  } catch (err) {
    console.error("[webhooks] Error fetching webhooks:", err?.message || err);
  }
}

export default { dispatchWebhookEvent };
