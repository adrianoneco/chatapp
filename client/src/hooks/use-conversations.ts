import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "../lib/api";

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

export interface ConversationWithDetails {
  id: string;
  protocol: string;
  channel: "webchat" | "whatsapp" | "telegram";
  clientId: string;
  attendantId: string | null;
  status: "active" | "waiting" | "closed";
  clientIp: string | null;
  clientLocation: string | null;
  createdAt: string;
  updatedAt: string;
  client: {
    id: string;
    displayName: string;
    email: string;
    avatarUrl: string | null;
    phone: string | null;
    role: string;
  } | null;
  attendant: {
    id: string;
    displayName: string;
    email: string;
    avatarUrl: string | null;
    phone: string | null;
    role: string;
  } | null;
  lastMessage?: MessageWithDetails;
  unreadCount: number;
}

export interface MessageWithDetails {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: "text" | "image" | "video" | "audio" | "document";
  mediaUrl: string | null;
  duration: string | null;
  caption: string | null;
  recorded: boolean;
  forwarded: boolean;
  deleted: boolean;
  replyToId: string | null;
  metadata: {
    audio_tags?: {
      title: string;
      artist: string;
      album?: string;
      year?: string;
      cover: string | null;
    };
    file?: {
      name: string;
      size: string;
      type: string;
    };
  } | null;
  createdAt: string;
  updatedAt: string;
  sender: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
    role: string;
  } | null;
  replyTo: MessageWithDetails | null;
  reactions: Array<{
    emoji: string;
    count: number;
  }>;
}

// Conversations hooks
export function useConversations() {
  return useQuery<ConversationWithDetails[]>({
    queryKey: ["/conversations"],
    queryFn: () => fetchAPI("/conversations"),
    refetchInterval: 5000, // Refetch every 5 seconds
  });
}

export function useConversation(id: string | undefined) {
  return useQuery<ConversationWithDetails>({
    queryKey: [`/conversations/${id}`],
    queryFn: () => fetchAPI(`/conversations/${id}`),
    enabled: !!id,
  });
}

export function useCreateConversation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { clientId?: string; channel?: string; clientLocation?: string }) => {
      return apiRequest(`/conversations`, {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/conversations"] });
    },
  });
}

export function useAssignConversation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (conversationId: string) => {
      return apiRequest(`/conversations/${conversationId}/assign`, {
        method: "PATCH",
      });
    },
    onSuccess: (_, conversationId) => {
      queryClient.invalidateQueries({ queryKey: ["/conversations"] });
      queryClient.invalidateQueries({ queryKey: [`/conversations/${conversationId}`] });
    },
  });
}

// Messages hooks
export function useMessages(conversationId: string | undefined) {
  return useQuery<MessageWithDetails[]>({
    queryKey: [`/conversations/${conversationId}/messages`],
    queryFn: () => fetchAPI(`/conversations/${conversationId}/messages`),
    enabled: !!conversationId,
    refetchInterval: 3000, // Refetch every 3 seconds
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({
      conversationId,
      data,
    }: {
      conversationId: string;
      data: {
        content: string;
        type?: "text" | "image" | "video" | "audio" | "document";
        mediaUrl?: string;
        duration?: string;
        caption?: string;
        recorded?: boolean;
        forwarded?: boolean;
        replyToId?: string;
        metadata?: any;
      };
    }) => {
      return apiRequest(`/conversations/${conversationId}/messages`, {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: (_, { conversationId }) => {
      queryClient.invalidateQueries({ 
        queryKey: [`/conversations/${conversationId}/messages`] 
      });
      queryClient.invalidateQueries({ queryKey: ["/conversations"] });
    },
  });
}

export function useDeleteMessage() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ messageId, conversationId }: { messageId: string; conversationId: string }) => {
      return apiRequest(`/messages/${messageId}`, {
        method: "PATCH",
        body: JSON.stringify({ deleted: true }),
      });
    },
    onSuccess: (_, { conversationId }) => {
      queryClient.invalidateQueries({ 
        queryKey: [`/conversations/${conversationId}/messages`] 
      });
    },
  });
}

export function useAddReaction() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({
      messageId,
      conversationId,
      emoji,
    }: {
      messageId: string;
      conversationId: string;
      emoji: string;
    }) => {
      return apiRequest(`/messages/${messageId}/reactions`, {
        method: "POST",
        body: JSON.stringify({ emoji }),
      });
    },
    onSuccess: (_, { conversationId }) => {
      queryClient.invalidateQueries({ 
        queryKey: [`/conversations/${conversationId}/messages`] 
      });
    },
  });
}
