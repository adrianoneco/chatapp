import { useEffect, useCallback } from "react";
import { useWebSocketEvent } from "@/lib/websocket";
import { queryClient } from "@/lib/queryClient";

interface UserEvent {
  user?: any;
  userId?: string;
  role: string;
}

export function useRealtimeUsers(role?: string) {
  // Create stable handler functions
  const handleUserCreated = useCallback((data: UserEvent) => {
    // If no specific role filter, invalidate all role-specific queries
    if (!role) {
      queryClient.invalidateQueries({ queryKey: ["/api/users?role=client"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users?role=attendant"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users?role=admin"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    } else if (data.role === role) {
      // Invalidate only the specific role query
      queryClient.invalidateQueries({ queryKey: [`/api/users?role=${role}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    }
  }, [role]);

  const handleUserUpdated = useCallback((data: UserEvent) => {
    if (!role) {
      queryClient.invalidateQueries({ queryKey: ["/api/users?role=client"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users?role=attendant"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users?role=admin"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    } else if (data.role === role) {
      queryClient.invalidateQueries({ queryKey: [`/api/users?role=${role}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    }
  }, [role]);

  const handleUserDeleted = useCallback((data: UserEvent) => {
    if (!role) {
      queryClient.invalidateQueries({ queryKey: ["/api/users?role=client"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users?role=attendant"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users?role=admin"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    } else if (data.role === role) {
      queryClient.invalidateQueries({ queryKey: [`/api/users?role=${role}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    }
  }, [role]);

  // Listen for user events
  useWebSocketEvent("user_created", handleUserCreated);
  useWebSocketEvent("user_updated", handleUserUpdated);
  useWebSocketEvent("user_deleted", handleUserDeleted);
}
