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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Plus, Trash2, MessageSquare } from "lucide-react";
import { insertEvolutionInstanceSchema, type EvolutionInstance } from "@shared/schema";
import { Badge } from "@/components/ui/badge";

const evolutionFormSchema = insertEvolutionInstanceSchema.extend({
  label: z.string().min(1, "Nome é obrigatório"),
  baseUrl: z.string().url("URL inválida"),
  apiKey: z.string().min(1, "API Key é obrigatória"),
  instanceId: z.string().min(1, "Instance ID é obrigatório"),
});

type EvolutionFormData = z.infer<typeof evolutionFormSchema>;

export function EvolutionAPITab() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const form = useForm<EvolutionFormData>({
    resolver: zodResolver(evolutionFormSchema),
    defaultValues: {
      label: "",
      baseUrl: "",
      apiKey: "",
      instanceId: "",
    },
  });

  const { data: instances = [], isLoading } = useQuery<EvolutionInstance[]>({
    queryKey: ["/api/evolution-instances"],
  });

  const createMutation = useMutation({
    mutationFn: async (instance: EvolutionFormData) => {
      const response = await apiRequest("POST", "/api/evolution-instances", instance);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/evolution-instances"] });
      toast({ title: "Instância criada", description: "Evolution API configurada com sucesso" });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar instância",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/evolution-instances/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/evolution-instances"] });
      toast({ title: "Instância excluída", description: "Instância removida com sucesso" });
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir instância",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = form.handleSubmit((data) => {
    createMutation.mutate(data);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Evolution API</h2>
          <p className="text-sm text-muted-foreground">
            Gerencie conexões com WhatsApp via Evolution API
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-new-evolution">
              <Plus className="w-4 h-4 mr-2" />
              Nova Instância
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Instância Evolution</DialogTitle>
              <DialogDescription>
                Configure uma conexão com WhatsApp
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={handleSubmit} className="space-y-4">
                <FormField
                  control={form.control}
                  name="label"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ex: WhatsApp Suporte" data-testid="input-evolution-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="baseUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL da API</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="https://..." data-testid="input-evolution-url" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="instanceId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Instance ID</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="my-instance" data-testid="input-evolution-instance" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="apiKey"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>API Key</FormLabel>
                      <FormControl>
                        <Input {...field} type="password" placeholder="..." data-testid="input-evolution-key" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending} data-testid="button-save-evolution">
                    Criar
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Carregando instâncias...</div>
      ) : instances.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Nenhuma instância configurada</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {instances.map((instance) => (
            <Card key={instance.id} data-testid={`card-evolution-${instance.id}`}>
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div className="flex-1">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    {instance.label}
                  </CardTitle>
                  <CardDescription className="text-xs mt-1">
                    {instance.baseUrl}
                  </CardDescription>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => deleteMutation.mutate(instance.id)}
                  data-testid={`button-delete-${instance.id}`}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <Badge variant={instance.status === "connected" ? "default" : "secondary"}>
                  {instance.status === "connected" ? "Conectado" : instance.status === "pending" ? "Pendente" : "Desconectado"}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
