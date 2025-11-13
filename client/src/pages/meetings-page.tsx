import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, Link as LinkIcon, Calendar } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertMeetingSchema, updateMeetingSchema, type Meeting } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { z } from "zod";

export default function MeetingsPage() {
  const { toast } = useToast();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);
  const [meetingToDelete, setMeetingToDelete] = useState<Meeting | null>(null);

  const { data: meetings = [], isLoading } = useQuery<Meeting[]>({
    queryKey: ["/api/meetings"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: z.infer<typeof insertMeetingSchema>) => {
      return await apiRequest("POST", "/api/meetings", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meetings"] });
      toast({
        title: "Sucesso",
        description: "Reunião criada com sucesso!",
      });
      setIsFormOpen(false);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message || "Erro ao criar reunião",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: z.infer<typeof updateMeetingSchema> }) => {
      return await apiRequest("PATCH", `/api/meetings/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meetings"] });
      toast({
        title: "Sucesso",
        description: "Reunião atualizada com sucesso!",
      });
      setIsFormOpen(false);
      setEditingMeeting(null);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message || "Erro ao atualizar reunião",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/meetings/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meetings"] });
      toast({
        title: "Sucesso",
        description: "Reunião excluída com sucesso!",
      });
      setMeetingToDelete(null);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message || "Erro ao excluir reunião",
      });
    },
  });

  const handleCreate = () => {
    setEditingMeeting(null);
    setIsFormOpen(true);
  };

  const handleEdit = (meeting: Meeting) => {
    setEditingMeeting(meeting);
    setIsFormOpen(true);
  };

  const handleDelete = (meeting: Meeting) => {
    setMeetingToDelete(meeting);
  };

  const confirmDelete = () => {
    if (meetingToDelete) {
      deleteMutation.mutate(meetingToDelete.id);
    }
  };

  const copyLink = (meeting: Meeting) => {
    const link = `${window.location.origin}/m/${meeting.linkId}`;
    navigator.clipboard.writeText(link);
    toast({
      title: "Link copiado!",
      description: "O link da reunião foi copiado para a área de transferência",
    });
  };

  const formatDateTime = (dateStr: string | Date) => {
    const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold" data-testid="heading-meetings">Reuniões</h1>
          <p className="text-muted-foreground">Gerencie suas reuniões e links compartilháveis</p>
        </div>
        <Button onClick={handleCreate} data-testid="button-new-meeting">
          <Plus className="mr-2 h-4 w-4" />
          Nova Reunião
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-8" data-testid="loading-meetings">
          Carregando reuniões...
        </div>
      ) : meetings.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground" data-testid="text-no-meetings">
              Nenhuma reunião encontrada. Crie sua primeira reunião!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {meetings.map((meeting) => (
            <Card key={meeting.id} data-testid={`card-meeting-${meeting.id}`}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
                <div className="flex-1">
                  <CardTitle data-testid={`text-meeting-title-${meeting.id}`}>{meeting.title}</CardTitle>
                  <CardDescription>
                    {formatDateTime(meeting.scheduledAt)}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {meeting.isPublic && (
                    <span className="text-xs px-2 py-1 rounded-md bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100" data-testid={`badge-public-${meeting.id}`}>
                      Público
                    </span>
                  )}
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyLink(meeting)}
                    data-testid={`button-copy-link-${meeting.id}`}
                    title="Copiar link"
                  >
                    <LinkIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleEdit(meeting)}
                    data-testid={`button-edit-meeting-${meeting.id}`}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => handleDelete(meeting)}
                    data-testid={`button-delete-meeting-${meeting.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      <MeetingFormDialog
        key={editingMeeting?.id || 'new'}
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        meeting={editingMeeting}
        onSubmit={(data) => {
          if (editingMeeting) {
            updateMutation.mutate({ id: editingMeeting.id, data });
          } else {
            createMutation.mutate(data);
          }
        }}
        isPending={createMutation.isPending || updateMutation.isPending}
      />

      <AlertDialog open={!!meetingToDelete} onOpenChange={(open) => !open && setMeetingToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a reunião "{meetingToDelete?.title}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

interface MeetingFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meeting: Meeting | null;
  onSubmit: (data: any) => void;
  isPending: boolean;
}

function MeetingFormDialog({ open, onOpenChange, meeting, onSubmit, isPending }: MeetingFormDialogProps) {
  const isEditing = !!meeting;
  const formSchema = isEditing ? updateMeetingSchema : insertMeetingSchema;

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: meeting?.title || "",
      scheduledAt: meeting?.scheduledAt ? new Date(meeting.scheduledAt).toISOString().slice(0, 16) : "",
      isPublic: meeting?.isPublic ?? false,
    },
  });

  useEffect(() => {
    if (meeting) {
      form.reset({
        title: meeting.title,
        scheduledAt: new Date(meeting.scheduledAt).toISOString().slice(0, 16),
        isPublic: meeting.isPublic,
      });
    } else {
      form.reset({
        title: "",
        scheduledAt: "",
        isPublic: false,
      });
    }
  }, [meeting, form]);

  const handleSubmit = form.handleSubmit((data) => {
    onSubmit(data);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]" data-testid="dialog-meeting-form">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Reunião" : "Nova Reunião"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Atualize as informações da reunião" : "Preencha os dados para criar uma nova reunião"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Reunião de equipe" data-testid="input-title" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="scheduledAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data e Hora</FormLabel>
                  <FormControl>
                    <Input {...field} type="datetime-local" data-testid="input-scheduled-at" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isPublic"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Reunião Pública</FormLabel>
                    <FormDescription>
                      Se ativado, qualquer pessoa com o link poderá acessar. Caso contrário, apenas usuários autenticados.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      data-testid="switch-is-public"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
                data-testid="button-cancel-form"
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending} data-testid="button-submit-form">
                {isPending ? "Salvando..." : isEditing ? "Atualizar" : "Criar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
