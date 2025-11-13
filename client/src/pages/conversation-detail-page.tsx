import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { formatTime } from "@/lib/datetime";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import type { Conversation, Message, User } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UserAvatar } from "@/components/user-avatar";
import { AIMessageToolbar } from "@/components/ai-message-toolbar";
import { CallDialog } from "@/components/call-dialog";
import { IncomingCallToast } from "@/components/incoming-call-toast";
import { AudioRecorderDialog } from "@/components/audio-recorder-dialog";
import { VideoRecorderDialog } from "@/components/video-recorder-dialog";
import { FileUploadDialog } from "@/components/file-upload-dialog";
import { AIAssistantDialog } from "@/components/ai-assistant-dialog";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ConversationDetailPage() {
  const params = useParams();
  const conversationId = params.conversationId as string;
  const { toast } = useToast();
  const { user } = useAuth();
  const { onlineUsers } = useWebSocket();
  const [messageText, setMessageText] = useState("");
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [selectedAttendant, setSelectedAttendant] = useState("");
  const [isCorrectingText, setIsCorrectingText] = useState(false);
  const [showAudioRecorder, setShowAudioRecorder] = useState(false);
  const [showVideoRecorder, setShowVideoRecorder] = useState(false);
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [showAttachmentUpload, setShowAttachmentUpload] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
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

  const attendants = users.filter(u => u.role === "attendant" || u.role === "admin");

  const getUserById = (id: string | null) => {
    if (!id) return null;
    return users.find((u) => u.id === id);
  };

  const contact = conversation ? getUserById(conversation.customerContactId) : null;
  const isOnline = contact ? onlineUsers.has(contact.id) : false;
  const contactName = contact?.name || conversation?.externalContactId || "Contato Desconhecido";

  const sendMessageMutation = useMutation({
    mutationFn: async (data: any) => {
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
    if (!messageText.trim() || !conversationId || !user) return;

    sendMessageMutation.mutate({
      conversationId,
      senderType: "user" as const,
      senderId: user.id,
      direction: "outbound" as const,
      content: { text: messageText },
      messageType: "text" as const,
      externalId: null,
    });
  };

  const handleAIAssistant = () => {
    setShowAIAssistant(true);
  };

  const handleRecordAudio = () => {
    setShowAudioRecorder(true);
  };

  const handleRecordVideo = () => {
    setShowVideoRecorder(true);
  };

  const handleSendPhoto = () => {
    setShowPhotoUpload(true);
  };

  const handleSendAttachment = () => {
    setShowAttachmentUpload(true);
  };

  const uploadFile = async (file: Blob | File, type: string, name?: string): Promise<string> => {
    const fileName = name || (file instanceof File ? file.name : "recording");
    const response = await fetch(`/api/uploads?type=${type}&name=${encodeURIComponent(fileName)}`, {
      method: "POST",
      headers: {
        "Content-Type": file.type,
      },
      credentials: "include",
      body: file,
    });

    if (!response.ok) {
      throw new Error("Erro ao fazer upload");
    }

    const data = await response.json();
    return data.mediaUrl;
  };

  const handleSendAudio = async (audioBlob: Blob) => {
    if (!user) return;

    try {
      toast({
        title: "Enviando áudio",
        description: "Fazendo upload do áudio...",
      });

      const mediaUrl = await uploadFile(audioBlob, "audio", "audio.webm");

      sendMessageMutation.mutate({
        conversationId,
        senderType: "user" as const,
        senderId: user.id,
        direction: "outbound" as const,
        content: { mediaUrl },
        messageType: "audio",
        externalId: null,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao enviar áudio",
      });
    }
  };

  const handleSendVideo = async (videoBlob: Blob) => {
    if (!user) return;

    try {
      toast({
        title: "Enviando vídeo",
        description: "Fazendo upload do vídeo...",
      });

      const mediaUrl = await uploadFile(videoBlob, "video", "video.webm");

      sendMessageMutation.mutate({
        conversationId,
        senderType: "user" as const,
        senderId: user.id,
        direction: "outbound" as const,
        content: { mediaUrl },
        messageType: "video",
        externalId: null,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao enviar vídeo",
      });
    }
  };

  const handleSendFiles = async (files: File[]) => {
    if (!user) return;
    
    const fileType = files[0].type.startsWith("image/") ? "image" : "file";
    
    toast({
      title: `Enviando ${fileType === "image" ? "imagem(ns)" : "arquivo(s)"}`,
      description: `${files.length} ${files.length === 1 ? "arquivo" : "arquivos"} sendo enviado(s)...`,
    });

    for (const file of files) {
      try {
        const mediaUrl = await uploadFile(file, fileType, file.name);

        sendMessageMutation.mutate({
          conversationId,
          senderType: "user" as const,
          senderId: user.id,
          direction: "outbound" as const,
          content: { mediaUrl, caption: file.name },
          messageType: fileType,
          externalId: null,
        });
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Erro",
          description: `Erro ao enviar ${file.name}`,
        });
      }
    }
  };

  const handleUseTemplate = (content: string) => {
    setMessageText(content);
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

  const handleTranscribe = async () => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}/transcribe`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error("Falha ao transcrever conversa");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `conversa-${conversationId}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Sucesso",
        description: "Transcrição baixada com sucesso",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message || "Erro ao transcrever conversa",
      });
    }
  };

  const handleCorrectText = async () => {
    if (!messageText.trim()) return;

    setIsCorrectingText(true);
    try {
      const response = await apiRequest("POST", "/api/ai/correct-text", {
        text: messageText,
        language: "pt",
      });

      if (response.ok) {
        const data = await response.json();
        setMessageText(data.correctedText);
        toast({
          title: "Texto corrigido",
          description: "O texto foi corrigido com sucesso",
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message || "Erro ao corrigir texto",
      });
    } finally {
      setIsCorrectingText(false);
    }
  };

  const transferMutation = useMutation({
    mutationFn: async (attendantId: string) => {
      return await apiRequest("PATCH", `/api/conversations/${conversationId}/transfer`, {
        attendantId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations", conversationId] });
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      setShowTransferDialog(false);
      toast({
        title: "Sucesso",
        description: "Conversa transferida com sucesso",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message || "Erro ao transferir conversa",
      });
    },
  });


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
                    <DropdownMenuItem onClick={handleTranscribe} data-testid="menu-transcribe">
                      Transcrever (TXT)
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setShowTransferDialog(true)}
                      data-testid="menu-transfer"
                    >
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
                      <span className="text-xs opacity-70">{formatTime(message.createdAt)}</span>
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
          <div className="relative flex items-end bg-muted rounded-lg p-2">
            <Textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Digite uma mensagem..."
              className="resize-none min-h-[40px] max-h-32 border-0 bg-transparent focus-visible:ring-0 pr-80"
              rows={1}
              disabled={sendMessageMutation.isPending}
              data-testid="input-message"
            />
            
            <div className="absolute right-2 bottom-2 flex items-center gap-1">
              <Button
                size="icon"
                variant="ghost"
                onClick={handleCorrectText}
                disabled={!messageText.trim() || isCorrectingText}
                data-testid="button-ai-correct"
                className="h-8 w-8"
                title="Corrigir texto com IA"
              >
                <Sparkles className="h-4 w-4" />
              </Button>
              <Button 
                size="icon" 
                variant="ghost" 
                onClick={handleAIAssistant}
                data-testid="button-ai-assistant"
                className="h-8 w-8"
                title="Assistente IA"
              >
                <MessageSquare className="h-4 w-4" />
              </Button>
              <Button 
                size="icon" 
                variant="ghost" 
                onClick={handleRecordAudio}
                data-testid="button-record-audio"
                className="h-8 w-8"
                title="Gravar áudio"
              >
                <Mic className="h-4 w-4" />
              </Button>
              <Button 
                size="icon" 
                variant="ghost" 
                onClick={handleRecordVideo}
                data-testid="button-record-video"
                className="h-8 w-8"
                title="Gravar vídeo"
              >
                <VideoIcon className="h-4 w-4" />
              </Button>
              <Button 
                size="icon" 
                variant="ghost" 
                onClick={handleSendPhoto}
                data-testid="button-send-photo"
                className="h-8 w-8"
                title="Enviar foto"
              >
                <Image className="h-4 w-4" />
              </Button>
              <Button 
                size="icon" 
                variant="ghost" 
                onClick={handleSendAttachment}
                data-testid="button-send-attachment"
                className="h-8 w-8"
                title="Enviar anexo"
              >
                <Paperclip className="h-4 w-4" />
              </Button>
              <Button
                onClick={handleSendMessage}
                disabled={!messageText.trim() || sendMessageMutation.isPending}
                data-testid="button-send-message"
                className="h-8 w-8 bg-primary text-primary-foreground hover:bg-primary/90"
                size="icon"
                title="Enviar mensagem"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
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

      {/* Audio Recorder Dialog */}
      <AudioRecorderDialog
        open={showAudioRecorder}
        onClose={() => setShowAudioRecorder(false)}
        onSend={handleSendAudio}
      />

      {/* Video Recorder Dialog */}
      <VideoRecorderDialog
        open={showVideoRecorder}
        onClose={() => setShowVideoRecorder(false)}
        onSend={handleSendVideo}
      />

      {/* Photo Upload Dialog */}
      <FileUploadDialog
        open={showPhotoUpload}
        onClose={() => setShowPhotoUpload(false)}
        onSend={handleSendFiles}
        mode="image"
      />

      {/* Attachment Upload Dialog */}
      <FileUploadDialog
        open={showAttachmentUpload}
        onClose={() => setShowAttachmentUpload(false)}
        onSend={handleSendFiles}
        mode="attachment"
      />

      {/* AI Assistant Dialog */}
      <AIAssistantDialog
        open={showAIAssistant}
        onClose={() => setShowAIAssistant(false)}
        onSelectTemplate={handleUseTemplate}
        conversationContext={{
          clientName: contactName,
          attendantName: user?.name || "",
        }}
      />

      {/* Transfer Dialog */}
      <Dialog open={showTransferDialog} onOpenChange={setShowTransferDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transferir Conversa</DialogTitle>
            <DialogDescription>
              Selecione o atendente para quem deseja transferir esta conversa.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Select value={selectedAttendant} onValueChange={setSelectedAttendant}>
              <SelectTrigger data-testid="select-attendant">
                <SelectValue placeholder="Selecione um atendente" />
              </SelectTrigger>
              <SelectContent>
                {attendants.map((attendant) => (
                  <SelectItem key={attendant.id} value={attendant.id}>
                    {attendant.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTransferDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => selectedAttendant && transferMutation.mutate(selectedAttendant)}
              disabled={!selectedAttendant || transferMutation.isPending}
              data-testid="button-confirm-transfer"
            >
              Transferir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
