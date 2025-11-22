import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const settingsSchema = z.object({
  companyName: z.string().min(1, "Nome da empresa é obrigatório"),
  companyEmail: z.string().email("Email inválido"),
  companyPhone: z.string().optional(),
  welcomeMessage: z.string().optional(),
  awayMessage: z.string().optional(),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

export default function GeneralSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery<SettingsFormData>({
    queryKey: ["/api/settings/general"],
  });

  const form = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    values: settings || {
      companyName: "",
      companyEmail: "",
      companyPhone: "",
      welcomeMessage: "",
      awayMessage: "",
    },
  });

  const { mutate: saveSettings, isPending } = useMutation({
    mutationFn: async (data: SettingsFormData) => {
      const response = await fetch("/api/settings/general", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Erro ao salvar configurações");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/general"] });
      toast({
        title: "Configurações salvas",
        description: "As configurações foram atualizadas com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as configurações.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SettingsFormData) => {
    saveSettings(data);
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
        <h3 className="text-lg font-medium">Configurações Gerais</h3>
        <p className="text-sm text-muted-foreground">
          Configure as informações básicas da sua empresa
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="companyName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome da Empresa</FormLabel>
                <FormControl>
                  <Input placeholder="Minha Empresa" {...field} />
                </FormControl>
                <FormDescription>
                  Nome que será exibido para os clientes
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="companyEmail"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email da Empresa</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="contato@empresa.com" {...field} />
                </FormControl>
                <FormDescription>
                  Email principal para contato
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="companyPhone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefone</FormLabel>
                <FormControl>
                  <Input placeholder="(00) 0000-0000" {...field} />
                </FormControl>
                <FormDescription>
                  Telefone para contato (opcional)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="welcomeMessage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mensagem de Boas-vindas</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Olá! Seja bem-vindo ao nosso atendimento."
                    className="resize-none"
                    rows={3}
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Mensagem automática enviada quando um novo cliente inicia uma conversa
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="awayMessage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mensagem de Ausência</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="No momento estamos ausentes. Retornaremos em breve."
                    className="resize-none"
                    rows={3}
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Mensagem enviada quando não há atendentes disponíveis
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar Configurações
          </Button>
        </form>
      </Form>
    </div>
  );
}
