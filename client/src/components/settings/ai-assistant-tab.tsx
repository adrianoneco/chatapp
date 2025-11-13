import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, Edit, Search, Sparkles, Copy, Check } from "lucide-react";
import { insertResponseTemplateSchema, type ResponseTemplate } from "@shared/schema";
import { TEMPLATE_VARIABLES, getVariablesByCategory } from "@shared/template-variables";

const templateFormSchema = insertResponseTemplateSchema.extend({
  title: z.string().min(1, "Título é obrigatório"),
  content: z.string().min(1, "Conteúdo é obrigatório"),
  category: z.string().min(1, "Categoria é obrigatória"),
});

type TemplateFormData = z.infer<typeof templateFormSchema>;

export function AIAssistantTab() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<ResponseTemplate | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [lastPrompt, setLastPrompt] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const form = useForm<TemplateFormData>({
    resolver: zodResolver(templateFormSchema),
    defaultValues: {
      title: "",
      content: "",
      category: "geral",
    },
  });

  const { data: templates = [], isLoading } = useQuery<ResponseTemplate[]>({
    queryKey: ["/api/templates"],
  });

  const createMutation = useMutation({
    mutationFn: async (template: TemplateFormData) => {
      const response = await apiRequest("POST", "/api/templates", template);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
      toast({ title: "Template criado", description: "Template salvo com sucesso" });
      setIsDialogOpen(false);
      form.reset();
      setEditingTemplate(null);
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar template",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: TemplateFormData }) => {
      const response = await apiRequest("PATCH", `/api/templates/${id}`, updates);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
      toast({ title: "Template atualizado", description: "Alterações salvas com sucesso" });
      setIsDialogOpen(false);
      form.reset();
      setEditingTemplate(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar template",
        description: error.message || "Erro desconhecido",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/templates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
      toast({ title: "Template excluído", description: "Template removido com sucesso" });
      setDeleteDialogOpen(false);
      setTemplateToDelete(null);
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir template",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = form.handleSubmit((data) => {
    if (editingTemplate) {
      updateMutation.mutate({ id: editingTemplate.id, updates: data });
    } else {
      createMutation.mutate(data);
    }
  });

  const handleEdit = (template: ResponseTemplate) => {
    setEditingTemplate(template);
    form.reset({
      title: template.title,
      content: template.content,
      category: template.category ?? "geral",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setTemplateToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (templateToDelete) {
      deleteMutation.mutate(templateToDelete);
    }
  };

  const suggestMutation = useMutation({
    mutationFn: async (data: { title: string; category: string; description?: string }) => {
      const response = await apiRequest("POST", "/api/ai/suggest-template", data);
      return await response.json();
    },
    onSuccess: (data) => {
      form.setValue("content", data.suggestedContent);
      setLastPrompt(data.promptUsed);
      toast({ 
        title: "Sugestão gerada", 
        description: "Template sugerido pela IA inserido no campo" 
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao gerar sugestão",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    },
  });

  const handleSuggestTemplate = () => {
    const title = form.getValues("title");
    const category = form.getValues("category");
    const content = form.getValues("content");
    
    if (!title || !category) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha o título e categoria antes de pedir uma sugestão",
        variant: "destructive",
      });
      return;
    }

    suggestMutation.mutate({ 
      title, 
      category, 
      description: content || undefined 
    });
  };

  const insertVariable = (variableKey: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart || 0;
    const end = textarea.selectionEnd || 0;
    const currentValue = form.getValues("content") || "";
    
    const newValue = currentValue.substring(0, start) + variableKey + currentValue.substring(end);
    
    form.setValue("content", newValue);
    
    setTimeout(() => {
      textarea.focus();
      const newPosition = start + variableKey.length;
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
  };

  const copyPrompt = () => {
    if (lastPrompt) {
      navigator.clipboard.writeText(lastPrompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: "Copiado!", description: "Prompt copiado para a área de transferência" });
    }
  };

  const filteredTemplates = templates.filter((template) =>
    template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Assistente IA</h2>
          <p className="text-sm text-muted-foreground">
            Gerencie respostas prontas com suporte a variáveis
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            form.reset();
            setEditingTemplate(null);
          }
        }}>
          <DialogTrigger asChild>
            <Button data-testid="button-new-template">
              <Plus className="w-4 h-4 mr-2" />
              Novo Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-5xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>
                {editingTemplate ? "Editar Template" : "Novo Template"}
              </DialogTitle>
              <DialogDescription>
                Clique nas variáveis da barra lateral para inserir no texto
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid lg:grid-cols-[1fr_18rem] gap-4">
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Título</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              data-testid="input-template-title"
                              placeholder="Ex: Saudação inicial"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Categoria</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              data-testid="input-template-category"
                              placeholder="Ex: saudações, suporte, vendas"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="content"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Conteúdo</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              ref={textareaRef}
                              data-testid="textarea-template-content"
                              placeholder="Olá {{clientName}}! Sou {{attendantName}}, como posso ajudar?"
                              className="min-h-32"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {lastPrompt && (
                      <Card className="p-3">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-medium text-muted-foreground">Prompt enviado:</p>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={copyPrompt}
                            data-testid="button-copy-prompt"
                          >
                            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground whitespace-pre-wrap">{lastPrompt}</p>
                      </Card>
                    )}
                  </div>

                  <div className="hidden lg:block">
                    <Card className="p-3">
                      <h3 className="text-sm font-semibold mb-2">Variáveis Disponíveis</h3>
                      <p className="text-xs text-muted-foreground mb-3">
                        Clique para inserir no texto
                      </p>
                      <ScrollArea className="h-[400px]">
                        <div className="space-y-3">
                          {["conversa", "atendente", "cliente"].map((category) => (
                            <div key={category}>
                              <h4 className="text-xs font-medium mb-2 capitalize text-primary">
                                {category}
                              </h4>
                              <div className="space-y-1">
                                {getVariablesByCategory(category as any).map((variable) => (
                                  <Button
                                    key={variable.key}
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    className="w-full justify-start text-xs hover-elevate active-elevate-2 h-auto py-1.5"
                                    onClick={() => insertVariable(variable.key)}
                                    data-testid={`button-insert-${variable.key}`}
                                  >
                                    <div className="text-left w-full">
                                      <div className="font-mono text-xs">{variable.key}</div>
                                      <div className="text-muted-foreground text-xs">
                                        {variable.label}
                                      </div>
                                    </div>
                                  </Button>
                                ))}
                              </div>
                              {category !== "cliente" && <Separator className="mt-2" />}
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </Card>
                  </div>
                </div>
                
                <DialogFooter className="gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false);
                      form.reset();
                      setEditingTemplate(null);
                      setLastPrompt("");
                    }}
                    data-testid="button-cancel-template"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleSuggestTemplate}
                    disabled={suggestMutation.isPending}
                    data-testid="button-suggest-template"
                  >
                    {suggestMutation.isPending ? (
                      <>Gerando...</>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Sugestão IA
                      </>
                    )}
                  </Button>
                  <Button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    data-testid="button-save-template"
                  >
                    {editingTemplate ? "Atualizar" : "Criar"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar templates..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
          data-testid="input-search-templates"
        />
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Carregando templates...</div>
      ) : filteredTemplates.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              {searchQuery ? "Nenhum template encontrado" : "Nenhum template criado ainda"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredTemplates.map((template) => (
            <Card key={template.id} data-testid={`card-template-${template.id}`}>
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div className="flex-1">
                  <CardTitle className="text-lg">{template.title}</CardTitle>
                  <CardDescription className="text-xs mt-1">
                    Categoria: {template.category || "geral"}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleEdit(template)}
                    data-testid={`button-edit-${template.id}`}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDelete(template.id)}
                    data-testid={`button-delete-${template.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {template.content}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este template? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              data-testid="button-confirm-delete"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
