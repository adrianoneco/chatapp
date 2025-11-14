import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import type { Conversation, User } from "@shared/schema";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getDate, getTime } from "@shared/datetime";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserAvatar } from "@/components/user-avatar";
import { MessageSquare, Plus, Search, MoreVertical } from "lucide-react";
import ConversationActionsMenu from "@/components/conversation-actions-menu";
import { useAuth } from "@/hooks/use-auth";
import { useWebSocket } from "@/hooks/use-websocket";

interface ConversationListProps {
  selectedId?: string;
  onNewConversation?: () => void;
}

export function ConversationList({ selectedId, onNewConversation }: ConversationListProps) {
  const { user } = useAuth();
  const { onlineUsers } = useWebSocket();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"pending" | "attending" | "closed">("attending");

  const { data: conversations = [], isLoading } = useQuery<Conversation[]>({
    queryKey: ["/api/conversations"],
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const getUserById = (id: string | null) => {
    if (!id) return null;
    return users.find((u) => u.id === id);
  };

  const formatConversationTime = (date: string | Date | null) => {
    if (!date) return "";
    try {
      const d = typeof date === 'string' ? new Date(date) : date;
      const now = new Date();
      const dDate = getDate(d);
      const nowDate = getDate(now);
      if (dDate === nowDate) return getTime(d);
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      if (dDate === getDate(yesterday)) return "Ontem";
      return dDate;
    } catch (e) {
      return "";
    }
  };

  const filteredConversations = conversations.filter((conv) => {
    // Filter by status tab
    const statusMatch =
      (activeTab === "pending" && conv.status === "pending") ||
      (activeTab === "attending" && (conv.status === "open" || conv.status === "pending")) ||
      (activeTab === "closed" && (conv.status === "resolved" || conv.status === "closed"));

    if (!statusMatch) return false;

    // Filter by search query
    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase();
    const contactName = getUserById(conv.customerContactId)?.name?.toLowerCase() || "";
    const externalId = conv.externalContactId?.toLowerCase() || "";

    return contactName.includes(query) || externalId.includes(query);
  });

  const isAttendant = user?.role === "attendant" || user?.role === "admin";

  return (
    <div className="w-80 border-r border-border flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold" data-testid="text-conversations-title">
            Conversas
          </h2>
          {isAttendant && onNewConversation && (
            <Button
              size="icon"
              variant="ghost"
              onClick={onNewConversation}
              data-testid="button-new-conversation"
            >
              <Plus className="h-5 w-5" />
            </Button>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar conversas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            data-testid="input-search-conversations"
          />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pending" data-testid="tab-pending">
              Pendente
            </TabsTrigger>
            <TabsTrigger value="attending" data-testid="tab-attending">
              Atendendo
            </TabsTrigger>
            <TabsTrigger value="closed" data-testid="tab-closed">
              Encerradas
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Conversation List */}
      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="p-4 text-center text-muted-foreground" data-testid="text-loading-conversations">
            Carregando...
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="p-6 text-center">
            <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground" data-testid="text-no-conversations">
              {searchQuery ? "Nenhuma conversa encontrada" : "Nenhuma conversa ainda"}
            </p>
          </div>
        ) : (
          <div>
            {filteredConversations.map((conversation) => {
              const contact = getUserById(conversation.customerContactId);
              const isOnline = contact ? onlineUsers.has(contact.id) : false;
              const contactName = contact?.name || conversation.externalContactId || "Contato Desconhecido";

              return (
                <Link
                  key={conversation.id}
                  href={`/conversations/${conversation.channelId}/${conversation.id}`}
                >
                  <button
                    className={`w-full p-4 text-left transition-colors hover-elevate active-elevate-2 flex items-center ${selectedId === conversation.id
                        ? "bg-accent border-l-4 border-primary"
                        : ""
                      }`}
                    data-testid={`conversation-item-${conversation.id}`}
                  >
                    <div className="flex items-start gap-3">
                      <UserAvatar
                        name={contactName}
                        avatarUrl={contact?.avatarUrl}
                        isOnline={isOnline}
                        size="md"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium truncate">
                            {contactName}
                          </p>
                          <span className="text-xs text-muted-foreground">
                            {formatConversationTime(conversation.lastMessageAt)}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {conversation.status === "open" && "Aberta"}
                          {conversation.status === "pending" && "Pendente"}
                          {conversation.status === "resolved" && "Resolvida"}
                          {conversation.status === "closed" && "Encerrada"}
                        </p>
                      </div>
                    </div>
                    <div className="ml-2 flex items-center gap-1">
                      <div className="ml-2 flex items-center gap-1">
                        {/* conversation actions menu (replicated from header) */}
                        <ConversationActionsMenu
                          conversationId={conversation.id}
                          conversationStatus={conversation.status}
                          isAttendant={user?.role === 'attendant' || user?.role === 'admin'}
                        />
                      </div>
                    </div>
                  </button>
                </Link>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
