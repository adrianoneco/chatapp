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
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
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
    <div className="flex flex-auto">
      {/* Left Sidebar - Conversations List */}
      <div
        className={cn(
          "bg-card border-r transition-all duration-300 flex flex-col",
          leftSidebarOpen ? "w-80" : "w-0"
        )}
      >
        {leftSidebarOpen && (
          <>
            <div className="p-4 space-y-4">
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
                              {formatDistanceToNow(new Date(conversation.lastMessageAt), {
                                addSuffix: true,
                                locale: ptBR,
                              })}
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
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Conversation Header */}
            <div className="p-4 border-b bg-card">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={selectedConv?.client.image} />
                  <AvatarFallback>{selectedConv?.client.name?.[0] || "C"}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium">{selectedConv?.client.name || "Cliente"}</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedConv?.lastMessageAt 
                      ? `Visto por último ${formatDistanceToNow(new Date(selectedConv.lastMessageAt), { 
                          addSuffix: true, 
                          locale: ptBR 
                        })}`
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
            <div className="p-4 border-t bg-card">
              <div className="flex gap-2">
                <Input
                  placeholder="Digite sua mensagem..."
                  data-testid="input-message"
                />
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
