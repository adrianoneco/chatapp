import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Bell, User, Monitor, Shield, Moon, Laptop, Globe, Hash, Plus, Edit, Trash2, Lock } from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import { toast } from "sonner";
import { WebhooksSettings } from "@/components/webhooks-settings";

interface Channel {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  color: string | null;
  enabled: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function Settings() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingChannel, setEditingChannel] = useState<Channel | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [channelToDelete, setChannelToDelete] = useState<Channel | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    icon: "",
    color: "#3b82f6",
    enabled: true,
  });

  const { data: channels = [], isLoading: channelsLoading } = useQuery<Channel[]>({
    queryKey: ["/channels"],
    queryFn: () => apiRequest("/channels"),
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof formData) => apiRequest("/channels", {
      method: "POST",
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/channels"] });
      toast.success("Canal criado com sucesso!");
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao criar canal");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: typeof formData }) => 
      apiRequest(`/channels/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/channels"] });
      toast.success("Canal atualizado com sucesso!");
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao atualizar canal");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/channels/${id}`, {
      method: "DELETE",
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/channels"] });
      toast.success("Canal deletado com sucesso!");
      setDeleteDialogOpen(false);
      setChannelToDelete(null);
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao deletar canal");
    },
  });

  const handleOpenDialog = (channel?: Channel) => {
    if (channel) {
      setEditingChannel(channel);
      setFormData({
        name: channel.name,
        slug: channel.slug,
        icon: channel.icon || "",
        color: channel.color || "#3b82f6",
        enabled: channel.enabled,
      });
    } else {
      setEditingChannel(null);
      setFormData({
        name: "",
        slug: "",
        icon: "",
        color: "#3b82f6",
        enabled: true,
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingChannel(null);
    setFormData({
      name: "",
      slug: "",
      icon: "",
      color: "#3b82f6",
      enabled: true,
    });
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.slug) {
      toast.error("Nome e slug são obrigatórios");
      return;
    }

    if (editingChannel) {
      updateMutation.mutate({ id: editingChannel.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (channel: Channel) => {
    setChannelToDelete(channel);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (channelToDelete) {
      deleteMutation.mutate(channelToDelete.id);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight font-[Outfit]">Configurações</h2>
          <p className="text-muted-foreground">Gerencie suas preferências e conta.</p>
        </div>

        <Tabs defaultValue="profile" className="space-y-4">
          <TabsList>
            <TabsTrigger value="profile">Perfil</TabsTrigger>
            <TabsTrigger value="notifications">Notificações</TabsTrigger>
            <TabsTrigger value="appearance">Aparência</TabsTrigger>
            <TabsTrigger value="channels">Canais</TabsTrigger>
            <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile" className="space-y-4">
            <Card className="border-border/50 bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle>Informações do Perfil</CardTitle>
                <CardDescription>Atualize sua foto e dados pessoais.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src="https://github.com/shadcn.png" />
                    <AvatarFallback>UR</AvatarFallback>
                  </Avatar>
                  <Button variant="outline">Alterar Foto</Button>
                </div>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Nome Completo</Label>
                    <Input defaultValue="Usuario Demo" />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input defaultValue="usuario@demo.com" />
                  </div>
                  <div className="space-y-2">
                    <Label>Cargo</Label>
                    <Input defaultValue="Administrador" disabled />
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button>Salvar Alterações</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="notifications" className="space-y-4">
            <Card className="border-border/50 bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle>Preferências de Notificação</CardTitle>
                <CardDescription>Escolha como você quer ser notificado.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div className="space-y-0.5">
                    <Label className="text-base">Notificações de Desktop</Label>
                    <p className="text-sm text-muted-foreground">Receba popups no seu computador.</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div className="space-y-0.5">
                    <Label className="text-base">Sons de Mensagem</Label>
                    <p className="text-sm text-muted-foreground">Tocar som ao receber mensagem.</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div className="space-y-0.5">
                    <Label className="text-base">Emails de Resumo</Label>
                    <p className="text-sm text-muted-foreground">Receba um resumo diário por email.</p>
                  </div>
                  <Switch />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="appearance" className="space-y-4">
             <Card className="border-border/50 bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle>Tema</CardTitle>
                <CardDescription>Personalize a aparência do app.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-3 gap-4">
                <div className="cursor-pointer space-y-2">
                  <div className="p-4 border-2 border-primary rounded-lg bg-background hover:bg-accent transition-colors">
                    <div className="space-y-2">
                      <div className="h-2 w-[80%] bg-foreground/20 rounded" />
                      <div className="h-2 w-[60%] bg-foreground/20 rounded" />
                    </div>
                  </div>
                  <div className="text-center text-sm font-medium text-primary">Escuro (Padrão)</div>
                </div>
                <div className="cursor-pointer space-y-2 opacity-50">
                  <div className="p-4 border-2 border-transparent rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors">
                    <div className="space-y-2">
                      <div className="h-2 w-[80%] bg-slate-400 rounded" />
                      <div className="h-2 w-[60%] bg-slate-400 rounded" />
                    </div>
                  </div>
                  <div className="text-center text-sm font-medium">Claro</div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="channels" className="space-y-4">
            <Card className="border-border/50 bg-card/50 backdrop-blur">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Canais de Atendimento</CardTitle>
                    <CardDescription>Gerencie os canais disponíveis para conversas.</CardDescription>
                  </div>
                  <Button onClick={() => handleOpenDialog()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Canal
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {channelsLoading ? (
                  <div className="flex items-center justify-center p-8">
                    <div className="text-muted-foreground">Carregando...</div>
                  </div>
                ) : channels.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {channels.map((channel) => (
                      <Card key={channel.id} className="relative overflow-hidden">
                        <div 
                          className="absolute inset-x-0 top-0 h-1" 
                          style={{ backgroundColor: channel.color || '#3b82f6' }}
                        />
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              <div className="text-2xl">{channel.icon || '💬'}</div>
                              <div>
                                <CardTitle className="text-base">{channel.name}</CardTitle>
                                <CardDescription className="text-xs">/{channel.slug}</CardDescription>
                              </div>
                            </div>
                            {channel.isDefault && (
                              <Badge variant="secondary" className="gap-1">
                                <Lock className="h-3 w-3" />
                                Padrão
                              </Badge>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="flex items-center justify-between">
                            <Badge variant={channel.enabled ? "default" : "secondary"}>
                              {channel.enabled ? "Ativo" : "Inativo"}
                            </Badge>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleOpenDialog(channel)}
                                disabled={channel.isDefault}
                                title={channel.isDefault ? "Canal padrão não pode ser editado" : "Editar"}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(channel)}
                                disabled={channel.isDefault}
                                title={channel.isDefault ? "Canal padrão não pode ser deletado" : "Deletar"}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-8 text-center">
                    <Hash className="h-12 w-12 text-muted-foreground/50 mb-4" />
                    <p className="text-sm text-muted-foreground">Nenhum canal encontrado</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="webhooks" className="space-y-4">
            <WebhooksSettings />
          </TabsContent>
        </Tabs>
      </div>

      {/* Create/Edit Channel Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingChannel ? "Editar Canal" : "Novo Canal"}</DialogTitle>
            <DialogDescription>
              {editingChannel ? "Atualize as informações do canal" : "Crie um novo canal de atendimento"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome do Canal</Label>
              <Input
                placeholder="WhatsApp, Telegram, etc."
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Slug (URL)</Label>
              <Input
                placeholder="whatsapp, telegram, etc."
                value={formData.slug}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') 
                })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ícone/Emoji</Label>
                <Input
                  placeholder="💬"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Cor</Label>
                <Input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                />
              </div>
            </div>
            <div className="flex items-center justify-between p-4 border border-border rounded-lg">
              <div className="space-y-0.5">
                <Label>Canal Ativo</Label>
                <p className="text-sm text-muted-foreground">Permitir conversas neste canal</p>
              </div>
              <Switch
                checked={formData.enabled}
                onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
              {editingChannel ? "Atualizar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja deletar o canal "{channelToDelete?.name}"? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={deleteMutation.isPending}>
              Deletar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
