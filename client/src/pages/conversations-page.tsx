import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Conversation, Message, InsertMessage } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Send, User } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function ConversationsPage() {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");
  const { toast } = useToast();

  const { data: conversations = [], isLoading: loadingConversations } = useQuery<Conversation[]>({
    queryKey: ["/api/conversations"],
  });

  const { data: messages = [], isLoading: loadingMessages } = useQuery<Message[]>({
    queryKey: ["/api/conversations", selectedConversation, "messages"],
    enabled: !!selectedConversation,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (data: InsertMessage) => {
      return await apiRequest("POST", `/api/conversations/${selectedConversation}/messages`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations", selectedConversation, "messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      setMessageText("");
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message || "Erro ao enviar mensagem",
      });
    },
  });

  const handleSendMessage = () => {
    if (!messageText.trim() || !selectedConversation) return;

    sendMessageMutation.mutate({
      conversationId: selectedConversation,
      senderType: "user",
      direction: "outbound",
      content: { text: messageText },
      messageType: "text",
    });
  };

  const formatMessageTime = (date: string | Date) => {
    return format(new Date(date), "HH:mm", { locale: ptBR });
  };

  const formatConversationTime = (date: string | Date | null) => {
    if (!date) return "";
    const messageDate = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (messageDate.toDateString() === today.toDateString()) {
      return format(messageDate, "HH:mm", { locale: ptBR });
    } else if (messageDate.toDateString() === yesterday.toDateString()) {
      return "Ontem";
    } else {
      return format(messageDate, "dd/MM/yyyy", { locale: ptBR });
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] gap-0">
      {/* Lista de Conversas - Esquerda */}
      <div className="w-80 border-r border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-semibold" data-testid="text-conversations-title">
            Conversas
          </h2>
        </div>
        <ScrollArea className="flex-1">
          {loadingConversations ? (
            <div className="p-4 text-center text-muted-foreground" data-testid="text-loading-conversations">
              Carregando...
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-6 text-center">
              <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground" data-testid="text-no-conversations">
                Nenhuma conversa ainda
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {conversations.map((conversation) => (
                <button
                  key={conversation.id}
                  onClick={() => setSelectedConversation(conversation.id)}
                  className={`w-full p-4 text-left transition-colors hover-elevate active-elevate-2 ${
                    selectedConversation === conversation.id
                      ? "bg-accent"
                      : ""
                  }`}
                  data-testid={`conversation-item-${conversation.id}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="rounded-full bg-muted p-2">
                      <User className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium truncate">
                          {conversation.externalContactId || "Contato Desconhecido"}
                        </p>
                        <span className="text-xs text-muted-foreground">
                          {formatConversationTime(conversation.lastMessageAt)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        Canal: {conversation.channelId === "00000000-0000-0000-0000-000000000001" ? "Web" : "Outro"}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Área de Mensagens - Direita */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Cabeçalho */}
            <div className="p-4 border-b border-border flex items-center gap-3">
              <div className="rounded-full bg-muted p-2">
                <User className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold" data-testid="text-conversation-contact">
                  {conversations.find((c) => c.id === selectedConversation)?.externalContactId || "Contato"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {conversations.find((c) => c.id === selectedConversation)?.status}
                </p>
              </div>
            </div>

            {/* Mensagens */}
            <ScrollArea className="flex-1 p-4">
              {loadingMessages ? (
                <div className="text-center text-muted-foreground" data-testid="text-loading-messages">
                  Carregando mensagens...
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground" data-testid="text-no-messages">
                    Nenhuma mensagem ainda
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.direction === "outbound" ? "justify-end" : "justify-start"}`}
                      data-testid={`message-${message.id}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md xl:max-w-lg px-4 py-2 rounded-lg ${
                          message.direction === "outbound"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">
                          {message.content.text}
                        </p>
                        <p className={`text-xs mt-1 ${
                          message.direction === "outbound" 
                            ? "text-primary-foreground/70" 
                            : "text-muted-foreground"
                        }`}>
                          {formatMessageTime(message.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            {/* Input de Mensagem */}
            <div className="p-4 border-t border-border">
              <div className="flex gap-2">
                <Input
                  placeholder="Digite sua mensagem..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  disabled={sendMessageMutation.isPending}
                  data-testid="input-message"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!messageText.trim() || sendMessageMutation.isPending}
                  size="icon"
                  data-testid="button-send-message"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2" data-testid="text-select-conversation">
                Selecione uma conversa
              </h3>
              <p className="text-sm text-muted-foreground">
                Escolha uma conversa da lista para ver as mensagens
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
