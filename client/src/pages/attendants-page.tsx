import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Edit, Trash2, Mail, User as UserIcon } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
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
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertAttendantSchema, updateAttendantSchema, type PublicUser, type InsertAttendant, type UpdateAttendant } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { UserAvatar } from "@/components/user-avatar";
import { usePresence } from "@/contexts/PresenceContext";

export default function AttendantsPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { isUserOnline } = usePresence();
  const [editingAttendant, setEditingAttendant] = useState<PublicUser | null>(null);
  const [deletingAttendant, setDeletingAttendant] = useState<PublicUser | null>(null);
  const { toast } = useToast();

  const { data: attendants = [], isLoading } = useQuery<PublicUser[]>({
    queryKey: ["/api/attendants"],
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertAttendant) =>
      apiRequest("POST", "/api/attendants", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/attendants"] });
      setIsFormOpen(false);
      toast({
        title: "Sucesso",
        description: "Atendente criado com sucesso!",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message || "Falha ao criar atendente",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAttendant }) =>
      apiRequest("PATCH", `/api/attendants/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/attendants"] });
      setIsFormOpen(false);
      setEditingAttendant(null);
      toast({
        title: "Sucesso",
        description: "Atendente atualizado com sucesso!",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message || "Falha ao atualizar atendente",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/attendants/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/attendants"] });
      setDeletingAttendant(null);
      toast({
        title: "Sucesso",
        description: "Atendente excluído com sucesso!",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message || "Falha ao excluir atendente",
      });
    },
  });

  const handleCreate = () => {
    setEditingAttendant(null);
    setIsFormOpen(true);
  };

  const handleEdit = (attendant: PublicUser) => {
    setEditingAttendant(attendant);
    setIsFormOpen(true);
  };

  const handleDelete = (attendant: PublicUser) => {
    setDeletingAttendant(attendant);
  };

  const handleSubmit = (data: InsertAttendant | UpdateAttendant) => {
    if (editingAttendant) {
      updateMutation.mutate({ id: editingAttendant.id, data: data as UpdateAttendant });
    } else {
      createMutation.mutate(data as InsertAttendant);
    }
  };

  const confirmDelete = () => {
    if (deletingAttendant) {
      deleteMutation.mutate(deletingAttendant.id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Carregando atendentes...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Atendentes</h1>
        <Button onClick={handleCreate} data-testid="button-new-attendant">
          <Plus className="mr-2 h-4 w-4" />
          Novo Atendente
        </Button>
      </div>

      {attendants.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <UserIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              Nenhum atendente cadastrado. Clique em "Novo Atendente" para começar.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {attendants.map((attendant) => (
            <Card key={attendant.id} data-testid={`card-attendant-${attendant.id}`}>
              <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-3">
                <div className="flex items-center gap-3">
                  <UserAvatar 
                    name={attendant.name}
                    avatarUrl={attendant.avatarUrl}
                    isOnline={isUserOnline(attendant.id)}
                    size="md" 
                  />
                  <CardTitle className="text-lg font-medium">{attendant.name}</CardTitle>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(attendant)}
                    data-testid={`button-edit-${attendant.id}`}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(attendant)}
                    data-testid={`button-delete-${attendant.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {attendant.email && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Mail className="mr-2 h-4 w-4" />
                    <span>{attendant.email}</span>
                  </div>
                )}
                {attendant.username && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <UserIcon className="mr-2 h-4 w-4" />
                    <span>@{attendant.username}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AttendantFormDialog
        key={editingAttendant?.id || 'new'}
        open={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingAttendant(null);
        }}
        attendant={editingAttendant}
        onSubmit={handleSubmit}
        isPending={createMutation.isPending || updateMutation.isPending}
      />

      <AlertDialog
        open={!!deletingAttendant}
        onOpenChange={(open) => !open && setDeletingAttendant(null)}
      >
        <AlertDialogContent data-testid="dialog-delete-confirm">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o atendente "{deletingAttendant?.name}"? Esta ação não pode ser desfeita.
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

interface AttendantFormDialogProps {
  open: boolean;
  onClose: () => void;
  attendant: PublicUser | null;
  onSubmit: (data: InsertAttendant | UpdateAttendant) => void;
  isPending: boolean;
}

function AttendantFormDialog({ open, onClose, attendant, onSubmit, isPending }: AttendantFormDialogProps) {
  const formSchema = attendant ? updateAttendantSchema : insertAttendantSchema;

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      username: "",
      password: "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: attendant?.name || "",
        email: attendant?.email || "",
        username: attendant?.username || "",
        password: "",
      });
    }
  }, [open, attendant, form]);

  const handleSubmit = (data: any) => {
    if (attendant && !data.password) {
      const { password, ...rest } = data;
      onSubmit(rest);
    } else {
      onSubmit(data);
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent data-testid="dialog-attendant-form">
        <DialogHeader>
          <DialogTitle>{attendant ? "Editar Atendente" : "Novo Atendente"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome *</FormLabel>
                  <FormControl>
                    <Input {...field} data-testid="input-name" placeholder="Digite o nome completo" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-mail *</FormLabel>
                  <FormControl>
                    <Input {...field} type="email" data-testid="input-email" placeholder="Digite o e-mail" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username *</FormLabel>
                  <FormControl>
                    <Input {...field} data-testid="input-username" placeholder="Digite o username" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Senha {attendant ? "" : "*"}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="password"
                      data-testid="input-password"
                      placeholder={attendant ? "Deixe em branco para manter" : "Digite a senha"}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isPending}
                data-testid="button-cancel-form"
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending} data-testid="button-submit-form">
                {attendant ? "Atualizar" : "Criar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
