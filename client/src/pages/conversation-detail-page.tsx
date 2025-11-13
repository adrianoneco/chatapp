import { useState } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Conversation, Message, InsertMessage, User } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UserAvatar } from "@/components/user-avatar";
import { AIMessageToolbar } from "@/components/ai-message-toolbar";
import { useWebSocket } from "@/hooks/use-websocket";
import { MessageSquare, Send, Phone, Video, MoreVertical } from "lucide-react";

export default function ConversationDetailPage() {
  const params = useParams();
  const conversationId = params.conversationId as string;
  const { toast } = useToast();
  const { onlineUsers } = useWebSocket();
  const [messageText, setMessageText] = useState("");

  const { data: conversation } = useQuery<Conversation>({
    queryKey: ["/api/conversations", conversationId],
    enabled: !!conversationId,
  });

  const { data: messages = [], isLoading: loadingMessages } = useQuery<Message[]>({
    queryKey: ["/api/conversations", conversationId, "messages"],
    enabled: !!conversationId,
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const getUserById = (id: string | null) => {
    if (!id) return null;
    return users.find((u) => u.id === id);
  };

  const contact = conversation ? getUserById(conversation.customerContactId) : null;
  const isOnline = contact ? onlineUsers.has(contact.id) : false;
  const contactName = contact?.name || conversation?.externalContactId || "Contato Desconhecido";

  const sendMessageMutation = useMutation({
    mutationFn: async (data: InsertMessage) => {
      return await apiRequest("POST", `/api/conversations/${conversationId}/messages`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations", conversationId, "messages"] });
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
    if (!messageText.trim() || !conversationId) return;

    sendMessageMutation.mutate({
      conversationId,
      senderType: "user" as const,
      senderId: undefined,
      direction: "outbound" as const,
      content: { text: messageText },
      messageType: "text" as const,
      externalId: undefined,
    });
  };

  const formatMessageTime = (date: string | Date) => {
    const d = new Date(date);
    return d.toLocaleTimeString('pt-BR', { 
      timeZone: 'America/Sao_Paulo',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <MessageSquare className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Conversa não encontrada</h3>
          <p className="text-sm text-muted-foreground">
            Selecione uma conversa da lista
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Cabeçalho */}
      <div className="p-4 border-b border-border flex items-center gap-3">
        <UserAvatar
          name={contactName}
          avatarUrl={contact?.avatarUrl}
          isOnline={isOnline}
          size="md"
        />
        <div className="flex-1">
          <h3 className="font-semibold" data-testid="text-conversation-contact">
            {contactName}
          </h3>
          <p className="text-sm text-muted-foreground">
            {conversation.status === "open" && "Aberta"}
            {conversation.status === "pending" && "Pendente"}
            {conversation.status === "resolved" && "Resolvida"}
            {conversation.status === "closed" && "Encerrada"}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            data-testid="button-call-audio"
          >
            <Phone className="h-5 w-5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            data-testid="button-call-video"
          >
            <Video className="h-5 w-5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            data-testid="button-conversation-menu"
          >
            <MoreVertical className="h-5 w-5" />
          </Button>
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

      {/* Barra de ferramentas IA */}
      <AIMessageToolbar
        messageText={messageText}
        onMessageUpdate={setMessageText}
        conversationId={conversationId}
        clientName={contact?.name}
      />

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
    </div>
  );
}
