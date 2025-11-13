import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Edit, Trash2, Mail, Phone, FileText } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertContactSchema, type Contact, type InsertContact } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function ContactsPage() {
  const { toast } = useToast();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [deletingContact, setDeletingContact] = useState<Contact | null>(null);

  const { data: contacts = [], isLoading } = useQuery<Contact[]>({
    queryKey: ["/api/contacts"],
  });

  const createMutation = useMutation({
    mutationFn: (data: Omit<InsertContact, "userId">) =>
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
    mutationFn: ({ id, data }: { id: string; data: Partial<Omit<InsertContact, "userId">> }) =>
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

  const handleOpenForm = (contact?: Contact) => {
    setEditingContact(contact || null);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingContact(null);
  };

  const handleDelete = (contact: Contact) => {
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
              <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
                <CardTitle className="text-lg">{contact.name}</CardTitle>
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
              <CardContent className="space-y-2">
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
  contact: Contact | null;
  onSubmit: (data: Omit<InsertContact, "userId">) => void;
  isPending: boolean;
}

function ContactFormDialog({ open, onClose, contact, onSubmit, isPending }: ContactFormDialogProps) {
  const formSchema = insertContactSchema.omit({ userId: true });

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: contact?.name || "",
        email: contact?.email || "",
        phone: contact?.phone || "",
        notes: contact?.notes || "",
      });
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
