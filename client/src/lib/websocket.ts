import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";

type WSMessage =
  | { type: "user:created"; user: any }
  | { type: "user:updated"; user: any }
  | { type: "user:deleted"; id: string }
  | { type: "avatar:updated"; user: any };

export function useWebSocket() {
  const queryClient = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("WebSocket connected");
    };

    ws.onmessage = (event) => {
      try {
        const message: WSMessage = JSON.parse(event.data);
        
        switch (message.type) {
          case "user:created":
          case "user:updated":
          case "user:deleted":
          case "avatar:updated":
            queryClient.invalidateQueries({ queryKey: ["/users"] });
            break;
        }
      } catch (error) {
        console.error("WebSocket message error:", error);
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    ws.onclose = () => {
      console.log("WebSocket disconnected");
    };

    return () => {
      ws.close();
    };
  }, [queryClient]);

  return wsRef.current;
}
