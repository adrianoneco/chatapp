import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";

type WSMessage =
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

export function useWebSocket() {
  const queryClient = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Connect to websocket on same server but separate path (/ws)
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("WebSocket connected to", wsUrl);
    };

    ws.onmessage = (event) => {
      try {
        const message: WSMessage = JSON.parse(event.data);
        
        switch (message.type) {
          case "conversation:created":
          case "conversation:updated":
          case "conversation:assigned":
            queryClient.invalidateQueries({ queryKey: ["/conversations"] });
            if (message.conversation?.id) {
              queryClient.invalidateQueries({ queryKey: [`/conversations/${message.conversation.id}`] });
            }
            break;
          
          case "message:created":
          case "message:updated":
          case "message:deleted":
            queryClient.invalidateQueries({ queryKey: [`/conversations/${message.conversationId}/messages`] });
            queryClient.invalidateQueries({ queryKey: ["/conversations"] });
            break;
          
          case "reaction:added":
            queryClient.invalidateQueries({ queryKey: [`/conversations/${message.conversationId}/messages`] });
            break;
          
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
