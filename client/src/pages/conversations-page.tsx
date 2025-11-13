import { useState } from "react";
import { Route, Switch, useParams } from "wouter";
import { ConversationList } from "@/components/conversation-list";
import { NewConversationDialog } from "@/components/new-conversation-dialog";
import ConversationDetailPage from "./conversation-detail-page";
import { MessageSquare } from "lucide-react";

export default function ConversationsPage() {
  const [newConversationOpen, setNewConversationOpen] = useState(false);
  const params = useParams();


  return (
    <div className="flex h-[calc(100vh-4rem)] gap-0">
      {/* Sidebar - Lista de Conversas */}
      <ConversationList
        selectedId={params.conversationId as string}
        onNewConversation={() => setNewConversationOpen(true)}
      />

      {/* Main Content - Routed Detail or Empty State */}
      <Switch>
        <Route path="/conversations/:channelId/:conversationId">
          {(params) => <ConversationDetailPage />}
        </Route>
        <Route>
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
        </Route>
      </Switch>

      {/* Nova Conversa Dialog */}
      <NewConversationDialog
        open={newConversationOpen}
        onOpenChange={setNewConversationOpen}
      />
    </div>
  );
}
