import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Plus, Trash2, Key, Copy, Play, X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

interface Webhook {
  id: string;
  name: string;
  url: string;
  apiKey: string;
  events: string[];
  headers: Record<string, string>;
  active: boolean;
  createdAt: string;
}

const eventCategories = {
  conversations: {
    label: "Conversas",
    events: [
      { value: "conversation.created", label: "Conversa criada" },
      { value: "conversation.updated", label: "Conversa atualizada" },
      { value: "conversation.resolved", label: "Conversa resolvida" },
      { value: "conversation.deleted", label: "Conversa deletada" },
    ],
  },
  messages: {
    label: "Mensagens",
    events: [
      { value: "message.created", label: "Mensagem criada" },
      { value: "message.updated", label: "Mensagem atualizada" },
      { value: "message.deleted", label: "Mensagem deletada" },
    ],
  },
  contacts: {
    label: "Contatos",
    events: [
      { value: "contact.created", label: "Contato criado" },
      { value: "contact.updated", label: "Contato atualizado" },
      { value: "contact.deleted", label: "Contato deletado" },
    ],
  },
};

export default function WebhooksSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<Webhook | null>(null);
  const [webhookForm, setWebhookForm] = useState({
    name: "",
    url: "",
    events: [] as string[],
    headers: {} as Record<string, string>,
  });
  const [newHeader, setNewHeader] = useState({ key: "", value: "" });

  const { data: webhooks, isLoading } = useQuery<Webhook[]>({
    queryKey: ["/api/webhooks"],
  });

  const { data: apiKeys } = useQuery<{ key: string; jwtToken: string }>({
    queryKey: ["/api/webhooks/keys"],
  });

  const { mutate: createWebhook, isPending: isCreating } = useMutation({
    mutationFn: async (data: typeof webhookForm) => {
      const response = await fetch("/api/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Erro ao criar webhook");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/webhooks"] });
      setIsDialogOpen(false);
      resetForm();
      toast({
        title: "Webhook criado",
        description: "O webhook foi criado com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao criar webhook",
        description: "Não foi possível criar o webhook.",
        variant: "destructive",
      });
    },
  });

  const { mutate: deleteWebhook } = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/webhooks/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Erro ao deletar webhook");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/webhooks"] });
      toast({
        title: "Webhook deletado",
        description: "O webhook foi removido com sucesso.",
      });
    },
  });

  const { mutate: testWebhook, isPending: isTesting } = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/webhooks/${id}/test`, {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Erro ao testar webhook");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Webhook testado",
        description: "O webhook foi testado com sucesso. Verifique a resposta no servidor.",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao testar",
        description: "Não foi possível enviar o teste para o webhook.",
        variant: "destructive",
      });
    },
  });

  const { mutate: regenerateKeys } = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/webhooks/keys/regenerate", {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Erro ao regenerar chaves");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/webhooks/keys"] });
      toast({
        title: "Chaves regeneradas",
        description: "Novas chaves de API foram geradas.",
      });
    },
  });

  const resetForm = () => {
    setWebhookForm({
      name: "",
      url: "",
      events: [],
      headers: {},
    });
    setNewHeader({ key: "", value: "" });
    setEditingWebhook(null);
  };

  const handleAddHeader = () => {
    if (newHeader.key && newHeader.value) {
      setWebhookForm({
        ...webhookForm,
        headers: {
          ...webhookForm.headers,
          [newHeader.key]: newHeader.value,
        },
      });
      setNewHeader({ key: "", value: "" });
    }
  };

  const handleRemoveHeader = (key: string) => {
    const { [key]: _, ...rest } = webhookForm.headers;
    setWebhookForm({ ...webhookForm, headers: rest });
  };

  const handleEventToggle = (event: string) => {
    setWebhookForm({
      ...webhookForm,
      events: webhookForm.events.includes(event)
        ? webhookForm.events.filter((e) => e !== event)
        : [...webhookForm.events, event],
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado!",
      description: "O texto foi copiado para a área de transferência.",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Webhooks</h3>
        <p className="text-sm text-muted-foreground">
          Configure webhooks para receber eventos do sistema
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Chaves de API
          </CardTitle>
          <CardDescription>
            Use estas chaves para autenticar suas requisições à API
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>API Key</Label>
            <div className="flex gap-2">
              <Input
                value={apiKeys?.key || "Carregando..."}
                readOnly
                className="font-mono text-sm"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(apiKeys?.key || "")}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>JWT Token</Label>
            <div className="flex gap-2">
              <Input
                value={apiKeys?.jwtToken || "Carregando..."}
                readOnly
                className="font-mono text-sm"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(apiKeys?.jwtToken || "")}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Button variant="outline" onClick={() => regenerateKeys()}>
            <Key className="mr-2 h-4 w-4" />
            Regenerar Chaves
          </Button>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-medium">Webhooks Cadastrados</h4>
          <p className="text-sm text-muted-foreground">
            {webhooks?.length || 0} webhook(s) configurado(s)
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Webhook
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingWebhook ? "Editar Webhook" : "Novo Webhook"}
              </DialogTitle>
              <DialogDescription>
                Configure um webhook para receber eventos do sistema
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Webhook</Label>
                <Input
                  id="name"
                  placeholder="Meu Webhook"
                  value={webhookForm.name}
                  onChange={(e) =>
                    setWebhookForm({ ...webhookForm, name: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="url">URL</Label>
                <Input
                  id="url"
                  placeholder="https://exemplo.com/webhook"
                  value={webhookForm.url}
                  onChange={(e) =>
                    setWebhookForm({ ...webhookForm, url: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Headers Customizados</Label>
                <div className="space-y-2">
                  {Object.entries(webhookForm.headers).map(([key, value]) => (
                    <div key={key} className="flex gap-2 items-center">
                      <Input value={key} readOnly className="flex-1" />
                      <Input value={value} readOnly className="flex-1" />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveHeader(key)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}

                  <div className="flex gap-2">
                    <Input
                      placeholder="Chave"
                      value={newHeader.key}
                      onChange={(e) =>
                        setNewHeader({ ...newHeader, key: e.target.value })
                      }
                    />
                    <Input
                      placeholder="Valor"
                      value={newHeader.value}
                      onChange={(e) =>
                        setNewHeader({ ...newHeader, value: e.target.value })
                      }
                    />
                    <Button onClick={handleAddHeader}>Adicionar</Button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Eventos</Label>
                <Tabs defaultValue="conversations" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    {Object.entries(eventCategories).map(([key, category]) => (
                      <TabsTrigger key={key} value={key}>
                        {category.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {Object.entries(eventCategories).map(([key, category]) => (
                    <TabsContent key={key} value={key} className="space-y-2">
                      {category.events.map((event) => (
                        <div key={event.value} className="flex items-center space-x-2">
                          <Checkbox
                            id={event.value}
                            checked={webhookForm.events.includes(event.value)}
                            onCheckedChange={() => handleEventToggle(event.value)}
                          />
                          <Label
                            htmlFor={event.value}
                            className="text-sm font-normal cursor-pointer"
                          >
                            {event.label}
                          </Label>
                        </div>
                      ))}
                    </TabsContent>
                  ))}
                </Tabs>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={() => createWebhook(webhookForm)}
                disabled={isCreating || !webhookForm.name || !webhookForm.url}
              >
                {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>URL</TableHead>
              <TableHead>Eventos</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {webhooks && webhooks.length > 0 ? (
              webhooks.map((webhook) => (
                <TableRow key={webhook.id}>
                  <TableCell className="font-medium">{webhook.name}</TableCell>
                  <TableCell className="max-w-xs truncate">{webhook.url}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{webhook.events.length} eventos</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={webhook.active ? "default" : "secondary"}>
                      {webhook.active ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => testWebhook(webhook.id)}
                        disabled={isTesting}
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteWebhook(webhook.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Nenhum webhook cadastrado
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
