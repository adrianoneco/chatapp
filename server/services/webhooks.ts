import { db } from "../db";
import { webhooks as webhooksTable } from "@shared/schema";
import { eq } from "drizzle-orm";
import fs from "fs/promises";
import path from "path";

type AnyObj = Record<string, any>;

function normalizeEvents(raw: any): string[] {
  if (!raw && raw !== 0) return [];
  if (Array.isArray(raw)) return raw.map(String);
  if (typeof raw === "string") {
    // try JSON
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.map(String);
    } catch (e) {
      // ignore
    }
    return raw.split(",").map((s) => s.trim()).filter(Boolean);
  }
  if (typeof raw === "object") {
    try {
      return Object.values(raw).map(String);
    } catch (e) {
      return [];
    }
  }
  return [];
}

export async function dispatchWebhookEvent(event: string, payload: any) {
  console.log(`[webhooks] dispatchWebhookEvent called for event: ${event}`);

  try {
    const rows: any[] = await db.select().from(webhooksTable).where(eq(webhooksTable.isActive, true));

    if (!rows || rows.length === 0) {
      console.log(`[webhooks] no active webhooks found for event ${event}`);
      return;
    }

    try {
      console.log(`[webhooks] fetched ${rows.length} active webhooks`, rows.map((r) => ({ id: r.id, targetUrl: r.targetUrl, events: r.events })));
    } catch (e) {
      // ignore stringify issues
    }

    const MAX_INLINE_BYTES = parseInt(process.env.WEBHOOK_MAX_INLINE_BYTES || "102400", 10); // default 100KB

    // filter targets that subscribe to this event. If webhook.events is empty => subscribes to all
    const targets = rows.filter((r) => {
      const evs = normalizeEvents(r.events);
      return evs.length === 0 || evs.includes(event);
    });

    if (targets.length === 0) {
      console.log(`[webhooks] no matching webhooks for event ${event}`);
      return;
    }

    // helper: detect plain empty object
    const isPlainEmptyObject = (v: any) => v && typeof v === "object" && !Array.isArray(v) && Object.keys(v).length === 0;

    const convertMediaUrls = async (obj: any) => {
      if (!obj || typeof obj !== "object") return;
      if (Array.isArray(obj)) {
        await Promise.all(obj.map((it) => convertMediaUrls(it)));
        return;
      }
      for (const key of Object.keys(obj)) {
        const val = obj[key];
        if (key === "mediaUrl" && typeof val === "string" && val.startsWith("/uploads/")) {
          try {
            const rel = val.replace(/^\//, "");
            const filePath = path.join(process.cwd(), rel);
            const stat = await fs.stat(filePath).catch(() => null);
            if (!stat) {
              console.warn(`[webhooks] media not found ${val}`);
              continue;
            }
            const size = stat.size;
            if (size <= MAX_INLINE_BYTES) {
              const buf = await fs.readFile(filePath);
              const ext = path.extname(filePath).toLowerCase();
              const mimeMap: Record<string, string> = {
                ".webm": "audio/webm",
                ".mp3": "audio/mpeg",
                ".wav": "audio/wav",
                ".mp4": "video/mp4",
                ".mov": "video/quicktime",
                ".jpg": "image/jpeg",
                ".jpeg": "image/jpeg",
                ".png": "image/png",
                ".gif": "image/gif",
                ".webp": "image/webp",
                ".pdf": "application/pdf",
              };
              const mime = mimeMap[ext] || "application/octet-stream";
              obj[key] = `data:${mime};base64,${buf.toString("base64")}`;
              obj["__media_inlined"] = true;
              obj["__media_size"] = size;
            } else {
              // do not inline
              obj["__media_inlined"] = false;
              obj["__media_size"] = size;
              console.log(`[webhooks] skipping inline for ${val}, size=${size} bytes (threshold=${MAX_INLINE_BYTES})`);
            }
          } catch (e: any) {
            console.warn(`[webhooks] failed to access media ${val}: ${e?.message || e}`);
          }
        } else if (val && typeof val === "object") {
          await convertMediaUrls(val);
        }
      }
    }

    // dispatch to all matching targets concurrently
    await Promise.allSettled(targets.map(async (wk: any) => {
      try {
        // safe clone
        let clone: any;
        try {
          clone = JSON.parse(JSON.stringify(payload));
        } catch (e) {
          clone = payload;
        }

        if (clone == null || isPlainEmptyObject(clone)) {
          clone = { __emptyPayload: true, originalPayloadType: typeof payload, original: payload ?? null };
        }

        await convertMediaUrls(clone);

        const bodyObj: AnyObj = { event, timestamp: new Date().toISOString(), data: clone };

        if (isPlainEmptyObject(bodyObj.data)) {
          bodyObj.data = { __emptyPayload: true, originalType: typeof payload, original: payload ?? null };
        }

        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          "User-Agent": "ChatApp-Webhook/1.0",
          ...((wk.headers && typeof wk.headers === "object") ? wk.headers : {}),
        };

        if (wk.authType === "bearer" && wk.authPayload?.token) {
          headers["Authorization"] = `Bearer ${wk.authPayload.token}`;
        } else if (wk.authType === "api_key" && wk.authPayload?.key) {
          headers["X-API-Key"] = wk.authPayload.key;
        } else if (wk.authType === "basic" && wk.authPayload?.username && wk.authPayload?.password) {
          const creds = Buffer.from(`${wk.authPayload.username}:${wk.authPayload.password}`).toString("base64");
          headers["Authorization"] = `Basic ${creds}`;
        }

        const body = JSON.stringify(bodyObj);
        console.log(`[webhooks] sending event ${event} to ${wk.targetUrl} (body ${body.length} bytes)`);

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
      } catch (err: any) {
        console.error(`[webhooks] Error sending webhook to ${wk.targetUrl}:`, err?.message || err);
      }
    }));

  } catch (err: any) {
    console.error("[webhooks] Error fetching webhooks:", err?.message || err);
  }
}

export default { dispatchWebhookEvent };
