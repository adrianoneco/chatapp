import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Lock } from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import { toast } from "sonner";

interface Channel {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  enabled: boolean;
  locked: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function Channels() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingChannel, setEditingChannel] = useState<Channel | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    imageUrl: "",
    enabled: true,
    locked: false,
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");

  const { data: channels = [], isLoading } = useQuery<Channel[]>({
    queryKey: ["/channels"],
    queryFn: () => apiRequest("/channels"),
  });

  const uploadImageMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("image", file);
      return apiRequest("/channels/upload-image", {
        method: "POST",
        body: formData,
      });
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      let imageUrl = data.imageUrl;
      
      // Upload image if selected
      if (selectedImage) {
        const uploadResult = await uploadImageMutation.mutateAsync(selectedImage);
        imageUrl = uploadResult.imageUrl;
      }
      
      return apiRequest("/channels", {
        method: "POST",
        body: JSON.stringify({ ...data, imageUrl }),
      });
    },
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
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      let imageUrl = data.imageUrl;
      
      // Upload image if selected
      if (selectedImage) {
        const uploadResult = await uploadImageMutation.mutateAsync(selectedImage);
        imageUrl = uploadResult.imageUrl;
      }
      
      return apiRequest(`/channels/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ ...data, imageUrl }),
      });
    },
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
        description: channel.description || "",
        imageUrl: channel.imageUrl || "",
        enabled: channel.enabled,
        locked: channel.locked,
      });
      setImagePreview(channel.imageUrl || "");
    } else {
      setEditingChannel(null);
      setFormData({
        name: "",
        slug: "",
        description: "",
        imageUrl: "",
        enabled: true,
        locked: false,
      });
      setImagePreview("");
    }
    setSelectedImage(null);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingChannel(null);
    setFormData({
      name: "",
      slug: "",
      description: "",
      imageUrl: "",
      enabled: true,
      locked: false,
    });
    setSelectedImage(null);
    setImagePreview("");
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingChannel) {
      updateMutation.mutate({ id: editingChannel.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (channel: Channel) => {
    if (channel.isDefault) {
      toast.error("Não é possível deletar o canal padrão");
      return;
    }
    if (channel.locked) {
      toast.error("Não é possível deletar um canal bloqueado");
      return;
    }
    if (confirm(`Tem certeza que deseja deletar o canal "${channel.name}"?`)) {
      deleteMutation.mutate(channel.id);
    }
  };

  return (
    <MainLayout>
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Canais</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie os canais de atendimento disponíveis
            </p>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Canal
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Carregando canais...</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {channels.map((channel) => (
              <Card key={channel.id} className="relative">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {channel.imageUrl ? (
                        <img 
                          src={channel.imageUrl} 
                          alt={channel.name}
                          className="h-12 w-12 rounded-lg object-cover border"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center text-2xl">
                          📱
                        </div>
                      )}
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {channel.name}
                          {channel.isDefault && (
                            <Badge variant="secondary" className="text-xs">
                              <Lock className="h-3 w-3 mr-1" />
                              Padrão
                            </Badge>
                          )}
                          {channel.locked && (
                            <Badge variant="outline" className="text-xs border-amber-500 text-amber-600">
                              <Lock className="h-3 w-3 mr-1" />
                              Bloqueado
                            </Badge>
                          )}
                        </CardTitle>
                        {channel.description && (
                          <p className="text-sm text-muted-foreground mt-1">{channel.description}</p>
                        )}
                        <CardDescription>/{channel.slug}</CardDescription>
                      </div>
                    </div>
                    <Badge
                      variant={channel.enabled ? "default" : "secondary"}
                    >
                      {channel.enabled ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingChannel ? "Editar Canal" : "Novo Canal"}
              </DialogTitle>
              <DialogDescription>
                {editingChannel 
                  ? "Atualize as informações do canal"
                  : "Crie um novo canal de atendimento"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="WhatsApp"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                    placeholder="whatsapp"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    URL: /conversations/{formData.slug || "slug"}/:id
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Canal de atendimento via WhatsApp"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="image">Imagem do Canal</Label>
                  <div className="flex items-center gap-4">
                    {imagePreview && (
                      <img 
                        src={imagePreview} 
                        alt="Preview"
                        className="h-16 w-16 rounded-lg object-cover border"
                      />
                    )}
                    <Input
                      id="image"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="flex-1"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Formatos aceitos: JPG, PNG, GIF (máx. 5MB)
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="enabled">Canal ativo</Label>
                  <Switch
                    id="enabled"
                    checked={formData.enabled}
                    onCheckedChange={(enabled) => setFormData({ ...formData, enabled })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="locked">Bloquear canal</Label>
                    <p className="text-xs text-muted-foreground">Impede edição e exclusão</p>
                  </div>
                  <Switch
                    id="locked"
                    checked={formData.locked}
                    onCheckedChange={(locked) => setFormData({ ...formData, locked })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingChannel ? "Atualizar" : "Criar"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
