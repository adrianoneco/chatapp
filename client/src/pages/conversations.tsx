import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getRelativeDate } from "@/lib/date-utils";
import { NewConversationDialog } from "@/components/new-conversation-dialog";
import { useRoute, useLocation } from "wouter";

export default function Conversations() {
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"pending" | "attending" | "closed">("pending");
  const [newConversationOpen, setNewConversationOpen] = useState(false);
  const [, params] = useRoute("/conversations/:channelId/:conversationId");
  const [, setLocation] = useLocation();
  
  const selectedConversation = params?.conversationId || null;

  const mockConversations: any[] = [
    {
      id: "1",
      client: {
        id: "1",
        name: "João Silva",
        email: "joao@exemplo.com",
        image: "",
      },
      status: "pending",
      lastMessage: "Olá, preciso de ajuda com meu pedido",
      lastMessageAt: new Date(Date.now() - 300000).toISOString(),
      protocol: "A1B2C3D4E5",
    },
    {
      id: "2",
      client: {
        id: "2",
        name: "Maria Santos",
        email: "maria@exemplo.com",
        image: "",
      },
      status: "attending",
      lastMessage: "Obrigada pelo atendimento!",
      lastMessageAt: new Date(Date.now() - 600000).toISOString(),
      protocol: "F6G7H8I9J0",
    },
  ];

  const selectedConv = mockConversations.find(c => c.id === selectedConversation);
  const mockProtocol = selectedConv?.protocol || "A1B2C3D4E5";

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
              {mockConversations.filter(c => c.status === activeTab).length === 0 ? (
                <div className="p-6 text-center space-y-2">
                  <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Nenhuma conversa {activeTab === "pending" ? "pendente" : activeTab === "attending" ? "em atendimento" : "encerrada"}
                  </p>
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  {mockConversations.filter(c => c.status === activeTab).map((conversation: any) => (
                    <div
                      key={conversation.id}
                      className={cn(
                        "p-3 rounded-md hover-elevate cursor-pointer",
                        selectedConversation === conversation.id && "bg-sidebar-accent"
                      )}
                      onClick={() => setLocation(`/conversations/webchat/${conversation.id}`)}
                      data-testid={`conversation-item-${conversation.id}`}
                    >
                      <div className="flex gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={conversation.client.image} />
                          <AvatarFallback>{conversation.client.name[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-medium text-sm truncate">
                              {conversation.client.name}
                            </p>
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {getRelativeDate(conversation.lastMessageAt)}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {conversation.lastMessage}
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
        {selectedConversation ? (
          <>
            {/* Conversation Header */}
            <div className="p-4 border-b bg-card flex-shrink-0">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={selectedConv?.client.image} />
                  <AvatarFallback>{selectedConv?.client.name?.[0] || "C"}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium">{selectedConv?.client.name || "Cliente"}</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedConv?.lastMessageAt 
                      ? `Visto por último ${getRelativeDate(selectedConv.lastMessageAt)}`
                      : "Status desconhecido"}
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
              <div className="space-y-4">
                <div className="flex justify-center">
                  <Badge variant="secondary" className="text-xs">
                    Protocolo: {mockProtocol}
                  </Badge>
                </div>
                <div className="text-center text-sm text-muted-foreground py-8">
                  Nenhuma mensagem ainda
                </div>
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t bg-card flex-shrink-0">
              <div className="flex gap-2 items-center">
                <Input
                  placeholder="Digite sua mensagem..."
                  className="flex-1"
                  data-testid="input-message"
                />
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" data-testid="button-text-correction" title="Correção de texto">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </Button>
                  <Button size="icon" variant="ghost" data-testid="button-quick-messages" title="Mensagens prontas">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                  </Button>
                  <Button size="icon" variant="ghost" data-testid="button-record-audio" title="Gravar áudio">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                  </Button>
                  <Button size="icon" variant="ghost" data-testid="button-record-video" title="Gravar vídeo">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </Button>
                  <Button size="icon" variant="ghost" data-testid="button-send-image" title="Enviar imagem">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </Button>
                  <Button size="icon" variant="ghost" data-testid="button-send-attachment" title="Enviar anexo">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                  </Button>
                </div>
                <Button data-testid="button-send-message">Enviar</Button>
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
        <div className="w-80 bg-card border-l p-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Informações</h3>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setRightSidebarOpen(false)}
                data-testid="button-close-right-sidebar"
              >
                <PanelRightClose className="h-4 w-4" />
              </Button>
            </div>

            <Separator />

            <div className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Protocolo</p>
                <p className="font-mono text-sm font-medium" data-testid="text-protocol">
                  {mockProtocol}
                </p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-1">Status</p>
                <Badge variant="secondary" data-testid="badge-status">
                  {selectedConv?.status === "pending" ? "Pendente" : 
                   selectedConv?.status === "attending" ? "Atendendo" : "Encerrada"}
                </Badge>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-1">Cliente</p>
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={selectedConv?.client.image} />
                    <AvatarFallback>{selectedConv?.client.name?.[0] || "C"}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{selectedConv?.client.name || "Cliente"}</p>
                    <p className="text-xs text-muted-foreground">{selectedConv?.client.email || ""}</p>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-1">Criado em</p>
                <p className="text-sm">
                  {selectedConv?.lastMessageAt 
                    ? new Date(selectedConv.lastMessageAt).toLocaleDateString("pt-BR")
                    : new Date().toLocaleDateString("pt-BR")}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <NewConversationDialog
        open={newConversationOpen}
        onOpenChange={setNewConversationOpen}
      />
    </div>
  );
}
