import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search, UserPlus, MoreHorizontal, Mail, Phone, LayoutGrid, List, Upload, Edit2, Trash2, MessageSquare } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useState } from "react";
import { useUsers, useRegister, useUpdateUser, useDeleteUser, useUploadAvatar } from "@/lib/api";
import { useCreateConversation } from "@/hooks/use-conversations";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useLocation } from "wouter";

const userSchema = z.object({
  displayName: z.string().min(2, "Nome muito curto"),
  email: z.string().email("Email inválido"),
  phone: z.string().optional(),
  password: z.string().min(6, "Mínimo 6 caracteres").optional(),
});

export default function Contacts() {
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const [, setLocation] = useLocation();
  const { data, isLoading } = useUsers("client", search);
  const registerMutation = useRegister();
  const updateMutation = useUpdateUser();
  const deleteMutation = useDeleteUser();
  const uploadAvatarMutation = useUploadAvatar();
  const createConversationMutation = useCreateConversation();

  const form = useForm<z.infer<typeof userSchema>>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      displayName: "",
      email: "",
      phone: "",
      password: "",
    },
  });

  const handleOpenDialog = (user?: any) => {
    if (user) {
      setEditingUser(user);
      form.reset({
        displayName: user.displayName,
        email: user.email,
        phone: user.phone || "",
        password: "",
      });
    } else {
      setEditingUser(null);
      form.reset();
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (values: z.infer<typeof userSchema>) => {
    try {
      if (editingUser) {
        await updateMutation.mutateAsync({
          id: editingUser.id,
          data: {
            displayName: values.displayName,
            email: values.email,
            phone: values.phone,
          },
        });

        if (avatarFile) {
          await uploadAvatarMutation.mutateAsync({
            id: editingUser.id,
            file: avatarFile,
          });
        }

        toast.success("Contato atualizado com sucesso!");
      } else {
        if (!values.password) {
          toast.error("Senha é obrigatória para novos usuários");
          return;
        }

        const result = await registerMutation.mutateAsync({
          email: values.email,
          password: values.password,
          displayName: values.displayName,
          role: "client",
        });

        if (avatarFile && result.user) {
          await uploadAvatarMutation.mutateAsync({
            id: result.user.id,
            file: avatarFile,
          });
        }

        toast.success("Contato criado com sucesso!");
      }

      setIsDialogOpen(false);
      setAvatarFile(null);
      form.reset();
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar contato");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este contato?")) {
      try {
        await deleteMutation.mutateAsync(id);
        toast.success("Contato excluído com sucesso!");
      } catch (error: any) {
        toast.error(error.message || "Erro ao excluir contato");
      }
    }
  };

  const handleStartConversation = async (clientId: string, clientName: string) => {
    try {
      const result = await createConversationMutation.mutateAsync({
        clientId,
        channel: "webchat",
      });
      toast.success(`Conversa iniciada com ${clientName}`);
      setLocation(`/conversations/webchat/${result.id}`);
    } catch (error: any) {
      toast.error(error.message || "Erro ao iniciar conversa");
    }
  };

  const clients = data?.users || [];

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight font-[Outfit]">Contatos</h2>
            <p className="text-muted-foreground">Gerencie seus clientes e contatos.</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-background/50 border border-border rounded-lg p-1 flex items-center gap-1">
              <Button 
                variant={viewMode === "table" ? "secondary" : "ghost"} 
                size="icon" 
                className="h-8 w-8"
                onClick={() => setViewMode("table")}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button 
                variant={viewMode === "grid" ? "secondary" : "ghost"} 
                size="icon" 
                className="h-8 w-8"
                onClick={() => setViewMode("grid")}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>
            <Button className="bg-primary hover:bg-primary/90" onClick={() => handleOpenDialog()}>
              <UserPlus className="mr-2 h-4 w-4" /> Novo Contato
            </Button>
          </div>
        </div>

        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle>Todos os Contatos ({clients.length})</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Buscar cliente..." 
                  className="pl-9 bg-background/50"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {viewMode === "table" ? (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-border">
                    <TableHead className="w-[300px]">Nome</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.map((client) => (
                    <TableRow key={client.id} className="hover:bg-muted/50 border-border">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarImage src={client.avatarUrl || undefined} />
                            <AvatarFallback>{client.displayName.substring(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="font-medium">{client.displayName}</span>
                            <span className="text-xs text-muted-foreground">ID: {client.id.substring(0, 8)}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1 text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Mail className="h-3 w-3" /> {client.email}
                          </div>
                          {client.phone && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Phone className="h-3 w-3" /> {client.phone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleStartConversation(client.id, client.displayName)}>
                              <MessageSquare className="mr-2 h-4 w-4" /> Iniciar Conversa
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleOpenDialog(client)}>
                              <Edit2 className="mr-2 h-4 w-4" /> Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => handleDelete(client.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {clients.map((client) => (
                  <div key={client.id} className="p-4 rounded-xl bg-background/50 border border-border hover:bg-accent/20 transition-colors space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={client.avatarUrl || undefined} />
                          <AvatarFallback>{client.displayName.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{client.displayName}</p>
                          <p className="text-xs text-muted-foreground">#{client.id.substring(0, 8)}</p>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 -mt-1 -mr-2">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleStartConversation(client.id, client.displayName)}>
                            <MessageSquare className="mr-2 h-4 w-4" /> Iniciar Conversa
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleOpenDialog(client)}>
                            <Edit2 className="mr-2 h-4 w-4" /> Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => handleDelete(client.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground truncate">
                        <Mail className="h-3 w-3 shrink-0" /> {client.email}
                      </div>
                      {client.phone && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="h-3 w-3 shrink-0" /> {client.phone}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingUser ? "Editar Contato" : "Novo Contato"}</DialogTitle>
            <DialogDescription>
              {editingUser ? "Atualize as informações do contato" : "Adicione um novo contato ao sistema"}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input {...field} />
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
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
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
                    <FormLabel>Telefone (opcional)</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {!editingUser && (
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Senha</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              <div>
                <FormLabel>Avatar (opcional)</FormLabel>
                <div className="mt-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? "Salvando..." : editingUser ? "Atualizar" : "Criar"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
