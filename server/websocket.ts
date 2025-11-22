import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "http";
import jwt from "jsonwebtoken";
import type { IncomingMessage } from "http";
import cookie from "cookie";

interface ExtendedWebSocket extends WebSocket {
  userId?: number;
  isAlive?: boolean;
}

interface WebSocketMessage {
  type: string;
  data?: any;
}

export class WSManager {
  private wss: WebSocketServer;
  private clients: Map<number, Set<ExtendedWebSocket>> = new Map();

  constructor(server: Server) {
    this.wss = new WebSocketServer({ 
      noServer: true,
      path: "/ws"
    });

    server.on("upgrade", (request: IncomingMessage, socket, head) => {
      if (request.url === "/ws") {
        this.handleUpgrade(request, socket, head);
      }
    });

    this.setupHeartbeat();
  }

  private handleUpgrade(request: IncomingMessage, socket: any, head: Buffer) {
    // Parse cookies from the request
    const cookies = request.headers.cookie ? cookie.parse(request.headers.cookie) : {};
    const token = cookies.token;

    if (!token) {
      socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
      socket.destroy();
      return;
    }

    try {
      // Verify JWT token using SESSION_SECRET (same as auth middleware)
      const jwtSecret = process.env.SESSION_SECRET;
      if (!jwtSecret) {
        throw new Error("SESSION_SECRET not configured");
      }
      const decoded = jwt.verify(token, jwtSecret) as any;
      
      // Authentication successful
      this.wss.handleUpgrade(request, socket, head, (ws) => {
        const extWs = ws as ExtendedWebSocket;
        extWs.userId = decoded.id;
        extWs.isAlive = true;
        
        this.wss.emit("connection", extWs, request);
        this.handleConnection(extWs);
      });
    } catch (error) {
      // Authentication failed
      console.error("WebSocket authentication failed:", error);
      socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
      socket.destroy();
    }
  }

  private handleConnection(ws: ExtendedWebSocket) {
    const userId = ws.userId;

    if (userId) {
      // Add client to the map
      if (!this.clients.has(userId)) {
        this.clients.set(userId, new Set());
      }
      this.clients.get(userId)!.add(ws);

      console.log(`WebSocket client connected: userId=${userId}`);
    }

    // Handle pong messages
    ws.on("pong", () => {
      ws.isAlive = true;
    });

    ws.on("message", (data: Buffer) => {
      try {
        const message: WebSocketMessage = JSON.parse(data.toString());
        this.handleMessage(ws, message);
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    });

    ws.on("close", () => {
      if (userId) {
        const userClients = this.clients.get(userId);
        if (userClients) {
          userClients.delete(ws);
          if (userClients.size === 0) {
            this.clients.delete(userId);
          }
        }
        console.log(`WebSocket client disconnected: userId=${userId}`);
      }
    });

    ws.on("error", (error) => {
      console.error("WebSocket error:", error);
    });

    // Send initial connection confirmation
    this.sendToClient(ws, {
      type: "connected",
      data: { message: "Connected to WebSocket server" },
    });
  }

  private handleMessage(ws: ExtendedWebSocket, message: WebSocketMessage) {
    switch (message.type) {
      case "ping":
        this.sendToClient(ws, { type: "pong" });
        break;
      default:
        console.log("Unknown message type:", message.type);
    }
  }

  private setupHeartbeat() {
    setInterval(() => {
      this.wss.clients.forEach((ws) => {
        const extWs = ws as ExtendedWebSocket;
        if (extWs.isAlive === false) {
          return extWs.terminate();
        }
        extWs.isAlive = false;
        extWs.ping();
      });
    }, 30000); // 30 seconds
  }

  private sendToClient(ws: ExtendedWebSocket, message: WebSocketMessage) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  // Broadcast to all clients of a specific user
  public broadcastToUser(userId: number, message: WebSocketMessage) {
    const userClients = this.clients.get(userId);
    if (userClients) {
      userClients.forEach((ws) => {
        this.sendToClient(ws, message);
      });
    }
  }

  // Broadcast to all connected clients
  public broadcastToAll(message: WebSocketMessage) {
    this.wss.clients.forEach((ws) => {
      this.sendToClient(ws as ExtendedWebSocket, message);
    });
  }

  // Broadcast to specific role users
  public broadcastToRole(message: WebSocketMessage, filter?: (userId: number) => boolean) {
    this.clients.forEach((userClients, userId) => {
      if (!filter || filter(userId)) {
        userClients.forEach((ws) => {
          this.sendToClient(ws, message);
        });
      }
    });
  }
}

let wsManager: WSManager | null = null;

export function initializeWebSocket(server: Server): WSManager {
  if (!wsManager) {
    wsManager = new WSManager(server);
    console.log("WebSocket server initialized on path /ws");
  }
  return wsManager;
}

export function getWSManager(): WSManager | null {
  return wsManager;
}
