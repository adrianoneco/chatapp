import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import type { SafeUser } from "@shared/schema";
import { queryClient, apiRequest, getQueryFn } from "./queryClient";

interface AuthContextType {
  user: SafeUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [location] = useLocation();

  // Save last visited page
  useEffect(() => {
    if (isAuthenticated && location && !location.startsWith('/login') && !location.startsWith('/register')) {
      localStorage.setItem('lastVisitedPage', location);
    }
  }, [location, isAuthenticated]);

  // Force revalidation on mount and treat 401 as null so the auth state
  // is correctly reset when the cookie is present but invalid/expired.
  const { data: user, isLoading, isFetching } = useQuery<SafeUser>({
    queryKey: ["/api/auth/me"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
    // Always refetch on mount so a page refresh triggers a call to /api/auth/me
    // and the cookie is read by the server.
    refetchOnMount: "always",
    // Also refetch on window focus to keep auth in sync across tabs.
    refetchOnWindowFocus: true,
  });

  // Consider the auth state loading while the query is loading OR fetching
  // so that UI (ProtectedRoute, WebSocket) doesn't treat the user as
  // unauthenticated while a background refetch is happening.
  const isLoadingAuth = isLoading || isFetching;

  useEffect(() => {
    setIsAuthenticated(!!user);
  }, [user]);

  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const res = await apiRequest("POST", "/api/auth/login", { email, password });
      // Attempt to parse JSON to read potential dev fallback token
      try {
        const json = await res.json();
        return json;
      } catch (e) {
        return null;
      }
    },
    onSuccess: async (data: any) => {
      // If backend returned a dev token (development fallback), persist it
      if (data?.token) {
        try {
          localStorage.setItem("devToken", data.token);
        } catch (e) { }
      }

      await queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      await queryClient.refetchQueries({ queryKey: ["/api/auth/me"] });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout", {});
    },
    onSuccess: async () => {
      try {
        localStorage.removeItem("devToken");
      } catch (e) { }

      // Set query data to null immediately
      queryClient.setQueryData(["/api/auth/me"], null);
      // Clear all other queries except auth
      const queries = queryClient.getQueryCache().getAll();
      queries.forEach((query) => {
        const key = query.queryKey[0];
        if (key !== "/api/auth/me") {
          queryClient.removeQueries({ queryKey: query.queryKey });
        }
      });
      // Don't clear lastVisitedPage so user can return to it after login
    },
  });

  const login = async (email: string, password: string) => {
    await loginMutation.mutateAsync({ email, password });
  };

  const logout = async () => {
    await logoutMutation.mutateAsync();
  };

  return (
    <AuthContext.Provider value={{ user: user || null, isLoading: isLoadingAuth, login, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
}
