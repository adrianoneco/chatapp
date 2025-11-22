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
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
} from "@/components/ui/context-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
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
  MoreVertical,
  Play,
  XCircle,
  Trash2,
  RefreshCw,
  Mic2,
  Reply,
  Forward,
  Smile,
  ChevronDown,
} from "lucide-react";
import * as Icons from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { getRelativeDate, getTime, getDateDivider, isSameDay } from "@/lib/date-utils";
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
  const [replyingTo, setReplyingTo] = useState<any>(null);
  const [hoveredMessageId, setHoveredMessageId] = useState<number | null>(null);
  const [sidebarSize, setSidebarSize] = useState(25);
  
  const selectedConversationId = params?.conversationId || null;
  
  // Load sidebar width from user preferences
  useEffect(() => {
    if (user?.preferences?.conversationSidebarWidth) {
      const widthInPixels = user.preferences.conversationSidebarWidth;
      const screenWidth = window.innerWidth;
      const percentage = (widthInPixels / screenWidth) * 100;
      setSidebarSize(Math.min(Math.max(percentage, 15), 50));
    }
  }, [user?.preferences?.conversationSidebarWidth]);
  
  // Save sidebar width mutation with debounce
  const saveSidebarWidthMutation = useMutation({
    mutationFn: async (widthPercentage: number) => {
      const widthInPixels = Math.round((widthPercentage / 100) * window.innerWidth);
      // Clamp to schema constraints (200-600px)
      const clampedWidth = Math.min(Math.max(widthInPixels, 200), 600);
      return await apiRequest("PATCH", "/api/users/preferences", {
        conversationSidebarWidth: clampedWidth,
      });
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/auth/me"], data);
    },
  });
  
  // Debounced save function
  const saveWidthTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const debouncedSave = (size: number) => {
    if (saveWidthTimeoutRef.current) {
      clearTimeout(saveWidthTimeoutRef.current);
    }
    saveWidthTimeoutRef.current = setTimeout(() => {
      saveSidebarWidthMutation.mutate(size);
    }, 500);
  };

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

  // Auto-select tab based on selected conversation status
  useEffect(() => {
    if (selectedConversation?.status && selectedConversation.status !== activeTab) {
      setActiveTab(selectedConversation.status as "pending" | "attending" | "closed");
    }
  }, [selectedConversation?.status]);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      return await apiRequest("POST", `/api/conversations/${selectedConversationId}/messages`, {
        content,
        type: "text",
        quotedMessageId: replyingTo?.id,
      });
    },
    onSuccess: () => {
      setMessageText("");
      setReplyingTo(null);
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

  // Update conversation status mutation
  const updateConversationStatusMutation = useMutation({
    mutationFn: async ({ conversationId, status }: { conversationId: string; status: string }) => {
      return await apiRequest("PATCH", `/api/conversations/${conversationId}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      toast({
        title: "Status atualizado!",
        description: "O status da conversa foi atualizado",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar status",
        variant: "destructive",
      });
    },
  });

  // Delete conversation mutation
  const deleteConversationMutation = useMutation({
    mutationFn: async (conversationId: string) => {
      return await apiRequest("DELETE", `/api/conversations/${conversationId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      setLocation("/conversations");
      toast({
        title: "Conversa excluída!",
        description: "A conversa foi excluída com sucesso",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir conversa",
        variant: "destructive",
      });
    },
  });

  // Transfer conversation mutation
  const transferConversationMutation = useMutation({
    mutationFn: async ({ conversationId, attendantId }: { conversationId: string; attendantId: string | null }) => {
      return await apiRequest("PATCH", `/api/conversations/${conversationId}/transfer`, { attendantId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      toast({
        title: "Conversa transferida!",
        description: "A conversa foi transferida com sucesso",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao transferir conversa",
        variant: "destructive",
      });
    },
  });

  // Transcribe conversation mutation
  const transcribeConversationMutation = useMutation({
    mutationFn: async (conversationId: string) => {
      const res = await apiRequest("POST", `/api/conversations/${conversationId}/transcribe`);
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Transcrição concluída!",
        description: "A conversa foi transcrita com sucesso",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao transcrever conversa",
        variant: "destructive",
      });
    },
  });

  // WebSocket events
  useWebSocketEvent("message_created", (data) => {
    // Data is already in camelCase from backend formatMessageRow()
    if (data.conversationId === selectedConversationId) {
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

  const filteredConversations = conversations?.filter(c => c.status === activeTab && !c.deleted) || [];

  return (
    <>
    <ResizablePanelGroup direction="horizontal" className="flex flex-1 h-full overflow-hidden">
      {/* Left Sidebar - Conversations List */}
      {leftSidebarOpen && (
        <>
          <ResizablePanel
            defaultSize={sidebarSize}
            minSize={15}
            maxSize={50}
            onResize={(size) => {
              setSidebarSize(size);
              debouncedSave(size);
            }}
            className="bg-card flex flex-col h-full overflow-hidden"
          >
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
                    {(conversations?.filter(c => c.status === "pending" && !c.deleted).length || 0) > 0 && (
                      <Badge variant="secondary" className="ml-1 h-4 min-w-4 px-1 text-xs">
                        {conversations?.filter(c => c.status === "pending" && !c.deleted).length || 0}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="attending" data-testid="tab-attending">
                    <MessageSquare className="h-3 w-3 mr-1" />
                    Atendendo
                    {(conversations?.filter(c => c.status === "attending" && !c.deleted).length || 0) > 0 && (
                      <Badge variant="secondary" className="ml-1 h-4 min-w-4 px-1 text-xs">
                        {conversations?.filter(c => c.status === "attending" && !c.deleted).length || 0}
                      </Badge>
                    )}
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
                    <ContextMenu key={conversation.id}>
                      <ContextMenuTrigger>
                        <div
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
                      </ContextMenuTrigger>
                      <ContextMenuContent>
                        {conversation.status === "pending" && (
                          <ContextMenuItem onClick={() => updateConversationStatusMutation.mutate({ conversationId: conversation.id, status: "attending" })}>
                            <Play className="h-4 w-4 mr-2" />
                            Iniciar Atendimento
                          </ContextMenuItem>
                        )}
                        {conversation.status === "attending" && (
                          <ContextMenuItem onClick={() => updateConversationStatusMutation.mutate({ conversationId: conversation.id, status: "closed" })}>
                            <XCircle className="h-4 w-4 mr-2" />
                            Encerrar Conversa
                          </ContextMenuItem>
                        )}
                        <ContextMenuItem onClick={() => transferConversationMutation.mutate({ conversationId: conversation.id, attendantId: null })}>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Transferir
                        </ContextMenuItem>
                        <ContextMenuItem onClick={() => transcribeConversationMutation.mutate(conversation.id)}>
                          <Mic2 className="h-4 w-4 mr-2" />
                          Transcrever com I.A
                        </ContextMenuItem>
                        <ContextMenuSeparator />
                        <ContextMenuItem onClick={() => deleteConversationMutation.mutate(conversation.id)} className="text-destructive">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir
                        </ContextMenuItem>
                      </ContextMenuContent>
                    </ContextMenu>
                  ))}
                </div>
              )}
            </ScrollArea>
          </ResizablePanel>
          <ResizableHandle withHandle />
        </>
      )}

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
      <ResizablePanel className="flex-1 flex flex-col h-full overflow-hidden">
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
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="icon" variant="ghost" data-testid="button-conversation-menu">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {selectedConversation?.status === "pending" && (
                      <DropdownMenuItem onClick={() => updateConversationStatusMutation.mutate({ conversationId: selectedConversationId!, status: "attending" })}>
                        <Play className="h-4 w-4 mr-2" />
                        Iniciar Atendimento
                      </DropdownMenuItem>
                    )}
                    {selectedConversation?.status === "attending" && (
                      <DropdownMenuItem onClick={() => updateConversationStatusMutation.mutate({ conversationId: selectedConversationId!, status: "closed" })}>
                        <XCircle className="h-4 w-4 mr-2" />
                        Encerrar Conversa
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => transferConversationMutation.mutate({ conversationId: selectedConversationId!, attendantId: null })}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Transferir
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => transcribeConversationMutation.mutate(selectedConversationId!)}>
                      <Mic2 className="h-4 w-4 mr-2" />
                      Transcrever com I.A
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => deleteConversationMutation.mutate(selectedConversationId!)} className="text-destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
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
                <div className="space-y-3">
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
                    messages.map((message: any, index: number) => {
                      const showDateDivider = index === 0 || !isSameDay(message.createdAt, messages[index - 1].createdAt);
                      const isFromUser = message.senderId === user?.id;
                      
                      return (
                        <div key={message.id}>
                          {/* Day Divider */}
                          {showDateDivider && (
                            <div className="flex justify-center my-4">
                              <Badge variant="secondary" className="text-xs px-3 py-1">
                                {getDateDivider(message.createdAt)}
                              </Badge>
                            </div>
                          )}
                          
                          {/* Message */}
                          <div
                            className={cn(
                              "flex gap-2 items-end group",
                              isFromUser && "flex-row-reverse"
                            )}
                            onMouseEnter={() => setHoveredMessageId(message.id)}
                            onMouseLeave={() => setHoveredMessageId(null)}
                          >
                            <Avatar className="h-8 w-8 flex-shrink-0">
                              <AvatarImage src={message.sender?.image} />
                              <AvatarFallback>{message.sender?.name?.[0] || "U"}</AvatarFallback>
                            </Avatar>
                            
                            <div className={cn(
                              "flex flex-col gap-1 max-w-[70%] relative",
                              isFromUser && "items-end"
                            )}>
                              {/* Sender name (only for other users' messages) */}
                              {!isFromUser && (
                                <span className="text-xs text-muted-foreground px-3">
                                  {message.sender?.name}
                                </span>
                              )}
                              
                              {/* Action buttons (show on hover) */}
                              {hoveredMessageId === message.id && (
                                <div className={cn(
                                  "absolute -top-8 flex gap-1 bg-card border rounded-md shadow-md p-1 z-10",
                                  isFromUser ? "right-0" : "left-0"
                                )}>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button 
                                        size="icon" 
                                        variant="ghost" 
                                        className="h-7 w-7"
                                        onClick={() => setReplyingTo(message)}
                                        data-testid={`button-reply-${message.id}`}
                                      >
                                        <Reply className="h-3.5 w-3.5" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Responder</TooltipContent>
                                  </Tooltip>
                                  
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button 
                                        size="icon" 
                                        variant="ghost" 
                                        className="h-7 w-7"
                                        data-testid={`button-forward-${message.id}`}
                                      >
                                        <Forward className="h-3.5 w-3.5" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Encaminhar</TooltipContent>
                                  </Tooltip>
                                  
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button 
                                        size="icon" 
                                        variant="ghost" 
                                        className="h-7 w-7"
                                        data-testid={`button-react-${message.id}`}
                                      >
                                        <Smile className="h-3.5 w-3.5" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Reagir</TooltipContent>
                                  </Tooltip>
                                  
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button 
                                        size="icon" 
                                        variant="ghost" 
                                        className="h-7 w-7"
                                        data-testid={`button-more-${message.id}`}
                                      >
                                        <ChevronDown className="h-3.5 w-3.5" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align={isFromUser ? "end" : "start"}>
                                      <DropdownMenuItem data-testid={`menu-copy-${message.id}`}>
                                        <Copy className="h-4 w-4 mr-2" />
                                        Copiar
                                      </DropdownMenuItem>
                                      {isFromUser && (
                                        <>
                                          <DropdownMenuSeparator />
                                          <DropdownMenuItem 
                                            className="text-destructive"
                                            data-testid={`menu-delete-${message.id}`}
                                          >
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Deletar
                                          </DropdownMenuItem>
                                        </>
                                      )}
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              )}
                              
                              {/* Message bubble with tail */}
                              <div className="relative">
                                {/* Tail pointer */}
                                <div
                                  className={cn(
                                    "absolute top-0 w-0 h-0",
                                    isFromUser
                                      ? "right-0 border-l-[8px] border-l-transparent border-t-[8px] border-t-primary border-r-0 translate-x-[8px]"
                                      : "left-0 border-r-[8px] border-r-transparent border-t-[8px] border-t-muted border-l-0 -translate-x-[8px]"
                                  )}
                                />
                                
                                {/* Message content */}
                                <div className={cn(
                                  "rounded-md px-3 py-2 relative",
                                  isFromUser 
                                    ? "bg-primary text-primary-foreground" 
                                    : "bg-muted"
                                )}>
                                  {/* Quoted message (if reply) */}
                                  {message.quotedMessage && (
                                    <div className={cn(
                                      "mb-2 pl-3 py-1 border-l-4 rounded-sm",
                                      isFromUser 
                                        ? "border-l-primary-foreground/50 bg-primary-foreground/10" 
                                        : "border-l-primary bg-primary/10"
                                    )}>
                                      <p className={cn(
                                        "text-xs font-medium mb-0.5",
                                        isFromUser ? "text-primary-foreground/90" : "text-primary"
                                      )}>
                                        {message.quotedMessage.sender?.name || "Usuário"}
                                      </p>
                                      <p className={cn(
                                        "text-xs line-clamp-2",
                                        isFromUser ? "text-primary-foreground/70" : "text-muted-foreground"
                                      )}>
                                        {message.quotedMessage.content}
                                      </p>
                                    </div>
                                  )}
                                  
                                  <p className="text-sm whitespace-pre-wrap break-words pr-12">
                                    {message.content}
                                  </p>
                                  
                                  {/* Time */}
                                  <span className={cn(
                                    "text-[10px] absolute bottom-1 right-2",
                                    isFromUser ? "text-primary-foreground/70" : "text-muted-foreground"
                                  )}>
                                    {getTime(message.createdAt)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>

            {/* Message Input */}
            <div className="border-t bg-card flex-shrink-0">
              {/* Reply Preview */}
              {replyingTo && (
                <div className="p-3 border-b bg-muted/50 flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Reply className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs font-medium">
                        Respondendo a {replyingTo.sender?.name}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {replyingTo.content}
                    </p>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 flex-shrink-0"
                    onClick={() => setReplyingTo(null)}
                    data-testid="button-cancel-reply"
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>
              )}
              
              <div className="p-4 flex gap-2 items-end">
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
      </ResizablePanel>

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
    </ResizablePanelGroup>
      
      <NewConversationDialog
        open={newConversationOpen}
        onOpenChange={setNewConversationOpen}
      />
    </>
  );
}
