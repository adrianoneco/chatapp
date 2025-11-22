import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { ScrollArea } from "./ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Checkbox } from "./ui/checkbox";
import { Search, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ForwardMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onForward: (conversationIds: string[]) => void;
  isForwarding?: boolean;
}

export function ForwardMessageDialog({ 
  open, 
  onOpenChange, 
  onForward,
  isForwarding = false,
}: ForwardMessageDialogProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedConversations, setSelectedConversations] = useState<string[]>([]);

  const { data: conversations, isLoading } = useQuery<any[]>({
    queryKey: ["/api/conversations", "all"],
    queryFn: async () => {
      const response = await fetch("/api/conversations?status=all", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch conversations");
      return response.json();
    },
    enabled: open,
  });

  const filteredConversations = conversations?.filter(conv => {
    if (!conv || conv.deleted) return false;
    const clientName = conv.client?.name?.toLowerCase() || "";
    const protocol = conv.protocol?.toLowerCase() || "";
    const search = searchTerm.toLowerCase();
    return clientName.includes(search) || protocol.includes(search);
  }) || [];

  const toggleConversation = (conversationId: string) => {
    setSelectedConversations(prev => 
      prev.includes(conversationId)
        ? prev.filter(id => id !== conversationId)
        : [...prev, conversationId]
    );
  };

  const handleForward = () => {
    if (selectedConversations.length > 0) {
      onForward(selectedConversations);
      setSelectedConversations([]);
      setSearchTerm("");
    }
  };

  const handleClose = () => {
    setSelectedConversations([]);
    setSearchTerm("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Encaminhar Mensagem</DialogTitle>
          <DialogDescription>
            Selecione as conversas para as quais deseja encaminhar esta mensagem
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou protocolo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
            data-testid="forward-search-input"
          />
        </div>

        <ScrollArea className="flex-1 -mx-6 px-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {searchTerm ? "Nenhuma conversa encontrada" : "Nenhuma conversa disponível"}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-accent transition-colors",
                    selectedConversations.includes(conversation.id) && "bg-accent border-primary"
                  )}
                  onClick={() => toggleConversation(conversation.id)}
                  data-testid={`forward-conversation-${conversation.id}`}
                >
                  <Checkbox
                    checked={selectedConversations.includes(conversation.id)}
                    onCheckedChange={() => toggleConversation(conversation.id)}
                    data-testid={`forward-checkbox-${conversation.id}`}
                  />
                  
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={conversation.client?.image} />
                    <AvatarFallback>{conversation.client?.name?.[0] || "C"}</AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium truncate">{conversation.client?.name || "Cliente"}</p>
                      <Badge variant="secondary" className="text-xs">
                        {conversation.status === "pending" ? "Pendente" : 
                         conversation.status === "attending" ? "Atendendo" : "Encerrada"}
                      </Badge>
                    </div>
                    {conversation.protocol && (
                      <p className="text-xs text-muted-foreground font-mono">
                        Protocolo: {conversation.protocol}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="flex items-center justify-between pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            {selectedConversations.length} conversa(s) selecionada(s)
          </p>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleClose} 
              disabled={isForwarding}
              data-testid="forward-cancel-button"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleForward} 
              disabled={selectedConversations.length === 0 || isForwarding}
              data-testid="forward-submit-button"
            >
              {isForwarding ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Encaminhando...
                </>
              ) : (
                `Encaminhar para ${selectedConversations.length} conversa(s)`
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
