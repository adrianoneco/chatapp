import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Plus, Edit, Trash2, Mail, Phone, FileText, MessageCircle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertClientSchema, updateClientSchema, type PublicUser, type InsertClient, type UpdateClient, type Channel, type InsertConversation } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { UserAvatar } from "@/components/user-avatar";
import AvatarUploader from "@/components/avatar-uploader";
import { usePresence } from "@/contexts/PresenceContext";

export default function ContactsPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { isUserOnline } = usePresence();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<PublicUser | null>(null);
  const [deletingContact, setDeletingContact] = useState<PublicUser | null>(null);

  const { data: contacts = [], isLoading } = useQuery<PublicUser[]>({
    queryKey: ["/api/contacts"],
  });

  const { data: channels = [], isLoading: channelsLoading } = useQuery<Channel[]>({
    queryKey: ["/api/channels"],
  });

  const [startingConversationFor, setStartingConversationFor] = useState<string | null>(null);

  const startConversationMutation = useMutation({
    mutationFn: async (clientId: string) => {
      if (startingConversationFor) {
        throw new Error("Já existe uma conversa sendo iniciada");
      }
      
      setStartingConversationFor(clientId);
      
      let webChannel = channels.find(c => c.slug === "web");
      
      if (!webChannel) {
        const channelsResponse = await apiRequest("GET", "/api/channels");
        if (!channelsResponse.ok) {
          setStartingConversationFor(null);
          throw new Error("Falha ao carregar canais");
        }
        const fetchedChannels: Channel[] = await channelsResponse.json();
        webChannel = fetchedChannels.find((c) => c.slug === "web");
        
        if (!webChannel) {
          setStartingConversationFor(null);
          throw new Error("Canal web não encontrado");
        }
      }

      const data: InsertConversation = {
        channelId: webChannel.id,
        customerContactId: clientId,
        status: "open",
      };
      
      const response = await apiRequest("POST", "/api/conversations", data);
      
      if (!response.ok) {
        setStartingConversationFor(null);
        const error = await response.json().catch(() => ({ message: "Falha ao criar conversa" }));
        throw new Error(error.message || "Falha ao criar conversa");
      }
      
      const conversation = await response.json();
      
      if (!conversation?.id || !conversation?.channelId) {
        setStartingConversationFor(null);
        throw new Error("Resposta inválida do servidor");
      }
      
      return conversation as { id: string; channelId: string; customerContactId?: string };
    },
    onSuccess: (conversation) => {
      setStartingConversationFor(null);
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      setLocation(`/conversations/${conversation.channelId}/${conversation.id}`);
      toast({
        title: "Sucesso",
        description: "Conversa iniciada com sucesso!",
      });
    },
    onError: () => {
      setStartingConversationFor(null);
      toast({
        title: "Erro",
        description: "Falha ao iniciar conversa",
        variant: "destructive",
      });
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertClient) =>
      apiRequest("POST", "/api/contacts", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      setIsFormOpen(false);
      toast({
        title: "Sucesso",
        description: "Contato criado com sucesso!",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao criar contato",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateClient }) =>
      apiRequest("PATCH", `/api/contacts/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      setIsFormOpen(false);
      setEditingContact(null);
      toast({
        title: "Sucesso",
        description: "Contato atualizado com sucesso!",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao atualizar contato",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/contacts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      setDeletingContact(null);
      toast({
        title: "Sucesso",
        description: "Contato excluído com sucesso!",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao excluir contato",
        variant: "destructive",
      });
    },
  });

  const handleOpenForm = (contact?: PublicUser) => {
    setEditingContact(contact || null);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingContact(null);
  };

  const handleDelete = (contact: PublicUser) => {
    setDeletingContact(contact);
  };

  const confirmDelete = () => {
    if (deletingContact) {
      deleteMutation.mutate(deletingContact.id);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold" data-testid="text-page-title">Contatos</h1>
        <Button onClick={() => handleOpenForm()} data-testid="button-new-contact">
          <Plus className="h-4 w-4 mr-2" />
          Novo Contato
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground" data-testid="text-loading">
          Carregando contatos...
        </div>
      ) : contacts.length === 0 ? (
        <Card className="p-12 text-center" data-testid="card-empty-state">
          <div className="text-muted-foreground">
            <p className="mb-2">Nenhum contato encontrado</p>
            <p className="text-sm">Crie seu primeiro contato clicando no botão acima</p>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2" data-testid="list-contacts">
          {contacts.map((contact) => (
            <Card key={contact.id} data-testid={`card-contact-${contact.id}`}>
              <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-3">
                <div className="flex items-center gap-3">
                  <UserAvatar 
                    name={contact.name} 
                    avatarUrl={contact.avatarUrl}
                    isOnline={isUserOnline(contact.id)}
                    size="md" 
                  />
                  <CardTitle className="text-lg">{contact.name}</CardTitle>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleOpenForm(contact)}
                    data-testid={`button-edit-${contact.id}`}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDelete(contact)}
                    data-testid={`button-delete-${contact.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {contact.email && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground" data-testid={`text-email-${contact.id}`}>
                    <Mail className="h-4 w-4" />
                    <span>{contact.email}</span>
                  </div>
                )}
                {contact.phone && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground" data-testid={`text-phone-${contact.id}`}>
                    <Phone className="h-4 w-4" />
                    <span>{contact.phone}</span>
                  </div>
                )}
                {contact.notes && (
                  <div className="flex items-start gap-2 text-sm text-muted-foreground" data-testid={`text-notes-${contact.id}`}>
                    <FileText className="h-4 w-4 mt-0.5" />
                    <span className="line-clamp-2">{contact.notes}</span>
                  </div>
                )}
                <Button 
                  className="w-full mt-2" 
                  variant="default"
                  onClick={() => startConversationMutation.mutate(contact.id)}
                  disabled={startingConversationFor !== null || channelsLoading}
                  data-testid={`button-start-conversation-${contact.id}`}
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  {startingConversationFor === contact.id ? "Iniciando..." : "Iniciar Conversa"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ContactFormDialog
        open={isFormOpen}
        onClose={handleCloseForm}
        contact={editingContact}
        onSubmit={(data) => {
          if (editingContact) {
            updateMutation.mutate({ id: editingContact.id, data });
          } else {
            createMutation.mutate(data);
          }
        }}
        isPending={createMutation.isPending || updateMutation.isPending}
      />

      <AlertDialog open={!!deletingContact} onOpenChange={() => setDeletingContact(null)}>
        <AlertDialogContent data-testid="dialog-delete-confirm">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o contato "{deletingContact?.name}"? Esta ação não pode ser desfeita.
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

interface ContactFormDialogProps {
  open: boolean;
  onClose: () => void;
  contact: PublicUser | null;
  onSubmit: (data: InsertClient) => void;
  isPending: boolean;
}

function ContactFormDialog({ open, onClose, contact, onSubmit, isPending }: ContactFormDialogProps) {
  const formSchema = insertClientSchema;

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      notes: "",
      avatarUrl: "",
    },
  });

  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | undefined>(undefined);

  const uploadAvatarFile = async (file: File) => {
    setUploadingAvatar(true);
    try {
      const res = await fetch(`/api/uploads?type=image&name=${encodeURIComponent(file.name)}`, {
        method: "POST",
        headers: {
          "Content-Type": file.type,
        },
        body: await file.arrayBuffer(),
        credentials: "include",
      });
      if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
      const data = await res.json();
      form.setValue("avatarUrl", data.mediaUrl);
      setAvatarPreview(data.mediaUrl);
      return data.mediaUrl;
    } finally {
      setUploadingAvatar(false);
    }
  };

  useEffect(() => {
    if (open) {
      form.reset({
        name: contact?.name || "",
        email: contact?.email || "",
        phone: contact?.phone || "",
        notes: contact?.notes || "",
      });
      setAvatarPreview(contact?.avatarUrl || undefined);
    }
  }, [open, contact, form]);

  const handleSubmit = (data: any) => {
    onSubmit(data);
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent data-testid="dialog-contact-form">
        <DialogHeader>
          <DialogTitle>{contact ? "Editar Contato" : "Novo Contato"}</DialogTitle>
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
                    <Input {...field} data-testid="input-name" placeholder="Digite o nome" />
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
                  <FormLabel>E-mail</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ""} data-testid="input-email" placeholder="email@exemplo.com" type="email" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ""} data-testid="input-phone" placeholder="(00) 00000-0000" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Anotações</FormLabel>
                  <FormControl>
                    <Textarea {...field} value={field.value || ""} data-testid="input-notes" placeholder="Anotações sobre o contato" rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

                <div>
                  <label className="block text-sm font-medium mb-1">Foto de Perfil</label>
                  <AvatarUploader
                    initialImage={contact?.avatarUrl || avatarPreview}
                    onChange={(url) => form.setValue("avatarUrl", url)}
                  />
                </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose} data-testid="button-cancel-form">
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending} data-testid="button-submit-form">
                {isPending ? "Salvando..." : contact ? "Atualizar" : "Criar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
