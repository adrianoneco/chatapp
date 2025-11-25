import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit, Trash2, Webhook, Send, Activity, CheckCircle2, XCircle, Loader2, Key, RefreshCw } from "lucide-react";
import { apiRequest } from "@/lib/api";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface WebhookType {
  id: string;
  name: string;
  url: string;
  enabled: boolean;
  authType: "none" | "apikey" | "bearer" | "basic";
  authConfig: any;
  headers: Record<string, string>;
  events: string[];
  createdAt: string;
  updatedAt: string;
}

interface WebhookLog {
  id: string;
  webhookId: string;
  eventType: string;
  payload: any;
  responseStatus: number | null;
  responseBody: string | null;
  success: boolean;
  errorMessage: string | null;
  createdAt: string;
}

const EVENT_GROUPS = {
  conversations: {
    label: "Conversas",
    events: [
      { value: "conversation.created", label: "Conversa Criada" },
      { value: "conversation.assigned", label: "Conversa Atribuída" },
      { value: "conversation.transferred", label: "Conversa Transferida" },
      { value: "conversation.closed", label: "Conversa Fechada" },
    ]
  },
  messages: {
    label: "Mensagens",
    events: [
      { value: "message.sent", label: "Mensagem Enviada" },
      { value: "message.updated", label: "Mensagem Atualizada" },
      { value: "message.deleted", label: "Mensagem Deletada" },
    ]
  },
  users: {
    label: "Usuários",
    events: [
      { value: "user.created", label: "Usuário Criado" },
      { value: "user.updated", label: "Usuário Atualizado" },
      { value: "user.deleted", label: "Usuário Deletado" },
    ]
  },
};

const EXAMPLE_PAYLOADS: Record<string, any> = {
  "conversation.created": {
    event: "conversation.created",
    timestamp: new Date().toISOString(),
    data: {
      id: "conv_123",
      protocol: "ABC1234567",
      channel: "webchat",
      status: "waiting",
      clientId: "user_456",
      clientIp: "192.168.1.1",
      clientLocation: "São Paulo, BR"
    }
  },
  "conversation.assigned": {
    event: "conversation.assigned",
    timestamp: new Date().toISOString(),
    data: {
      id: "conv_123",
      protocol: "ABC1234567",
      status: "active",
      attendantId: "att_789"
    }
  },
  "conversation.transferred": {
    event: "conversation.transferred",
    timestamp: new Date().toISOString(),
    data: {
      conversation: { id: "conv_123", protocol: "ABC1234567" },
      fromAttendantId: "att_789",
      toAttendantId: "att_012"
    }
  },
  "conversation.closed": {
    event: "conversation.closed",
    timestamp: new Date().toISOString(),
    data: {
      id: "conv_123",
      protocol: "ABC1234567",
      status: "closed",
      closedAt: new Date().toISOString()
    }
  },
  "message.sent": {
    event: "message.sent",
    timestamp: new Date().toISOString(),
    data: {
      message: {
        id: "msg_456",
        conversationId: "conv_123",
        senderId: "att_789",
        content: "Olá, como posso ajudar?",
        type: "text"
      },
      conversationId: "conv_123"
    }
  },
  "message.updated": {
    event: "message.updated",
    timestamp: new Date().toISOString(),
    data: {
      message: {
        id: "msg_456",
        conversationId: "conv_123",
        content: "Mensagem editada",
        updatedAt: new Date().toISOString()
      },
      conversationId: "conv_123"
    }
  },
  "message.deleted": {
    event: "message.deleted",
    timestamp: new Date().toISOString(),
    data: {
      messageId: "msg_456",
      conversationId: "conv_123"
    }
  },
  "user.created": {
    event: "user.created",
    timestamp: new Date().toISOString(),
    data: {
      id: "user_789",
      email: "usuario@example.com",
      displayName: "Novo Usuário",
      role: "client"
    }
  },
  "user.updated": {
    event: "user.updated",
    timestamp: new Date().toISOString(),
    data: {
      id: "user_789",
      email: "usuario@example.com",
      displayName: "Nome Atualizado",
      updatedAt: new Date().toISOString()
    }
  },
  "user.deleted": {
    event: "user.deleted",
    timestamp: new Date().toISOString(),
    data: {
      id: "user_789",
      user: { email: "usuario@example.com", displayName: "Usuário Deletado" }
    }
  },
};

export function WebhooksSettings() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<WebhookType | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [webhookToDelete, setWebhookToDelete] = useState<WebhookType | null>(null);
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [testingWebhook, setTestingWebhook] = useState<WebhookType | null>(null);
  const [testPayload, setTestPayload] = useState("{\n  \"event\": \"test\",\n  \"timestamp\": \"2024-01-01T00:00:00Z\",\n  \"data\": {\n    \"message\": \"Test webhook\"\n  }\n}");
  const [testResult, setTestResult] = useState<any>(null);
  const [logsDialogOpen, setLogsDialogOpen] = useState(false);
  const [selectedWebhookForLogs, setSelectedWebhookForLogs] = useState<WebhookType | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    url: "",
    enabled: true,
    authType: "none" as "none" | "apikey" | "bearer" | "basic",
    authConfig: {} as any,
    headers: {} as Record<string, string>,
    events: [] as string[],
  });

  const [headerKey, setHeaderKey] = useState("");
  const [headerValue, setHeaderValue] = useState("");

  const { data: webhooks = [], isLoading: webhooksLoading } = useQuery<WebhookType[]>({
    queryKey: ["/webhooks"],
    queryFn: () => apiRequest("/webhooks"),
  });

  const { data: logs = [] } = useQuery<WebhookLog[]>({
    queryKey: ["/webhooks", selectedWebhookForLogs?.id, "logs"],
    queryFn: () => apiRequest(`/webhooks/${selectedWebhookForLogs?.id}/logs`),
    enabled: !!selectedWebhookForLogs?.id && logsDialogOpen,
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof formData) => apiRequest("/webhooks", {
      method: "POST",
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/webhooks"] });
      toast.success("Webhook criado com sucesso!");
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao criar webhook");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: typeof formData }) => 
      apiRequest(`/webhooks/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/webhooks"] });
      toast.success("Webhook atualizado com sucesso!");
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao atualizar webhook");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/webhooks/${id}`, {
      method: "DELETE",
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/webhooks"] });
      toast.success("Webhook deletado com sucesso!");
      setDeleteDialogOpen(false);
      setWebhookToDelete(null);
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao deletar webhook");
    },
  });

  const testMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => 
      apiRequest(`/webhooks/${id}/test`, {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: (data: any) => {
      setTestResult(data);
      if (data.success) {
        toast.success(`Webhook testado com sucesso! Status: ${data.status}`);
      } else {
        toast.error(`Erro no teste: ${data.error || 'Falha na requisição'}`);
      }
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao testar webhook");
      setTestResult({ success: false, error: error.message });
    },
  });

  const handleOpenDialog = (webhook?: WebhookType) => {
    if (webhook) {
      setEditingWebhook(webhook);
      setFormData({
        name: webhook.name,
        url: webhook.url,
        enabled: webhook.enabled,
        authType: webhook.authType,
        authConfig: webhook.authConfig || {},
        headers: webhook.headers || {},
        events: webhook.events || [],
      });
    } else {
      setEditingWebhook(null);
      setFormData({
        name: "",
        url: "",
        enabled: true,
        authType: "none",
        authConfig: {},
        headers: {},
        events: [],
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingWebhook(null);
    setHeaderKey("");
    setHeaderValue("");
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.url) {
      toast.error("Nome e URL são obrigatórios");
      return;
    }

    if (editingWebhook) {
      updateMutation.mutate({ id: editingWebhook.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (webhook: WebhookType) => {
    setWebhookToDelete(webhook);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (webhookToDelete) {
      deleteMutation.mutate(webhookToDelete.id);
    }
  };

  const handleTest = (webhook: WebhookType) => {
    setTestingWebhook(webhook);
    setTestResult(null);
    setTestDialogOpen(true);
  };

  const handleTestSubmit = () => {
    if (!testingWebhook) return;
    
    try {
      const payload = JSON.parse(testPayload);
      setTestResult(null);
      testMutation.mutate({ id: testingWebhook.id, payload });
    } catch (error) {
      toast.error("Payload JSON inválido");
    }
  };

  const generateApiKey = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let key = '';
    for (let i = 0; i < 32; i++) {
      key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return key;
  };

  const generateJWT = () => {
    const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
    const payload = btoa(JSON.stringify({ 
      iss: "chatapp",
      sub: "webhook",
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60) // 1 year
    }));
    const signature = generateApiKey().substring(0, 43);
    return `${header}.${payload}.${signature}`;
  };

  const handleGenerateKey = () => {
    if (formData.authType === 'apikey') {
      const key = generateApiKey();
      setFormData({
        ...formData,
        authConfig: { 
          apikey: { 
            header: formData.authConfig.apikey?.header || 'X-API-Key',
            value: key
          } 
        }
      });
      toast.success("API Key gerada!");
    } else if (formData.authType === 'bearer') {
      const token = generateJWT();
      setFormData({
        ...formData,
        authConfig: { bearer: { token } }
      });
      toast.success("JWT gerado!");
    }
  };

  const handleAddHeader = () => {
    if (!headerKey || !headerValue) return;
    setFormData({
      ...formData,
      headers: { ...formData.headers, [headerKey]: headerValue }
    });
    setHeaderKey("");
    setHeaderValue("");
  };

  const handleRemoveHeader = (key: string) => {
    const newHeaders = { ...formData.headers };
    delete newHeaders[key];
    setFormData({ ...formData, headers: newHeaders });
  };

  const handleEventToggle = (eventValue: string) => {
    const currentEvents = formData.events;
    const newEvents = currentEvents.includes(eventValue)
      ? currentEvents.filter(e => e !== eventValue)
      : [...currentEvents, eventValue];
    setFormData({ ...formData, events: newEvents });
  };

  const handleViewLogs = (webhook: WebhookType) => {
    setSelectedWebhookForLogs(webhook);
    setLogsDialogOpen(true);
  };

  return (
    <>
      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Webhook className="h-5 w-5" />
                Webhooks
              </CardTitle>
              <CardDescription>Configure webhooks para receber notificações de eventos</CardDescription>
            </div>
            <Button onClick={() => handleOpenDialog()} className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Webhook
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {webhooksLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : webhooks.length === 0 ? (
            <div className="text-center py-12">
              <Webhook className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">Nenhum webhook configurado</p>
              <p className="text-sm text-muted-foreground mt-1">Crie um webhook para começar</p>
            </div>
          ) : (
            <div className="space-y-4">
              {webhooks.map((webhook) => (
                <div key={webhook.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-medium">{webhook.name}</h4>
                      <Badge variant={webhook.enabled ? "default" : "secondary"}>
                        {webhook.enabled ? "Ativo" : "Inativo"}
                      </Badge>
                      <Badge variant="outline">{webhook.authType.toUpperCase()}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground font-mono truncate mb-2">{webhook.url}</p>
                    <div className="flex gap-2 flex-wrap">
                      {webhook.events.length > 0 ? (
                        webhook.events.slice(0, 3).map((event) => (
                          <Badge key={event} variant="secondary" className="text-xs">{event}</Badge>
                        ))
                      ) : (
                        <Badge variant="secondary" className="text-xs">Nenhum evento</Badge>
                      )}
                      {webhook.events.length > 3 && (
                        <Badge variant="secondary" className="text-xs">+{webhook.events.length - 3}</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleViewLogs(webhook)}>
                      <Activity className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleTest(webhook)}>
                      <Send className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleOpenDialog(webhook)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(webhook)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingWebhook ? "Editar Webhook" : "Novo Webhook"}</DialogTitle>
            <DialogDescription>Configure o webhook e selecione os eventos para notificação</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Basic Info */}
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Notificações de Conversas"
              />
            </div>
            <div className="space-y-2">
              <Label>URL do Webhook</Label>
              <Input
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="https://example.com/webhook"
              />
            </div>

            {/* Auth Type */}
            <div className="space-y-2">
              <Label>Tipo de Autenticação</Label>
              <Select value={formData.authType} onValueChange={(value: any) => setFormData({ ...formData, authType: value, authConfig: {} })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma</SelectItem>
                  <SelectItem value="apikey">API Key (Header)</SelectItem>
                  <SelectItem value="bearer">Bearer Token</SelectItem>
                  <SelectItem value="basic">Basic Auth</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Auth Config */}
            {formData.authType === "apikey" && (
              <div className="space-y-2 p-4 border border-border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <Label>API Key</Label>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={handleGenerateKey}
                    className="gap-2"
                  >
                    <Key className="h-4 w-4" />
                    Gerar API Key
                  </Button>
                </div>
                <Input
                  placeholder="Nome do Header (ex: X-API-Key)"
                  value={formData.authConfig.apikey?.header || ""}
                  onChange={(e) => setFormData({
                    ...formData,
                    authConfig: { apikey: { ...formData.authConfig.apikey, header: e.target.value } }
                  })}
                />
                <Input
                  placeholder="Valor da API Key"
                  value={formData.authConfig.apikey?.value || ""}
                  onChange={(e) => setFormData({
                    ...formData,
                    authConfig: { apikey: { ...formData.authConfig.apikey, value: e.target.value } }
                  })}
                />
              </div>
            )}

            {formData.authType === "bearer" && (
              <div className="space-y-2 p-4 border border-border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <Label>Bearer Token (JWT)</Label>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={handleGenerateKey}
                    className="gap-2"
                  >
                    <Key className="h-4 w-4" />
                    Gerar JWT
                  </Button>
                </div>
                <Textarea
                  placeholder="Token JWT"
                  value={formData.authConfig.bearer?.token || ""}
                  onChange={(e) => setFormData({
                    ...formData,
                    authConfig: { bearer: { token: e.target.value } }
                  })}
                  className="font-mono text-xs"
                />
              </div>
            )}

            {formData.authType === "basic" && (
              <div className="space-y-2 p-4 border border-border rounded-lg">
                <Label>Basic Auth</Label>
                <Input
                  placeholder="Username"
                  value={formData.authConfig.basic?.username || ""}
                  onChange={(e) => setFormData({
                    ...formData,
                    authConfig: { basic: { ...formData.authConfig.basic, username: e.target.value } }
                  })}
                />
                <Input
                  type="password"
                  placeholder="Password"
                  value={formData.authConfig.basic?.password || ""}
                  onChange={(e) => setFormData({
                    ...formData,
                    authConfig: { basic: { ...formData.authConfig.basic, password: e.target.value } }
                  })}
                />
              </div>
            )}

            {/* Custom Headers */}
            <div className="space-y-2">
              <Label>Headers Customizados</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Nome do Header"
                  value={headerKey}
                  onChange={(e) => setHeaderKey(e.target.value)}
                />
                <Input
                  placeholder="Valor"
                  value={headerValue}
                  onChange={(e) => setHeaderValue(e.target.value)}
                />
                <Button type="button" onClick={handleAddHeader}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {Object.entries(formData.headers).length > 0 && (
                <div className="space-y-2 mt-2">
                  {Object.entries(formData.headers).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between p-2 bg-secondary rounded">
                      <span className="font-mono text-sm">{key}: {value}</span>
                      <Button variant="ghost" size="sm" onClick={() => handleRemoveHeader(key)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Events */}
            <div className="space-y-2">
              <Label>Eventos</Label>
              <Tabs defaultValue="conversations" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="conversations">Conversas</TabsTrigger>
                  <TabsTrigger value="messages">Mensagens</TabsTrigger>
                  <TabsTrigger value="users">Usuários</TabsTrigger>
                </TabsList>
                {Object.entries(EVENT_GROUPS).map(([key, group]) => (
                  <TabsContent key={key} value={key} className="space-y-2">
                    {group.events.map((event) => (
                      <div key={event.value} className="flex items-center justify-between p-3 border border-border rounded">
                        <Label htmlFor={event.value} className="cursor-pointer">{event.label}</Label>
                        <Switch
                          id={event.value}
                          checked={formData.events.includes(event.value)}
                          onCheckedChange={() => handleEventToggle(event.value)}
                        />
                      </div>
                    ))}
                  </TabsContent>
                ))}
              </Tabs>
            </div>

            {/* Enabled Switch */}
            <div className="flex items-center justify-between p-4 border border-border rounded-lg">
              <div className="space-y-0.5">
                <Label>Webhook Ativo</Label>
                <p className="text-sm text-muted-foreground">Receber notificações de eventos</p>
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
              {editingWebhook ? "Atualizar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja deletar o webhook "{webhookToDelete?.name}"? Esta ação não pode ser desfeita.
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

      {/* Test Dialog */}
      <Dialog open={testDialogOpen} onOpenChange={setTestDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Testar Webhook</DialogTitle>
            <DialogDescription>
              Envie um payload de teste para "{testingWebhook?.name}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Quick Test Buttons */}
            <div className="space-y-2">
              <Label>Payloads de Exemplo</Label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(EXAMPLE_PAYLOADS).map(([event, payload]) => {
                  const eventLabel = Object.values(EVENT_GROUPS)
                    .flatMap(g => g.events)
                    .find(e => e.value === event)?.label || event;
                  
                  return (
                    <Button
                      key={event}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setTestPayload(JSON.stringify(payload, null, 2))}
                      className="justify-start text-xs"
                    >
                      <Send className="h-3 w-3 mr-2" />
                      {eventLabel}
                    </Button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Payload JSON</Label>
              <Textarea
                value={testPayload}
                onChange={(e) => setTestPayload(e.target.value)}
                placeholder='{"event": "test", "data": {}}'
                className="font-mono text-sm min-h-[200px]"
              />
            </div>

            {testResult && (
              <Alert className={testResult.success ? "border-green-600 bg-green-950/30 dark:bg-green-950/30" : "border-red-600 bg-red-950/30 dark:bg-red-950/30"}>
                <div className="flex items-start gap-3">
                  {testResult.success ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500 dark:text-green-400 mt-0.5" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500 dark:text-red-400 mt-0.5" />
                  )}
                  <div className="flex-1 space-y-2">
                    <AlertDescription>
                      <div className="font-semibold mb-2 text-foreground">
                        {testResult.success ? "✓ Requisição bem-sucedida" : "✗ Requisição falhou"}
                      </div>
                      {testResult.status && (
                        <div className="text-sm text-foreground/90">
                          <strong>Status HTTP:</strong> {testResult.status} {testResult.statusText || ""}
                        </div>
                      )}
                      {testResult.error && (
                        <div className="text-sm text-red-400 dark:text-red-300">
                          <strong>Erro:</strong> {testResult.error}
                        </div>
                      )}
                      {testResult.body && (
                        <details className="mt-2">
                          <summary className="cursor-pointer text-sm font-medium hover:underline text-foreground/80">
                            Ver resposta completa
                          </summary>
                          <pre className="mt-2 p-3 bg-black/40 dark:bg-black/60 rounded text-xs overflow-x-auto max-h-[200px] text-green-400 dark:text-green-300 border border-border/50">
                            {typeof testResult.body === 'string' ? testResult.body : JSON.stringify(testResult.body, null, 2)}
                          </pre>
                        </details>
                      )}
                    </AlertDescription>
                  </div>
                </div>
              </Alert>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setTestDialogOpen(false); setTestResult(null); }}>
              Fechar
            </Button>
            <Button onClick={handleTestSubmit} disabled={testMutation.isPending}>
              {testMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Enviar Teste
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Logs Dialog */}
      <Dialog open={logsDialogOpen} onOpenChange={setLogsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Logs do Webhook</DialogTitle>
            <DialogDescription>
              Histórico de chamadas para "{selectedWebhookForLogs?.name}"
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[500px] pr-4">
            {logs.length === 0 ? (
              <div className="text-center py-12">
                <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">Nenhum log disponível</p>
              </div>
            ) : (
              <div className="space-y-4">
                {logs.map((log) => (
                  <div key={log.id} className="p-4 border border-border rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {log.success ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500" />
                        )}
                        <span className="font-medium">{log.eventType}</span>
                        {log.responseStatus && (
                          <Badge variant="outline">Status: {log.responseStatus}</Badge>
                        )}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(log.createdAt), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                      </span>
                    </div>
                    {log.errorMessage && (
                      <div className="text-sm text-red-500 bg-red-50 dark:bg-red-950/20 p-2 rounded">
                        {log.errorMessage}
                      </div>
                    )}
                    {log.responseBody && (
                      <details className="text-sm">
                        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                          Ver Resposta
                        </summary>
                        <pre className="mt-2 p-2 bg-secondary rounded overflow-x-auto text-xs">
                          {log.responseBody}
                        </pre>
                      </details>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}
