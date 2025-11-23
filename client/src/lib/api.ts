import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { UserPublic } from "@shared/schema";

const API_URL = "/api";

async function fetchAPI(path: string, options?: RequestInit) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Erro na requisição" }));
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

// Auth hooks
export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      return fetchAPI("/auth/login", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/auth/me"] });
    },
  });
}

export function useRegister() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { email: string; password: string; displayName: string; role?: "client" | "attendant" | "admin" }) => {
      return fetchAPI("/auth/register", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/auth/me"] });
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      return fetchAPI("/auth/logout", { method: "POST" });
    },
    onSuccess: () => {
      queryClient.clear();
    },
  });
}

export function useCurrentUser() {
  return useQuery<{ user: UserPublic }>({
    queryKey: ["/auth/me"],
    queryFn: () => fetchAPI("/auth/me"),
    retry: false,
  });
}

export function useRecoverPassword() {
  return useMutation({
    mutationFn: async (data: { email: string }) => {
      return fetchAPI("/auth/recover/request", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: async (data: { token: string; password: string }) => {
      return fetchAPI("/auth/recover/confirm", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
  });
}

// Users hooks
export function useUsers(role?: "client" | "attendant" | "admin", search?: string) {
  const params = new URLSearchParams();
  if (role) params.append("role", role);
  if (search) params.append("search", search);
  
  return useQuery<{ users: UserPublic[] }>({
    queryKey: ["/users", { role, search }],
    queryFn: () => fetchAPI(`/users?${params.toString()}`),
  });
}

export function useUser(id: string) {
  return useQuery<{ user: UserPublic }>({
    queryKey: ["/users", id],
    queryFn: () => fetchAPI(`/users/${id}`),
    enabled: !!id,
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<UserPublic> }) => {
      return fetchAPI(`/users/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/users"] });
      queryClient.invalidateQueries({ queryKey: ["/users", variables.id] });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      return fetchAPI(`/users/${id}`, { method: "DELETE" });
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["/users"] });
      queryClient.removeQueries({ queryKey: ["/users", id] });
    },
  });
}

export function useUploadAvatar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, file }: { id: string; file: File }) => {
      const formData = new FormData();
      formData.append("avatar", file);
      
      const response = await fetch(`${API_URL}/users/${id}/avatar`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: "Erro no upload" }));
        throw new Error(error.message);
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/users"] });
      queryClient.invalidateQueries({ queryKey: ["/users", variables.id] });
    },
  });
}
