import { WebSocketServer, WebSocket } from "ws";
import { Server } from "http";
import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

interface WebSocketClient extends WebSocket {
  userId?: string;
  isAlive?: boolean;
}

interface WebRTCSignal {
  type: "offer" | "answer" | "ice-candidate";
  callId: string;
  targetUserId: string;
  data: any;
}

interface PresenceUpdate {
  userId: string;
  isOnline: boolean;
  lastSeenAt?: Date;
}

export class WebSocketManager {
  private wss: WebSocketServer;
  private clients: Map<string, WebSocketClient> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor(server: Server) {
    this.wss = new WebSocketServer({ server, path: "/ws" });
    this.initialize();
  }

  private initialize() {
    this.wss.on("connection", (ws: WebSocketClient) => {
      console.log("New WebSocket connection");

      ws.isAlive = true;

      ws.on("pong", () => {
        ws.isAlive = true;
      });

      ws.on("message", async (message: string) => {
        try {
          const data = JSON.parse(message.toString());
          await this.handleMessage(ws, data);
        } catch (error) {
          console.error("WebSocket message error:", error);
          ws.send(JSON.stringify({ type: "error", message: "Invalid message format" }));
        }
      });

      ws.on("close", () => {
        if (ws.userId) {
          this.handleUserDisconnect(ws.userId);
        }
      });

      ws.on("error", (error) => {
        console.error("WebSocket error:", error);
      });
    });

    // Start heartbeat
    this.heartbeatInterval = setInterval(() => {
      this.wss.clients.forEach((ws: WebSocketClient) => {
        if (ws.isAlive === false) {
          if (ws.userId) {
            this.handleUserDisconnect(ws.userId);
          }
          return ws.terminate();
        }

        ws.isAlive = false;
        ws.ping();
      });
    }, 30000); // 30 seconds
  }

  private async handleMessage(ws: WebSocketClient, data: any) {
    const { type, payload } = data;

    switch (type) {
      case "auth":
        await this.handleAuth(ws, payload.userId);
        break;

      case "webrtc-signal":
        await this.handleWebRTCSignal(ws, payload as WebRTCSignal);
        break;

      case "call-action":
        await this.handleCallAction(ws, payload);
        break;

      case "presence":
        await this.handlePresenceUpdate(ws, payload);
        break;

      case "meeting-action":
        await this.handleMeetingAction(ws, payload);
        break;

      default:
        console.log("Unknown message type:", type);
    }
  }

  private async handleAuth(ws: WebSocketClient, userId: string) {
    if (!userId) {
      ws.send(JSON.stringify({ type: "error", message: "User ID required" }));
      return;
    }

    // Remove old connection if exists
    if (this.clients.has(userId)) {
      const oldClient = this.clients.get(userId);
      oldClient?.close();
    }

    ws.userId = userId;
    this.clients.set(userId, ws);

    // Update user online status
    await db.update(users)
      .set({ isOnline: true, lastSeenAt: new Date() })
      .where(eq(users.id, userId));

    ws.send(JSON.stringify({ type: "auth-success", userId }));

    // Broadcast presence update
    this.broadcastPresenceUpdate({ userId, isOnline: true });

    console.log(`User ${userId} authenticated via WebSocket`);
  }

  private async handleWebRTCSignal(ws: WebSocketClient, signal: WebRTCSignal) {
    const { targetUserId, callId, type, data } = signal;

    const targetClient = this.clients.get(targetUserId);
    if (targetClient && targetClient.readyState === WebSocket.OPEN) {
      targetClient.send(JSON.stringify({
        type: "webrtc-signal",
        payload: {
          callId,
          type,
          data,
          fromUserId: ws.userId,
        },
      }));
    } else {
      ws.send(JSON.stringify({
        type: "error",
        message: "Target user not connected",
      }));
    }
  }

  private async handleCallAction(ws: WebSocketClient, payload: any) {
    const { action, callId, targetUserId } = payload;

    const targetClient = this.clients.get(targetUserId);
    if (targetClient && targetClient.readyState === WebSocket.OPEN) {
      targetClient.send(JSON.stringify({
        type: "call-action",
        payload: {
          action,
          callId,
          fromUserId: ws.userId,
        },
      }));
    }
  }

  private async handlePresenceUpdate(ws: WebSocketClient, payload: any) {
    if (!ws.userId) return;

    await db.update(users)
      .set({ lastSeenAt: new Date() })
      .where(eq(users.id, ws.userId));

    ws.isAlive = true;
  }

  private async handleMeetingAction(ws: WebSocketClient, payload: any) {
    const { meetingId, action, data } = payload;

    // Broadcast to all clients in the meeting
    this.wss.clients.forEach((client: WebSocketClient) => {
      if (client.readyState === WebSocket.OPEN && client.userId !== ws.userId) {
        client.send(JSON.stringify({
          type: "meeting-action",
          payload: {
            meetingId,
            action,
            data,
            fromUserId: ws.userId,
          },
        }));
      }
    });
  }

  private async handleUserDisconnect(userId: string) {
    this.clients.delete(userId);

    // Update user offline status
    await db.update(users)
      .set({ isOnline: false, lastSeenAt: new Date() })
      .where(eq(users.id, userId));

    // Broadcast presence update
    this.broadcastPresenceUpdate({ userId, isOnline: false, lastSeenAt: new Date() });

    console.log(`User ${userId} disconnected`);
  }

  private broadcastPresenceUpdate(update: PresenceUpdate) {
    const message = JSON.stringify({
      type: "presence-update",
      payload: update,
    });

    this.wss.clients.forEach((client: WebSocketClient) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  public sendToUser(userId: string, message: any) {
    const client = this.clients.get(userId);
    if (client && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  }

  public destroy() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    this.wss.close();
  }
}
