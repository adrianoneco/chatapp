import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth-context";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Sparkles, X } from "lucide-react";
import * as Icons from "lucide-react";

const quickMessageSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  content: z.string().min(1, "Conteúdo é obrigatório"),
  icon: z.string().min(1, "Ícone é obrigatório"),
});

type QuickMessageForm = z.infer<typeof quickMessageSchema>;

interface QuickMessageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quickMessage?: any;
}

const availableIcons = [
  { name: "MessageCircle", icon: Icons.MessageCircle },
  { name: "Mail", icon: Icons.Mail },
  { name: "Phone", icon: Icons.Phone },
  { name: "Clock", icon: Icons.Clock },
  { name: "CheckCircle", icon: Icons.CheckCircle },
  { name: "AlertCircle", icon: Icons.AlertCircle },
  { name: "Info", icon: Icons.Info },
  { name: "HelpCircle", icon: Icons.HelpCircle },
  { name: "ThumbsUp", icon: Icons.ThumbsUp },
  { name: "Star", icon: Icons.Star },
];

const availableParameters = [
  { key: "clientName", label: "Nome do Cliente", example: "João Silva" },
  { key: "clientEmail", label: "Email do Cliente", example: "joao@exemplo.com" },
  { key: "attendantName", label: "Nome do Atendente", example: "Maria Santos" },
  { key: "protocolId", label: "Protocolo", example: "A1B2C3D4E5" },
  { key: "currentDate", label: "Data Atual", example: new Date().toLocaleDateString("pt-BR") },
  { key: "currentTime", label: "Hora Atual", example: new Date().toLocaleTimeString("pt-BR") },
  { key: "companyName", label: "Nome da Empresa", example: "Minha Empresa" },
];

export function QuickMessageModal({ open, onOpenChange, quickMessage }: QuickMessageModalProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedParameters, setSelectedParameters] = useState<string[]>([]);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const prevOpenRef = useRef(false);
  const prevQuickMessageIdRef = useRef<string | null>(null);

  const form = useForm<QuickMessageForm>({
    resolver: zodResolver(quickMessageSchema),
    defaultValues: {
      title: "",
      content: "",
      icon: "MessageCircle",
    },
  });

  // Sync form values and selectedParameters when modal opens or quickMessage changes
  useEffect(() => {
    const currentId = quickMessage?.id || null;
    const justOpened = open && !prevOpenRef.current;
    const idChanged = currentId !== prevQuickMessageIdRef.current;
    
    // Sync only when modal just opened OR when quickMessage ID changed
    if (justOpened || (open && idChanged)) {
      if (quickMessage) {
        form.reset({
          title: quickMessage.title,
          content: quickMessage.content,
          icon: quickMessage.icon,
        });
        setSelectedParameters(quickMessage.parameters || []);
      } else {
        form.reset({
          title: "",
          content: "",
          icon: "MessageCircle",
        });
        setSelectedParameters([]);
      }
    }
    
    prevOpenRef.current = open;
    prevQuickMessageIdRef.current = currentId;
  }, [open, quickMessage?.id]);

  const createMutation = useMutation({
    mutationFn: async (data: QuickMessageForm & { parameters: string[] }) => {
      if (quickMessage) {
        return await apiRequest("PATCH", `/api/quick-messages/${quickMessage.id}`, data);
      }
      return await apiRequest("POST", "/api/quick-messages", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quick-messages"] });
      toast({
        title: quickMessage ? "Mensagem atualizada!" : "Mensagem criada!",
        description: quickMessage 
          ? "A mensagem pronta foi atualizada com sucesso"
          : "A mensagem pronta foi criada com sucesso",
      });
      onOpenChange(false);
      form.reset();
      setSelectedParameters([]);
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar mensagem pronta",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: QuickMessageForm) => {
    createMutation.mutate({
      ...data,
      parameters: selectedParameters,
    });
  };

  const toggleParameter = (paramKey: string) => {
    if (selectedParameters.includes(paramKey)) {
      setSelectedParameters(selectedParameters.filter(p => p !== paramKey));
    } else {
      setSelectedParameters([...selectedParameters, paramKey]);
    }
  };

  const insertParameter = (paramKey: string) => {
    const currentContent = form.getValues("content");
    const newContent = currentContent + ` {{${paramKey}}}`;
    form.setValue("content", newContent);
    
    if (!selectedParameters.includes(paramKey)) {
      setSelectedParameters([...selectedParameters, paramKey]);
    }
  };

  const generateWithAI = async () => {
    if (!aiPrompt) {
      toast({
        title: "Erro",
        description: "Digite uma descrição para gerar a mensagem",
        variant: "destructive",
      });
      return;
    }

    setGeneratingAI(true);

    try {
      // Build parameter values for context
      const parameterValues: Record<string, string> = {};
      selectedParameters.forEach(key => {
        const param = availableParameters.find(p => p.key === key);
        if (param) {
          parameterValues[key] = param.example;
        }
      });

      const res = await apiRequest("POST", "/api/ai/generate-message", {
        prompt: aiPrompt,
        parameters: parameterValues,
      });
      const response = await res.json();

      form.setValue("content", response.generatedMessage);
      
      toast({
        title: "Mensagem gerada!",
        description: "A mensagem foi gerada com sucesso pela IA",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao gerar mensagem com IA",
        variant: "destructive",
      });
    } finally {
      setGeneratingAI(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {quickMessage ? "Editar" : "Nova"} Mensagem Pronta
          </DialogTitle>
          <DialogDescription>
            Crie mensagens personalizadas com parâmetros dinâmicos
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex gap-6">
          <div className="flex-1 overflow-auto">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: Saudação inicial"
                          {...field}
                          data-testid="input-quick-message-title"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="icon"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ícone</FormLabel>
                      <div className="grid grid-cols-5 gap-2">
                        {availableIcons.map((iconItem) => {
                          const IconComponent = iconItem.icon;
                          return (
                            <Button
                              key={iconItem.name}
                              type="button"
                              variant={field.value === iconItem.name ? "default" : "outline"}
                              className="h-12 w-full"
                              onClick={() => field.onChange(iconItem.name)}
                              data-testid={`button-icon-${iconItem.name}`}
                            >
                              <IconComponent className="h-5 w-5" />
                            </Button>
                          );
                        })}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Conteúdo da Mensagem</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Digite a mensagem. Use {{parametro}} para inserir valores dinâmicos"
                          className="min-h-32"
                          {...field}
                          data-testid="textarea-quick-message-content"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-2">
                  <FormLabel>Gerar com IA</FormLabel>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Descreva a mensagem que deseja gerar..."
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      data-testid="input-ai-prompt"
                    />
                    <Button
                      type="button"
                      onClick={generateWithAI}
                      disabled={generatingAI}
                      data-testid="button-generate-ai"
                    >
                      {generatingAI ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    data-testid="button-cancel"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={createMutation.isPending}
                    data-testid="button-save-quick-message"
                  >
                    {createMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      "Salvar"
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </div>

          <div className="w-64 border-l pl-6">
            <h3 className="text-sm font-semibold mb-3">Parâmetros Disponíveis</h3>
            <ScrollArea className="h-[calc(100%-2rem)]">
              <div className="space-y-2">
                {availableParameters.map((param) => (
                  <div
                    key={param.key}
                    className="p-2 rounded-md hover:bg-accent cursor-pointer transition-colors"
                    onClick={() => insertParameter(param.key)}
                    data-testid={`param-${param.key}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium">{param.label}</span>
                      {selectedParameters.includes(param.key) && (
                        <Badge variant="secondary" className="text-xs">
                          Em uso
                        </Badge>
                      )}
                    </div>
                    <code className="text-xs text-muted-foreground block">
                      {`{{${param.key}}}`}
                    </code>
                    <p className="text-xs text-muted-foreground mt-1">
                      Ex: {param.example}
                    </p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
