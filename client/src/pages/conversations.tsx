import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth-context";
import { useWebSocket, useWebSocketEvent } from "@/lib/websocket";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Search,
  Plus,
  Clock,
  CheckCircle2,
  MessageSquare,
  Copy,
  Send,
  Image as ImageIcon,
  Paperclip,
  Mic,
  Video,
  Wand2,
  MessageCircle,
  MapPin,
  User,
  CheckCircle,
  Loader2,
  Sparkles,
} from "lucide-react";
import * as Icons from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { getRelativeDate } from "@/lib/date-utils";
import { NewConversationDialog } from "@/components/new-conversation-dialog";
import { useRoute, useLocation } from "wouter";

export default function Conversations() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, params] = useRoute("/conversations/:channelId/:conversationId");
  const [, setLocation] = useLocation();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"pending" | "attending" | "closed">("pending");
  const [newConversationOpen, setNewConversationOpen] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [correctingText, setCorrectingText] = useState(false);
  const [quickMessagesOpen, setQuickMessagesOpen] = useState(false);
  
  const selectedConversationId = params?.conversationId || null;

  // Fetch conversations
  const { data: conversations, isLoading: conversationsLoading } = useQuery<any[]>({
    queryKey: ["/api/conversations", activeTab],
    queryFn: async () => {
      const response = await fetch(`/api/conversations?status=${activeTab}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch conversations");
      return response.json();
    },
  });

  // Fetch selected conversation details
  const { data: selectedConversation } = useQuery<any>({
    queryKey: ["/api/conversations", selectedConversationId],
    enabled: !!selectedConversationId,
    queryFn: async () => {
      const response = await fetch(`/api/conversations/${selectedConversationId}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch conversation");
      return response.json();
    },
  });

  // Fetch messages
  const { data: messages, isLoading: messagesLoading } = useQuery<any[]>({
    queryKey: ["/api/conversations", selectedConversationId, "messages"],
    enabled: !!selectedConversationId,
    queryFn: async () => {
      const response = await fetch(`/api/conversations/${selectedConversationId}/messages`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch messages");
      return response.json();
    },
  });

  // Fetch quick messages
  const { data: quickMessages } = useQuery<any[]>({
    queryKey: ["/api/quick-messages"],
    enabled: user?.role === "admin" || user?.role === "attendant",
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      return await apiRequest("POST", `/api/conversations/${selectedConversationId}/messages`, {
        content,
        type: "text",
      });
    },
    onSuccess: () => {
      setMessageText("");
      queryClient.invalidateQueries({ queryKey: ["/api/conversations", selectedConversationId, "messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao enviar mensagem",
        variant: "destructive",
      });
    },
  });

  // Text correction mutation
  const correctTextMutation = useMutation({
    mutationFn: async (text: string) => {
      const res = await apiRequest("POST", "/api/ai/correct-text", { text });
      return await res.json();
    },
    onSuccess: (data) => {
      setMessageText(data.correctedText);
      toast({
        title: "Texto corrigido!",
        description: "O texto foi corrigido pela IA",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao corrigir texto",
        variant: "destructive",
      });
    },
  });

  // WebSocket events
  useWebSocketEvent("message_created", (data) => {
    if (data.conversation_id === selectedConversationId) {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations", selectedConversationId, "messages"] });
    }
    queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
  });

  useWebSocketEvent("conversation_created", () => {
    queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
  });

  useWebSocketEvent("conversation_updated", (data) => {
    if (data.id === selectedConversationId) {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations", selectedConversationId] });
    }
    queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
  });

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = () => {
    if (!messageText.trim()) return;
    sendMessageMutation.mutate(messageText);
  };

  const handleCorrectText = async () => {
    if (!messageText.trim()) return;
    try {
      await correctTextMutation.mutateAsync(messageText);
    } catch (error) {
      // Error is already handled by the mutation's onError
    }
  };

  const handleQuickMessage = (quickMessage: any) => {
    // Replace parameters with actual values
    let content = quickMessage.content;
    
    const paramValues: Record<string, string> = {
      clientName: selectedConversation?.client?.name || "Cliente",
      clientEmail: selectedConversation?.client?.email || "",
      attendantName: user?.name || "Atendente",
      protocolId: selectedConversation?.protocol || "",
      currentDate: new Date().toLocaleDateString("pt-BR"),
      currentTime: new Date().toLocaleTimeString("pt-BR"),
      companyName: "Minha Empresa",
    };

    Object.entries(paramValues).forEach(([key, value]) => {
      content = content.replace(new RegExp(`{{${key}}}`, "g"), value);
    });

    setMessageText(content);
    setQuickMessagesOpen(false);
  };

  const copyProtocol = (protocol: string) => {
    navigator.clipboard.writeText(protocol);
    toast({
      title: "Protocolo copiado!",
      description: "O número de protocolo foi copiado para a área de transferência",
    });
  };

  const getIconComponent = (iconName: string) => {
    const IconComponent = (Icons as any)[iconName];
    return IconComponent || Icons.MessageCircle;
  };

  const filteredConversations = conversations?.filter(c => c.status === activeTab) || [];

  return (
    <div className="flex flex-1 h-full overflow-hidden">
      {/* Left Sidebar - Conversations List */}
      <div
        className={cn(
          "bg-card border-r transition-all duration-300 flex flex-col h-full overflow-hidden",
          leftSidebarOpen ? "w-80" : "w-0"
        )}
      >
        {leftSidebarOpen && (
          <>
            <div className="p-4 space-y-4 flex-shrink-0">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-lg font-semibold">Conversas</h2>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setLeftSidebarOpen(false)}
                  data-testid="button-collapse-left-sidebar"
                >
                  <PanelLeftClose className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar conversas..."
                    className="pl-9"
                    data-testid="input-search-conversations"
                  />
                </div>
                <Button 
                  size="icon" 
                  variant="default" 
                  data-testid="button-new-conversation"
                  onClick={() => setNewConversationOpen(true)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="pending" data-testid="tab-pending">
                    <Clock className="h-3 w-3 mr-1" />
                    Pendente
                  </TabsTrigger>
                  <TabsTrigger value="attending" data-testid="tab-attending">
                    <MessageSquare className="h-3 w-3 mr-1" />
                    Atendendo
                  </TabsTrigger>
                  <TabsTrigger value="closed" data-testid="tab-closed">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Encerradas
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <Separator />

            <ScrollArea className="flex-1">
              {conversationsLoading ? (
                <div className="p-6 text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="p-6 text-center space-y-2">
                  <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Nenhuma conversa {activeTab === "pending" ? "pendente" : activeTab === "attending" ? "em atendimento" : "encerrada"}
                  </p>
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  {filteredConversations.map((conversation: any) => (
                    <div
                      key={conversation.id}
                      className={cn(
                        "p-3 rounded-md hover-elevate cursor-pointer",
                        selectedConversationId === conversation.id && "bg-sidebar-accent"
                      )}
                      onClick={() => setLocation(`/conversations/webchat/${conversation.id}`)}
                      data-testid={`conversation-item-${conversation.id}`}
                    >
                      <div className="flex gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={conversation.client?.image} />
                          <AvatarFallback>{conversation.client?.name?.[0] || "C"}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-medium text-sm truncate">
                              {conversation.client?.name || "Cliente"}
                            </p>
                            {conversation.last_message_at && (
                              <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {getRelativeDate(conversation.last_message_at)}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {conversation.last_message_content || "Sem mensagens"}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </>
        )}
      </div>

      {/* Toggle Button for Left Sidebar */}
      {!leftSidebarOpen && (
        <div className="flex items-center">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setLeftSidebarOpen(true)}
            className="h-12 w-8 rounded-none border-r"
            data-testid="button-expand-left-sidebar"
          >
            <PanelLeftOpen className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Center - Conversation Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {selectedConversationId && selectedConversation ? (
          <>
            {/* Conversation Header */}
            <div className="p-4 border-b bg-card flex-shrink-0">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={selectedConversation?.client?.image} />
                  <AvatarFallback>{selectedConversation?.client?.name?.[0] || "C"}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium">{selectedConversation?.client?.name || "Cliente"}</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedConversation?.last_message_at 
                      ? `Visto por último ${getRelativeDate(selectedConversation.last_message_at)}`
                      : "Nenhuma mensagem ainda"}
                  </p>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setRightSidebarOpen(!rightSidebarOpen)}
                  data-testid="button-toggle-right-sidebar"
                >
                  {rightSidebarOpen ? (
                    <PanelRightClose className="h-4 w-4" />
                  ) : (
                    <PanelRightOpen className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Messages Area */}
            <ScrollArea className="flex-1 p-4">
              {messagesLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedConversation?.protocol && (
                    <div className="flex justify-center">
                      <Badge variant="secondary" className="text-xs">
                        Protocolo: {selectedConversation.protocol}
                      </Badge>
                    </div>
                  )}
                  
                  {!messages || messages.length === 0 ? (
                    <div className="text-center text-sm text-muted-foreground py-8">
                      Nenhuma mensagem ainda
                    </div>
                  ) : (
                    messages.map((message: any) => (
                      <div
                        key={message.id}
                        className={cn(
                          "flex gap-3",
                          message.sender_id === user?.id && "flex-row-reverse"
                        )}
                      >
                        <Avatar className="h-8 w-8 flex-shrink-0">
                          <AvatarImage src={message.sender?.image} />
                          <AvatarFallback>{message.sender?.name?.[0] || "U"}</AvatarFallback>
                        </Avatar>
                        <div className={cn(
                          "flex flex-col gap-1 max-w-[70%]",
                          message.sender_id === user?.id && "items-end"
                        )}>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              {message.sender?.name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(message.created_at).toLocaleTimeString("pt-BR")}
                            </span>
                          </div>
                          <div className={cn(
                            "rounded-lg px-4 py-2",
                            message.sender_id === user?.id 
                              ? "bg-primary text-primary-foreground" 
                              : "bg-muted"
                          )}>
                            <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t bg-card flex-shrink-0">
              <div className="flex gap-2 items-end">
                <div className="flex-1 relative">
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
                    className="pr-48"
                    data-testid="input-message"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-8 w-8" 
                          data-testid="button-text-correction"
                          onClick={handleCorrectText}
                          disabled={!messageText.trim() || correctTextMutation.isPending}
                        >
                          {correctTextMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Wand2 className="h-4 w-4" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Correção de texto</p>
                      </TooltipContent>
                    </Tooltip>
                    
                    {(user?.role === "admin" || user?.role === "attendant") && (
                      <Popover open={quickMessagesOpen} onOpenChange={setQuickMessagesOpen}>
                        <PopoverTrigger asChild>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-8 w-8" 
                            data-testid="button-quick-messages"
                          >
                            <MessageCircle className="h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80" align="end">
                          <div className="space-y-2">
                            <h4 className="font-semibold text-sm">Mensagens Prontas</h4>
                            {!quickMessages || quickMessages.length === 0 ? (
                              <p className="text-sm text-muted-foreground">
                                Nenhuma mensagem pronta configurada
                              </p>
                            ) : (
                              <ScrollArea className="max-h-64">
                                <div className="space-y-1">
                                  {quickMessages.map((qm: any) => {
                                    const IconComponent = getIconComponent(qm.icon);
                                    return (
                                      <div
                                        key={qm.id}
                                        className="p-2 rounded-md hover:bg-accent cursor-pointer flex items-start gap-2"
                                        onClick={() => handleQuickMessage(qm)}
                                        data-testid={`quick-message-${qm.id}`}
                                      >
                                        <IconComponent className="h-4 w-4 mt-0.5 flex-shrink-0 text-primary" />
                                        <div className="flex-1 min-w-0">
                                          <p className="text-sm font-medium">{qm.title}</p>
                                          <p className="text-xs text-muted-foreground line-clamp-2">
                                            {qm.content}
                                          </p>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </ScrollArea>
                            )}
                          </div>
                        </PopoverContent>
                      </Popover>
                    )}
                    
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button size="icon" variant="ghost" className="h-8 w-8" data-testid="button-record-audio">
                          <Mic className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Gravar áudio</p>
                      </TooltipContent>
                    </Tooltip>
                    
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button size="icon" variant="ghost" className="h-8 w-8" data-testid="button-record-video">
                          <Video className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Gravar vídeo</p>
                      </TooltipContent>
                    </Tooltip>
                    
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button size="icon" variant="ghost" className="h-8 w-8" data-testid="button-send-image">
                          <ImageIcon className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Enviar imagem</p>
                      </TooltipContent>
                    </Tooltip>
                    
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button size="icon" variant="ghost" className="h-8 w-8" data-testid="button-send-attachment">
                          <Paperclip className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Enviar anexo</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      size="icon" 
                      data-testid="button-send-message"
                      onClick={handleSendMessage}
                      disabled={!messageText.trim() || sendMessageMutation.isPending}
                    >
                      {sendMessageMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Enviar mensagem</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-2">
              <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Selecione uma conversa para começar
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Right Sidebar - Conversation Info */}
      {rightSidebarOpen && selectedConversation && (
        <div className="w-80 bg-card border-l flex flex-col h-full overflow-hidden">
          <div className="p-4 border-b">
            <h3 className="font-semibold">Informações</h3>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-4 space-y-4">
              {selectedConversation.protocol && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Protocolo</p>
                  <div className="flex items-center gap-2">
                    <p className="font-mono text-sm font-medium flex-1" data-testid="text-protocol">
                      {selectedConversation.protocol}
                    </p>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => copyProtocol(selectedConversation.protocol)}
                          className="h-8 w-8"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Copiar protocolo</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              )}

              <div>
                <p className="text-xs text-muted-foreground mb-1">Status</p>
                <Badge variant="secondary" data-testid="badge-status">
                  {selectedConversation.status === "pending" ? "Pendente" : 
                   selectedConversation.status === "attending" ? "Atendendo" : "Encerrada"}
                </Badge>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-1">Cliente</p>
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={selectedConversation.client?.image} />
                    <AvatarFallback>{selectedConversation.client?.name?.[0] || "C"}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{selectedConversation.client?.name || "Cliente"}</p>
                    <p className="text-xs text-muted-foreground">{selectedConversation.client?.email || ""}</p>
                  </div>
                </div>
              </div>

              {selectedConversation.attendant && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Atendente</p>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={selectedConversation.attendant?.image} />
                      <AvatarFallback>{selectedConversation.attendant?.name?.[0] || "A"}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{selectedConversation.attendant?.name}</p>
                      <p className="text-xs text-muted-foreground">{selectedConversation.attendant?.email}</p>
                    </div>
                  </div>
                </div>
              )}

              {selectedConversation.created_at && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Criado em</p>
                  <p className="text-sm">
                    {new Date(selectedConversation.created_at).toLocaleDateString("pt-BR")} às {" "}
                    {new Date(selectedConversation.created_at).toLocaleTimeString("pt-BR")}
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      )}
      
      <NewConversationDialog
        open={newConversationOpen}
        onOpenChange={setNewConversationOpen}
      />
    </div>
  );
}
