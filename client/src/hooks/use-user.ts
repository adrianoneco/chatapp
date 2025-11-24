import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";

export interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  phone: string | null;
  role: "client" | "attendant" | "admin";
}

export function useUser() {
  return useQuery<User>({
    queryKey: ["user"],
    queryFn: async () => {
      const result = await apiRequest<{ user: User }>("/api/user");
      return result.user;
    },
    staleTime: Infinity, // User info doesn't change often
  });
}
