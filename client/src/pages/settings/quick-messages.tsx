import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { QuickMessageModal } from "@/components/quick-message-modal";
import { Plus, Trash2, Edit, Loader2 } from "lucide-react";
import * as Icons from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function QuickMessages() {
  const { toast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMessage, setEditingMessage] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<any>(null);

  const { data: quickMessages, isLoading } = useQuery<any[]>({
    queryKey: ["/api/quick-messages"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/quick-messages/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quick-messages"] });
      toast({
        title: "Mensagem excluída!",
        description: "A mensagem pronta foi excluída com sucesso",
      });
      setDeleteDialogOpen(false);
      setMessageToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir mensagem pronta",
        variant: "destructive",
      });
    },
  });

  const openEditModal = (message: any) => {
    setEditingMessage(message);
    setModalOpen(true);
  };

  const openCreateModal = () => {
    setEditingMessage(null);
    setModalOpen(true);
  };

  const handleDeleteClick = (message: any) => {
    setMessageToDelete(message);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (messageToDelete) {
      deleteMutation.mutate(messageToDelete.id);
    }
  };

  const getIconComponent = (iconName: string) => {
    const IconComponent = (Icons as any)[iconName];
    return IconComponent || Icons.MessageCircle;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Mensagens Prontas</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Configure mensagens rápidas com parâmetros dinâmicos
          </p>
        </div>
        <Button onClick={openCreateModal} data-testid="button-new-quick-message">
          <Plus className="h-4 w-4 mr-2" />
          Nova Mensagem
        </Button>
      </div>

      {!quickMessages || quickMessages.length === 0 ? (
        <EmptyState
          icon={Icons.MessageCircle}
          title="Nenhuma mensagem pronta"
          description="Crie mensagens rápidas para agilizar o atendimento"
          action={{
            label: "Criar primeira mensagem",
            onClick: openCreateModal,
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickMessages.map((message) => {
            const IconComponent = getIconComponent(message.icon);
            
            return (
              <Card key={message.id} className="hover-elevate" data-testid={`quick-message-card-${message.id}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <IconComponent className="h-5 w-5 text-primary" />
                      </div>
                      <CardTitle className="text-base">{message.title}</CardTitle>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => openEditModal(message)}
                        data-testid={`button-edit-${message.id}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => handleDeleteClick(message)}
                        data-testid={`button-delete-${message.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
                    {message.content}
                  </p>
                  {message.parameters && message.parameters.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {message.parameters.map((param: string) => (
                        <Badge key={param} variant="secondary" className="text-xs">
                          {param}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <QuickMessageModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        quickMessage={editingMessage}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a mensagem "{messageToDelete?.title}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Excluindo...
                </>
              ) : (
                "Excluir"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
