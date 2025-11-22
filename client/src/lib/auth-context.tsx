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
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [location] = useLocation();

  // Save last visited page
  useEffect(() => {
    if (isAuthenticated && location && !location.startsWith('/login') && !location.startsWith('/register')) {
      localStorage.setItem('lastVisitedPage', location);
    }
  }, [location, isAuthenticated]);

  // Force revalidation on mount and treat 401 as null so the auth state
  // is correctly reset when the cookie is present but invalid/expired.
  const { data: user, isLoading, isFetching, dataUpdatedAt } = useQuery<SafeUser | null>({
    queryKey: ["/api/auth/me"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
    // Always refetch on mount so a page refresh triggers a call to /api/auth/me
    // and the cookie is read by the server.
    refetchOnMount: "always",
    // Also refetch on window focus to keep auth in sync across tabs.
    refetchOnWindowFocus: true,
  });

  // Mark initial load as complete once we have data (user or null)
  useEffect(() => {
    if (dataUpdatedAt > 0 && isInitialLoad) {
      setIsInitialLoad(false);
    }
  }, [dataUpdatedAt, isInitialLoad]);

  // Consider the auth state loading while the query is loading OR fetching
  // OR during initial load to prevent premature redirects
  const isLoadingAuth = isLoading || isFetching || isInitialLoad;

  useEffect(() => {
    setIsAuthenticated(!!user);
  }, [user]);

  // Temporary debug logging to observe auth state transitions in the browser
  useEffect(() => {
    try {
      // eslint-disable-next-line no-console
      console.debug("[AuthProvider] auth change", {
        user: user ? { id: user.id, email: user.email, role: user.role } : null,
        isLoading: isLoadingAuth,
        isInitialLoad,
        isFetching,
        isAuthenticated
      });
    } catch (e) { }
  }, [user, isLoadingAuth, isInitialLoad, isFetching, isAuthenticated]);

  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const res = await apiRequest("POST", "/api/auth/login", { email, password });
      // server returns the SafeUser on successful login; parse and return it
      try {
        const body = await res.json();
        return body as unknown as SafeUser;
      } catch (e) {
        return null;
      }
    },
    // Don't use onSuccess here - let the login() method control the flow
    // to avoid race conditions with setQueryData
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout", {});
    },
    onSuccess: async () => {
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
    console.debug("[AuthProvider] login starting");
    const user = await loginMutation.mutateAsync({ email, password });
    console.debug("[AuthProvider] login response received", user ? { id: user.id, email: user.email } : null);

    // If server returned the user, populate the auth query cache immediately
    // so components depending on auth don't see a transient unauthenticated state.
    if (user) {
      queryClient.setQueryData(["/api/auth/me"], user);
      // Mark initial load as complete since we have user data
      setIsInitialLoad(false);
      console.debug("[AuthProvider] user set in cache, isInitialLoad set to false");
    }

    // Don't refetch immediately - let the natural refetchOnMount handle validation
    // after the browser has time to apply the Set-Cookie headers.
    // Immediate refetch can cause race conditions where the cookie isn't yet available.
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
