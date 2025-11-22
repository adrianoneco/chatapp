import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MessageSquare, Plus, Settings, Loader2, QrCode, RefreshCw, Power, PowerOff, Trash2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface Channel {
  id: string;
  name: string;
  type: string;
  description?: string;
  active: boolean;
  isDefault: boolean;
  config: {
    apiUrl?: string;
    apiKey?: string;
    instanceName?: string;
    connected?: boolean;
    profileName?: string;
    profilePicUrl?: string;
    phoneNumber?: string;
    qrCode?: string;
    webhookConfigured?: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

const CHANNEL_TYPES = [
  {
    id: 'whatsapp',
    name: 'WhatsApp (Evolution API)',
    description: 'Conecte seu WhatsApp Business via Evolution API',
    icon: '/evolution-logo.png',
  },
];

export default function Channels() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showNewChannelModal, setShowNewChannelModal] = useState(false);
  const [selectedChannelType, setSelectedChannelType] = useState<string | null>(null);
  const [showChannelForm, setShowChannelForm] = useState(false);
  const [showQRCode, setShowQRCode] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    apiUrl: '',
    apiKey: '',
    instanceName: '',
  });

  const { data: channels = [], isLoading } = useQuery<Channel[]>({
    queryKey: ['/api/channels'],
  });

  const createChannelMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Erro ao criar canal');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/channels'] });
      setShowNewChannelModal(false);
      setShowChannelForm(false);
      setSelectedChannelType(null);
      setFormData({ name: '', description: '', apiUrl: '', apiKey: '', instanceName: '' });
      toast({ title: "Canal criado com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao criar canal", variant: "destructive" });
    },
  });

  const connectChannelMutation = useMutation({
    mutationFn: async (channelId: string) => {
      const response = await fetch(`/api/channels/${channelId}/connect`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Erro ao conectar canal');
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/channels'] });
      if (data.qrCode) {
        setShowQRCode(data.qrCode);
      }
      toast({ title: data.message || "Canal conectado!" });
    },
    onError: () => {
      toast({ title: "Erro ao conectar canal", variant: "destructive" });
    },
  });

  const disconnectChannelMutation = useMutation({
    mutationFn: async (channelId: string) => {
      const response = await fetch(`/api/channels/${channelId}/disconnect`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Erro ao desconectar canal');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/channels'] });
      toast({ title: "Canal desconectado!" });
    },
    onError: () => {
      toast({ title: "Erro ao desconectar canal", variant: "destructive" });
    },
  });

  const syncChannelMutation = useMutation({
    mutationFn: async (channelId: string) => {
      const response = await fetch(`/api/channels/${channelId}/sync`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Erro ao sincronizar canal');
      return response.json();
    },
    onSuccess: (data) => {
      toast({ title: data.message || "Sincronização concluída!" });
    },
    onError: () => {
      toast({ title: "Erro ao sincronizar canal", variant: "destructive" });
    },
  });

  const deleteChannelMutation = useMutation({
    mutationFn: async (channelId: string) => {
      const response = await fetch(`/api/channels/${channelId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Erro ao deletar canal');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/channels'] });
      toast({ title: "Canal deletado!" });
    },
    onError: (error: any) => {
      toast({ title: error.message || "Erro ao deletar canal", variant: "destructive" });
    },
  });

  const handleCreateChannel = () => {
    if (selectedChannelType === 'whatsapp') {
      const channelData = {
        name: formData.name,
        type: 'whatsapp',
        description: formData.description,
        config: {
          apiUrl: formData.apiUrl,
          apiKey: formData.apiKey,
          instanceName: formData.instanceName,
          connected: false,
        },
      };
      createChannelMutation.mutate(channelData);
    }
  };

  const handleOpenNewChannelModal = () => {
    setShowNewChannelModal(true);
    setSelectedChannelType(null);
    setShowChannelForm(false);
  };

  const handleSelectChannelType = (typeId: string) => {
    setSelectedChannelType(typeId);
    setShowChannelForm(true);
  };

  const renderWhatsAppCard = (channel: Channel) => {
    const config = channel.config;
    const isConnected = config.connected;

    return (
      <Card key={channel.id}>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center overflow-hidden">
                  <img src="/evolution-logo.png" alt="WhatsApp" className="h-8 w-8 object-contain" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold">{channel.name}</h4>
                    {isConnected ? (
                      <Badge variant="default" className="text-xs bg-green-500">
                        Conectado
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        Desconectado
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {channel.description || 'WhatsApp via Evolution API'}
                  </p>
                  {isConnected && config.phoneNumber && (
                    <p className="text-xs text-muted-foreground mt-1">
                      📱 {config.phoneNumber}
                    </p>
                  )}
                </div>
              </div>
              {!channel.isDefault && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => deleteChannelMutation.mutate(channel.id)}
                  disabled={deleteChannelMutation.isPending}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </div>

            {isConnected && config.profileName && (
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                {config.profilePicUrl && (
                  <img 
                    src={config.profilePicUrl} 
                    alt={config.profileName}
                    className="h-10 w-10 rounded-full"
                  />
                )}
                <div>
                  <p className="text-sm font-medium">{config.profileName}</p>
                  <p className="text-xs text-muted-foreground">Conta conectada</p>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              {isConnected ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => syncChannelMutation.mutate(channel.id)}
                    disabled={syncChannelMutation.isPending}
                  >
                    {syncChannelMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    Sincronizar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => disconnectChannelMutation.mutate(channel.id)}
                    disabled={disconnectChannelMutation.isPending}
                  >
                    {disconnectChannelMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <PowerOff className="h-4 w-4 mr-2" />
                    )}
                    Desconectar
                  </Button>
                </>
              ) : (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => connectChannelMutation.mutate(channel.id)}
                  disabled={connectChannelMutation.isPending}
                >
                  {connectChannelMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <QrCode className="h-4 w-4 mr-2" />
                  )}
                  Conectar via QR Code
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderWebChatCard = (channel: Channel) => {
    return (
      <Card key={channel.id}>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold">{channel.name}</h4>
                  <Badge variant="secondary" className="text-xs">
                    Padrão
                  </Badge>
                  <Badge variant="default" className="text-xs bg-green-500">
                    Ativo
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {channel.description}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold mb-1">Canais de Atendimento</h3>
          <p className="text-sm text-muted-foreground">
            Gerencie os canais de comunicação com seus clientes
          </p>
        </div>
        <Button onClick={handleOpenNewChannelModal}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Canal
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid gap-4">
          {channels.map((channel) => 
            channel.type === 'whatsapp' 
              ? renderWhatsAppCard(channel)
              : renderWebChatCard(channel)
          )}
        </div>
      )}

      {/* New Channel Modal */}
      <Dialog open={showNewChannelModal} onOpenChange={setShowNewChannelModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Adicionar Novo Canal</DialogTitle>
            <DialogDescription>
              Selecione o tipo de canal que deseja adicionar
            </DialogDescription>
          </DialogHeader>

          {!showChannelForm ? (
            <div className="grid gap-4 py-4">
              {CHANNEL_TYPES.map((type) => (
                <Card 
                  key={type.id} 
                  className="cursor-pointer hover:border-primary transition-colors"
                  onClick={() => handleSelectChannelType(type.id)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center overflow-hidden">
                        <img src={type.icon} alt={type.name} className="h-8 w-8 object-contain" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold mb-1">{type.name}</h4>
                        <p className="text-sm text-muted-foreground">{type.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="name">Nome do Canal</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Meu WhatsApp Business"
                />
              </div>
              <div>
                <Label htmlFor="description">Descrição</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Canal principal de atendimento"
                />
              </div>
              <div>
                <Label htmlFor="apiUrl">URL da Evolution API</Label>
                <Input
                  id="apiUrl"
                  value={formData.apiUrl}
                  onChange={(e) => setFormData({ ...formData, apiUrl: e.target.value })}
                  placeholder="https://api.evolution.com"
                />
              </div>
              <div>
                <Label htmlFor="apiKey">API Key</Label>
                <Input
                  id="apiKey"
                  type="password"
                  value={formData.apiKey}
                  onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                  placeholder="Sua chave de API"
                />
              </div>
              <div>
                <Label htmlFor="instanceName">Nome da Instância</Label>
                <Input
                  id="instanceName"
                  value={formData.instanceName}
                  onChange={(e) => setFormData({ ...formData, instanceName: e.target.value })}
                  placeholder="minha-instancia"
                />
              </div>
            </div>
          )}

          {showChannelForm && (
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowChannelForm(false)}>
                Voltar
              </Button>
              <Button 
                onClick={handleCreateChannel}
                disabled={createChannelMutation.isPending || !formData.name || !formData.apiUrl || !formData.apiKey || !formData.instanceName}
              >
                {createChannelMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Criando...
                  </>
                ) : (
                  'Criar Canal'
                )}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* QR Code Modal */}
      <Dialog open={!!showQRCode} onOpenChange={() => setShowQRCode(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Escaneie o QR Code</DialogTitle>
            <DialogDescription>
              Abra o WhatsApp no seu celular e escaneie o código abaixo
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center p-6">
            {showQRCode && (
              <img 
                src={showQRCode} 
                alt="QR Code" 
                className="w-64 h-64"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
