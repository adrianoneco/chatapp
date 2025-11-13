import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, Key, RefreshCw, Play, X, Check } from "lucide-react";
import { insertWebhookSchema, type Webhook } from "@shared/schema";
import { Badge } from "@/components/ui/badge";

const webhookFormSchema = insertWebhookSchema.extend({
  name: z.string().min(1, "Nome é obrigatório"),
  targetUrl: z.string().url("URL inválida"),
});

type WebhookFormData = z.infer<typeof webhookFormSchema>;

const AVAILABLE_EVENTS = [
  { id: "message.created", label: "Mensagem Criada", route: "/api/messages" },
  { id: "message.updated", label: "Mensagem Atualizada", route: "/api/messages" },
  { id: "conversation.created", label: "Conversa Criada", route: "/api/conversations" },
  { id: "conversation.updated", label: "Conversa Atualizada", route: "/api/conversations" },
  { id: "conversation.closed", label: "Conversa Fechada", route: "/api/conversations" },
  { id: "conversation.transferred", label: "Conversa Transferida", route: "/api/conversations" },
  { id: "call.started", label: "Chamada Iniciada", route: "/api/calls" },
  { id: "call.ended", label: "Chamada Finalizada", route: "/api/calls" },
];

export function WebHooksTab() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<Webhook | null>(null);
  const [headers, setHeaders] = useState<Array<{ key: string; value: string }>>([{ key: "", value: "" }]);
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [testResult, setTestResult] = useState<any>(null);
  const [isGeneratingKey, setIsGeneratingKey] = useState(false);

  const form = useForm<WebhookFormData>({
    resolver: zodResolver(webhookFormSchema),
    defaultValues: {
      name: "",
      targetUrl: import.meta.env.VITE_WEBHOOK_DEFAULT_URL || "",
      authType: "none",
      authPayload: {},
      events: [],
      headers: {},
      isActive: true,
    },
  });

  const authType = form.watch("authType");

  const { data: webhooks = [], isLoading } = useQuery<Webhook[]>({
    queryKey: ["/api/webhooks"],
  });

  const createMutation = useMutation({
    mutationFn: async (webhook: WebhookFormData) => {
      const response = await apiRequest("POST", "/api/webhooks", webhook);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/webhooks"] });
      toast({ title: "WebHook criado", description: "WebHook configurado com sucesso" });
      handleCloseDialog();
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar webhook",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: WebhookFormData }) => {
      const response = await apiRequest("PUT", `/api/webhooks/${id}`, data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/webhooks"] });
      toast({ title: "WebHook atualizado", description: "WebHook modificado com sucesso" });
      handleCloseDialog();
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar webhook",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/webhooks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/webhooks"] });
      toast({ title: "WebHook excluído", description: "WebHook removido com sucesso" });
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir webhook",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    },
  });

  const testMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("POST", `/api/webhooks/${id}/test`);
      return await response.json();
    },
    onSuccess: (data) => {
      setTestResult(data);
      toast({ 
        title: data.success ? "Teste bem-sucedido" : "Teste falhou", 
        description: `Status: ${data.status} - Tempo: ${data.duration}ms`,
        variant: data.success ? "default" : "destructive",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao testar webhook",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    },
  });

  const handleGenerateKey = async (type: "key" | "jwt") => {
    setIsGeneratingKey(true);
    try {
      const endpoint = type === "key" ? "/api/webhooks/generate-key" : "/api/webhooks/generate-jwt";
      const response = await apiRequest("POST", endpoint);
      const data = await response.json();
      
      const token = type === "key" ? data.key : data.token;
      form.setValue("authPayload", { token });
      
      toast({ 
        title: `${type === "key" ? "API Key" : "JWT"} gerado`, 
        description: "Token copiado para o campo de autenticação" 
      });
    } catch (error) {
      toast({
        title: "Erro ao gerar token",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingKey(false);
    }
  };

  const handleAddHeader = () => {
    const newHeaders = [...headers, { key: "", value: "" }];
    setHeaders(newHeaders);
    const headersObj = newHeaders.reduce((acc, { key, value }) => {
      if (key.trim()) acc[key] = value;
      return acc;
    }, {} as Record<string, string>);
    form.setValue("headers", headersObj);
  };

  const handleRemoveHeader = (index: number) => {
    const newHeaders = headers.filter((_, i) => i !== index);
    setHeaders(newHeaders);
    const headersObj = newHeaders.reduce((acc, { key, value }) => {
      if (key.trim()) acc[key] = value;
      return acc;
    }, {} as Record<string, string>);
    form.setValue("headers", headersObj);
  };

  const handleHeaderChange = (index: number, field: "key" | "value", value: string) => {
    const newHeaders = [...headers];
    newHeaders[index][field] = value;
    setHeaders(newHeaders);
    const headersObj = newHeaders.reduce((acc, { key, value }) => {
      if (key.trim()) acc[key] = value;
      return acc;
    }, {} as Record<string, string>);
    form.setValue("headers", headersObj);
  };

  const handleEventToggle = (eventId: string, checked: boolean) => {
    const newEvents = checked
      ? [...selectedEvents, eventId]
      : selectedEvents.filter((e) => e !== eventId);
    setSelectedEvents(newEvents);
    form.setValue("events", newEvents);
  };

  const handleOpenDialog = (webhook?: Webhook) => {
    if (webhook) {
      setEditingWebhook(webhook);
      form.reset({
        name: webhook.name,
        targetUrl: webhook.targetUrl,
        authType: webhook.authType,
        authPayload: webhook.authPayload || {},
        events: webhook.events || [],
        headers: webhook.headers || {},
        isActive: webhook.isActive,
      });
      
      const headersArray = Object.entries(webhook.headers || {}).map(([key, value]) => ({ key, value }));
      setHeaders(headersArray.length > 0 ? headersArray : [{ key: "", value: "" }]);
      setSelectedEvents(webhook.events || []);
    } else {
      setEditingWebhook(null);
      form.reset({
        name: "",
        targetUrl: import.meta.env.VITE_WEBHOOK_DEFAULT_URL || "",
        authType: "none",
        authPayload: {},
        events: [],
        headers: {},
        isActive: true,
      });
      setHeaders([{ key: "", value: "" }]);
      setSelectedEvents([]);
    }
    setTestResult(null);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingWebhook(null);
    setTestResult(null);
    form.reset();
  };

  const handleSubmit = form.handleSubmit((data) => {
    if (editingWebhook) {
      updateMutation.mutate({ id: editingWebhook.id, data });
    } else {
      createMutation.mutate(data);
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">WebHooks</h2>
          <p className="text-sm text-muted-foreground">
            Configure notificações HTTP para eventos do sistema
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()} data-testid="button-new-webhook">
              <Plus className="w-4 h-4 mr-2" />
              Novo WebHook
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>{editingWebhook ? "Editar WebHook" : "Novo WebHook"}</DialogTitle>
              <DialogDescription>
                Configure um endpoint para receber notificações de eventos
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[calc(90vh-200px)] pr-4">
              <Form {...form}>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Ex: Notificação Slack" data-testid="input-webhook-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="targetUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>URL do Webhook</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="https://..." data-testid="input-webhook-url" />
                        </FormControl>
                        <FormDescription>
                          {import.meta.env.VITE_WEBHOOK_DEFAULT_URL && `Padrão: ${import.meta.env.VITE_WEBHOOK_DEFAULT_URL}`}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Separator />

                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Headers Customizados</h4>
                    {headers.map((header, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          placeholder="Chave"
                          value={header.key}
                          onChange={(e) => handleHeaderChange(index, "key", e.target.value)}
                          className="flex-1"
                          data-testid={`input-header-key-${index}`}
                        />
                        <Input
                          placeholder="Valor"
                          value={header.value}
                          onChange={(e) => handleHeaderChange(index, "value", e.target.value)}
                          className="flex-1"
                          data-testid={`input-header-value-${index}`}
                        />
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() => handleRemoveHeader(index)}
                          data-testid={`button-remove-header-${index}`}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddHeader}
                      data-testid="button-add-header"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar Header
                    </Button>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Autenticação</h4>
                    <FormField
                      control={form.control}
                      name="authType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-auth-type">
                                <SelectValue placeholder="Selecione o tipo" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">Nenhum</SelectItem>
                              <SelectItem value="bearer">Bearer Token</SelectItem>
                              <SelectItem value="api_key">API Key</SelectItem>
                              <SelectItem value="basic">Basic Auth</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {authType === "bearer" && (
                      <div className="space-y-2">
                        <FormField
                          control={form.control}
                          name="authPayload.token"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Bearer Token</FormLabel>
                              <div className="flex gap-2">
                                <FormControl>
                                  <Input {...field} placeholder="Token" data-testid="input-bearer-token" />
                                </FormControl>
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="outline"
                                  onClick={() => handleGenerateKey("jwt")}
                                  disabled={isGeneratingKey}
                                  data-testid="button-generate-jwt"
                                >
                                  <RefreshCw className={`w-4 h-4 ${isGeneratingKey ? "animate-spin" : ""}`} />
                                </Button>
                              </div>
                              <FormDescription>Gerar JWT de exemplo</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}

                    {authType === "api_key" && (
                      <div className="space-y-2">
                        <FormField
                          control={form.control}
                          name="authPayload.key"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>API Key</FormLabel>
                              <div className="flex gap-2">
                                <FormControl>
                                  <Input {...field} placeholder="Chave da API" data-testid="input-api-key" />
                                </FormControl>
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="outline"
                                  onClick={() => handleGenerateKey("key")}
                                  disabled={isGeneratingKey}
                                  data-testid="button-generate-key"
                                >
                                  <Key className="w-4 h-4" />
                                </Button>
                              </div>
                              <FormDescription>Gerar API Key aleatória</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}

                    {authType === "basic" && (
                      <div className="space-y-2">
                        <FormField
                          control={form.control}
                          name="authPayload.username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Username</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Usuário" data-testid="input-basic-username" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="authPayload.password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Password</FormLabel>
                              <FormControl>
                                <Input {...field} type="password" placeholder="Senha" data-testid="input-basic-password" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Eventos</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {AVAILABLE_EVENTS.map((event) => (
                        <div key={event.id} className="flex items-start space-x-2">
                          <Checkbox
                            id={event.id}
                            checked={selectedEvents.includes(event.id)}
                            onCheckedChange={(checked) => handleEventToggle(event.id, !!checked)}
                            data-testid={`checkbox-event-${event.id}`}
                          />
                          <div className="grid gap-0.5">
                            <label
                              htmlFor={event.id}
                              className="text-sm font-medium leading-none cursor-pointer"
                            >
                              {event.label}
                            </label>
                            <p className="text-xs text-muted-foreground">{event.route}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {editingWebhook && (
                    <>
                      <Separator />
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium">Testar WebHook</h4>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => testMutation.mutate(editingWebhook.id)}
                            disabled={testMutation.isPending}
                            data-testid="button-test-webhook"
                          >
                            <Play className="w-4 h-4 mr-2" />
                            {testMutation.isPending ? "Testando..." : "Enviar Teste"}
                          </Button>
                        </div>
                        {testResult && (
                          <Card>
                            <CardHeader className="pb-3">
                              <div className="flex items-center justify-between">
                                <CardTitle className="text-sm">Resultado do Teste</CardTitle>
                                <Badge variant={testResult.success ? "default" : "destructive"}>
                                  {testResult.success ? <Check className="w-3 h-3 mr-1" /> : <X className="w-3 h-3 mr-1" />}
                                  {testResult.status}
                                </Badge>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-2 text-xs">
                                <div>
                                  <span className="font-medium">Tempo de resposta:</span> {testResult.duration}ms
                                </div>
                                <div>
                                  <span className="font-medium">Status:</span> {testResult.statusText}
                                </div>
                                <Separator className="my-2" />
                                <div>
                                  <span className="font-medium">Resposta:</span>
                                  <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-x-auto">
                                    {JSON.stringify(testResult.response, null, 2)}
                                  </pre>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    </>
                  )}
                </form>
              </Form>
            </ScrollArea>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancelar
              </Button>
              <Button 
                type="submit" 
                onClick={handleSubmit}
                disabled={createMutation.isPending || updateMutation.isPending} 
                data-testid="button-save-webhook"
              >
                {editingWebhook ? "Atualizar" : "Criar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Carregando webhooks...</div>
      ) : webhooks.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Nenhum webhook configurado</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {webhooks.map((webhook) => (
            <Card key={webhook.id} data-testid={`card-webhook-${webhook.id}`} className="hover-elevate">
              <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0 pb-2">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg">{webhook.name}</CardTitle>
                  <CardDescription className="text-xs mt-1 truncate">
                    {webhook.targetUrl}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpenDialog(webhook)}
                    data-testid={`button-edit-${webhook.id}`}
                  >
                    Editar
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => deleteMutation.mutate(webhook.id)}
                    data-testid={`button-delete-${webhook.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="flex gap-2 flex-wrap">
                <Badge variant={webhook.isActive ? "default" : "secondary"}>
                  {webhook.isActive ? "Ativo" : "Inativo"}
                </Badge>
                <Badge variant="outline">{webhook.authType}</Badge>
                {webhook.events && webhook.events.length > 0 && (
                  <Badge variant="outline">{webhook.events.length} eventos</Badge>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
