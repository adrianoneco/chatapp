import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useWebSocket } from "@/hooks/use-websocket";

interface PresenceContextValue {
  onlineUsers: Set<string>;
  isUserOnline: (userId: string) => boolean;
  isConnected: boolean;
}

const PresenceContext = createContext<PresenceContextValue | undefined>(undefined);

export function PresenceProvider({ children }: { children: ReactNode }) {
  const { onlineUsers, isConnected } = useWebSocket();

  const isUserOnline = useMemo(() => {
    return (userId: string): boolean => {
      return onlineUsers.has(userId);
    };
  }, [onlineUsers]);

  const value = useMemo(() => ({
    onlineUsers,
    isUserOnline,
    isConnected
  }), [onlineUsers, isUserOnline, isConnected]);

  return (
    <PresenceContext.Provider value={value}>
      {children}
    </PresenceContext.Provider>
  );
}

export function usePresence() {
  const context = useContext(PresenceContext);
  if (!context) {
    throw new Error("usePresence must be used within a PresenceProvider");
  }
  return context;
}
