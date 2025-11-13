import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import type { Conversation, Message, InsertMessage, User } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UserAvatar } from "@/components/user-avatar";
import { AIMessageToolbar } from "@/components/ai-message-toolbar";
import { CallDialog } from "@/components/call-dialog";
import { IncomingCallToast } from "@/components/incoming-call-toast";
import { useWebSocket } from "@/hooks/use-websocket";
import { useWebRTC } from "@/hooks/use-webrtc";
import {
  MessageSquare,
  Send,
  Phone,
  Video,
  MoreVertical,
  Mic,
  VideoIcon,
  Image,
  Paperclip,
  Sparkles,
  Check,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function ConversationDetailPage() {
  const params = useParams();
  const conversationId = params.conversationId as string;
  const { toast } = useToast();
  const { user } = useAuth();
  const { onlineUsers } = useWebSocket();
  const [messageText, setMessageText] = useState("");
  const {
    localStream,
    remoteStream,
    currentCall,
    incomingCall,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleVideo,
    toggleAudio,
  } = useWebRTC();

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

  const updateConversationMutation = useMutation({
    mutationFn: async (data: { status: string }) => {
      return await apiRequest("PATCH", `/api/conversations/${conversationId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations", conversationId] });
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      toast({
        title: "Sucesso",
        description: "Conversa atualizada com sucesso",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message || "Erro ao atualizar conversa",
      });
    },
  });

  const handleSendMessage = () => {
    if (!messageText.trim() || !conversationId) return;

    sendMessageMutation.mutate({
      conversationId,
      senderType: "user" as const,
      senderId: null,
      direction: "outbound" as const,
      content: { text: messageText },
      messageType: "text" as const,
      externalId: null,
    });
  };

  const handleStartAudioCall = async () => {
    if (!contact) return;

    try {
      await startCall(contact.id, contactName, false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao iniciar chamada",
        description: error.message || "Não foi possível iniciar a chamada",
      });
    }
  };

  const handleStartVideoCall = async () => {
    if (!contact) return;

    try {
      await startCall(contact.id, contactName, true);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao iniciar chamada",
        description: error.message || "Não foi possível iniciar a chamada",
      });
    }
  };

  const handleToggleConversation = () => {
    const newStatus = conversation?.status === "closed" ? "open" : "closed";
    updateConversationMutation.mutate({ status: newStatus });
  };

  const handleExportJSON = () => {
    const data = {
      conversation,
      messages,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `conversa-${conversationId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Sucesso",
      description: "Conversa exportada com sucesso",
    });
  };

  const formatMessageTime = (date: string | Date) => {
    const d = new Date(date);
    return d.toLocaleTimeString("pt-BR", {
      timeZone: "America/Sao_Paulo",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isAttendant = user?.role === "attendant" || user?.role === "admin";

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <MessageSquare className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Conversa não encontrada</h3>
          <p className="text-sm text-muted-foreground">Selecione uma conversa da lista</p>
        </div>
      </div>
    );
  }

  return (
    <>
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
              onClick={handleStartAudioCall}
              disabled={!!currentCall || !!incomingCall}
              data-testid="button-call-audio"
            >
              <Phone className="h-5 w-5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={handleStartVideoCall}
              disabled={!!currentCall || !!incomingCall}
              data-testid="button-call-video"
            >
              <Video className="h-5 w-5" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="ghost" data-testid="button-conversation-menu">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleToggleConversation} data-testid="menu-toggle-conversation">
                  {conversation.status === "closed" ? "Reabrir conversa" : "Fechar conversa"}
                </DropdownMenuItem>
                {isAttendant && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleExportJSON} data-testid="menu-export-json">
                      Exportar (JSON)
                    </DropdownMenuItem>
                    <DropdownMenuItem data-testid="menu-transcribe-pdf">
                      Transcrever (PDF)
                    </DropdownMenuItem>
                    <DropdownMenuItem data-testid="menu-transfer">
                      Transferir atendente
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
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
                    <p className="text-sm">{message.content.text}</p>
                    <div className="flex items-center justify-end gap-1 mt-1">
                      <span className="text-xs opacity-70">{formatMessageTime(message.createdAt)}</span>
                      {message.direction === "outbound" && (
                        <Check className="h-3 w-3 opacity-70" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Input de Mensagem */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-2 mb-2">
            <Button size="icon" variant="ghost" data-testid="button-ai-correct">
              <Sparkles className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" data-testid="button-ai-assistant">
              <MessageSquare className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" data-testid="button-record-audio">
              <Mic className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" data-testid="button-record-video">
              <VideoIcon className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" data-testid="button-send-photo">
              <Image className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" data-testid="button-send-attachment">
              <Paperclip className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Input
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
              placeholder="Digite uma mensagem..."
              disabled={sendMessageMutation.isPending}
              data-testid="input-message"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!messageText.trim() || sendMessageMutation.isPending}
              data-testid="button-send-message"
            >
              <Send className="h-4 w-4 mr-2" />
              Enviar
            </Button>
          </div>
        </div>
      </div>

      {/* Call Dialog */}
      {currentCall && (
        <CallDialog
          open={!!currentCall}
          onClose={endCall}
          recipientName={currentCall.recipientName || "Desconhecido"}
          recipientAvatarUrl={contact?.avatarUrl}
          localStream={localStream}
          remoteStream={remoteStream}
          isVideo={currentCall.isVideo}
          status={currentCall.status}
          onToggleVideo={toggleVideo}
          onToggleAudio={toggleAudio}
          onEndCall={endCall}
        />
      )}

      {/* Incoming Call Toast */}
      {incomingCall && (
        <div className="fixed bottom-4 right-4 z-50">
          <IncomingCallToast
            callerName={incomingCall.callerName || "Desconhecido"}
            callerAvatarUrl={null}
            isVideo={incomingCall.isVideo}
            onAccept={acceptCall}
            onReject={rejectCall}
          />
        </div>
      )}
    </>
  );
}
