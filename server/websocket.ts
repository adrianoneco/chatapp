import { type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { log } from "./app";

export type WSMessage = 
  | { type: "conversation:created"; conversation: any }
  | { type: "conversation:updated"; conversation: any }
  | { type: "conversation:assigned"; conversation: any }
  | { type: "message:created"; message: any; conversationId: string }
  | { type: "message:updated"; message: any; conversationId: string }
  | { type: "message:deleted"; messageId: string; conversationId: string }
  | { type: "reaction:added"; reaction: any; messageId: string; conversationId: string }
  | { type: "user:created"; user: any }
  | { type: "user:updated"; user: any }
  | { type: "user:deleted"; id: string }
  | { type: "avatar:updated"; user: any };

let wss: WebSocketServer | null = null;

export function initWebSocketServer(httpServer: Server) {
  wss = new WebSocketServer({ server: httpServer, path: "/ws" });

  wss.on("connection", (ws) => {
    log("WebSocket client connected", "websocket");
    
    ws.on("error", (error) => {
      console.error("WebSocket error:", error);
    });

    ws.on("close", () => {
      log("WebSocket client disconnected", "websocket");
    });
  });

  log("WebSocket server initialized on path /ws", "websocket");
  return wss;
}

export function broadcastToAll(message: WSMessage) {
  if (!wss) {
    console.warn("WebSocket server not initialized");
    return;
  }

  const payload = JSON.stringify(message);
  let sentCount = 0;

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
      sentCount++;
    }
  });

  if (sentCount > 0) {
    log(`Broadcast ${message.type} to ${sentCount} clients`, "websocket");
  }
}
