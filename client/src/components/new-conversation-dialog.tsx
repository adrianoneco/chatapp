import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { User, InsertConversation, Channel } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { UserAvatar } from "@/components/user-avatar";
import { useWebSocket } from "@/hooks/use-websocket";
import { Search } from "lucide-react";

interface NewConversationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewConversationDialog({ open, onOpenChange }: NewConversationDialogProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { onlineUsers } = useWebSocket();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: clients = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
    select: (users) => users.filter((u) => u.role === "client"),
  });

  const { data: channels = [] } = useQuery<Channel[]>({
    queryKey: ["/api/channels"],
  });

  const createConversationMutation = useMutation({
    mutationFn: async (clientId: string) => {
      const webChannel = channels.find(c => c.slug === "web");
      if (!webChannel) {
        throw new Error("Canal web não encontrado");
      }

      const data: InsertConversation = {
        channelId: webChannel.id,
        customerContactId: clientId,
        status: "open",
      };
      
      const response = await apiRequest("POST", "/api/conversations", data);
      return await response.json();
    },
    onSuccess: (conversation) => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      onOpenChange(false);
      setLocation(`/conversations/${conversation.channelId}/${conversation.id}`);
      toast({
        title: "Conversa iniciada",
        description: "Nova conversa criada com sucesso",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message || "Erro ao criar conversa",
      });
    },
  });

  const filteredClients = clients.filter((client) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      client.name.toLowerCase().includes(query) ||
      client.email?.toLowerCase().includes(query) ||
      client.phone?.toLowerCase().includes(query)
    );
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle data-testid="text-new-conversation-title">
            Nova Conversa
          </DialogTitle>
          <DialogDescription>
            Selecione um cliente para iniciar uma conversa
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar cliente..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              data-testid="input-search-clients"
            />
          </div>

          {/* Client List */}
          <ScrollArea className="h-[400px] pr-4">
            {isLoading ? (
              <div className="text-center text-muted-foreground py-8">
                Carregando clientes...
              </div>
            ) : filteredClients.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                {searchQuery ? "Nenhum cliente encontrado" : "Nenhum cliente cadastrado"}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredClients.map((client) => {
                  const isOnline = onlineUsers.has(client.id);
                  
                  return (
                    <button
                      key={client.id}
                      onClick={() => createConversationMutation.mutate(client.id)}
                      disabled={createConversationMutation.isPending}
                      className="w-full p-3 rounded-md hover-elevate active-elevate-2 text-left"
                      data-testid={`client-item-${client.id}`}
                    >
                      <div className="flex items-center gap-3">
                        <UserAvatar
                          name={client.name}
                          avatarUrl={client.avatarUrl}
                          isOnline={isOnline}
                          size="md"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{client.name}</p>
                          <p className="text-sm text-muted-foreground truncate">
                            {client.email || client.phone || "Sem contato"}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
