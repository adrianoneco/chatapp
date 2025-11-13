import { useEffect, useRef, useState } from "react";
import { useAuth } from "./use-auth";

interface PresenceUpdate {
  userId: string;
  isOnline: boolean;
  lastSeenAt?: string;
}

interface WebRTCSignal {
  callId: string;
  type: "offer" | "answer" | "ice-candidate";
  data: any;
  fromUserId: string;
}

interface CallAction {
  callId: string;
  action: "ring" | "answer" | "reject" | "end";
  fromUserId: string;
}

type WebSocketMessage = {
  type: "presence-update";
  payload: PresenceUpdate;
} | {
  type: "webrtc-signal";
  payload: WebRTCSignal;
} | {
  type: "call-action";
  payload: CallAction;
} | {
  type: "meeting-action";
  payload: any;
} | {
  type: "auth-success";
  userId: string;
} | {
  type: "error";
  message: string;
};

export function useWebSocket() {
  const { user } = useAuth();
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  const connect = () => {
    if (!user || wsRef.current?.readyState === WebSocket.OPEN) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);

    ws.onopen = () => {
      console.log("WebSocket connected");
      setIsConnected(true);
      
      // Authenticate
      ws.send(JSON.stringify({
        type: "auth",
        payload: { userId: user.id },
      }));

      // Start heartbeat
      const heartbeat = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "presence" }));
        }
      }, 25000);

      ws.addEventListener("close", () => clearInterval(heartbeat));
    };

    ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        handleMessage(message);
      } catch (error) {
        console.error("Failed to parse WebSocket message:", error);
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    ws.onclose = () => {
      console.log("WebSocket disconnected");
      setIsConnected(false);
      wsRef.current = null;

      // Reconnect after 3 seconds
      reconnectTimeoutRef.current = setTimeout(connect, 3000);
    };

    wsRef.current = ws;
  };

  const handleMessage = (message: WebSocketMessage) => {
    switch (message.type) {
      case "presence-update":
        setOnlineUsers((prev) => {
          const next = new Set(prev);
          if (message.payload.isOnline) {
            next.add(message.payload.userId);
          } else {
            next.delete(message.payload.userId);
          }
          return next;
        });
        break;

      case "auth-success":
        console.log("WebSocket authenticated:", message.userId);
        break;

      case "error":
        console.error("WebSocket error:", message.message);
        break;

      default:
        // Other message types handled by specific hooks
        break;
    }
  };

  const sendMessage = (type: string, payload: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, payload }));
    }
  };

  const sendWebRTCSignal = (signal: Omit<WebRTCSignal, "fromUserId">) => {
    sendMessage("webrtc-signal", signal);
  };

  const sendCallAction = (action: Omit<CallAction, "fromUserId">) => {
    sendMessage("call-action", action);
  };

  useEffect(() => {
    if (user) {
      connect();
    }

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [user?.id]);

  return {
    isConnected,
    onlineUsers,
    sendWebRTCSignal,
    sendCallAction,
    sendMessage,
    ws: wsRef.current,
  };
}
