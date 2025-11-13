import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery } from "@tanstack/react-query";
import type { ResponseTemplate } from "@shared/schema";
import { Send, Sparkles, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface AIAssistantDialogProps {
  open: boolean;
  onClose: () => void;
  onSelectTemplate: (content: string) => void;
  conversationContext?: {
    clientName?: string;
    attendantName?: string;
  };
}

export function AIAssistantDialog({ 
  open, 
  onClose, 
  onSelectTemplate,
  conversationContext 
}: AIAssistantDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<ResponseTemplate | null>(null);

  const { data: templates = [] } = useQuery<ResponseTemplate[]>({
    queryKey: ["/api/templates"],
    enabled: open,
  });

  const filteredTemplates = templates.filter(template => 
    template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (template.category && template.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleSelectTemplate = (template: ResponseTemplate) => {
    setSelectedTemplate(template);
  };

  const handleUseTemplate = () => {
    if (!selectedTemplate) return;

    let processedContent = selectedTemplate.content;

    if (conversationContext) {
      processedContent = processedContent
        .replace(/\{\{clientName\}\}/g, conversationContext.clientName || "")
        .replace(/\{\{attendantName\}\}/g, conversationContext.attendantName || "");
    }

    onSelectTemplate(processedContent);
    onClose();
  };

  const categoryColors: Record<string, string> = {
    "saudacao": "bg-blue-500/10 text-blue-500",
    "despedida": "bg-green-500/10 text-green-500",
    "suporte": "bg-purple-500/10 text-purple-500",
    "vendas": "bg-orange-500/10 text-orange-500",
    "atendimento": "bg-pink-500/10 text-pink-500",
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl h-[600px] flex flex-col" data-testid="dialog-ai-assistant">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Assistente de IA
          </DialogTitle>
        </DialogHeader>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search-templates"
          />
        </div>

        <div className="flex-1 grid grid-cols-2 gap-4 overflow-hidden">
          <ScrollArea className="h-full pr-4">
            <div className="space-y-2">
              {filteredTemplates.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  Nenhum template encontrado
                </div>
              ) : (
                filteredTemplates.map((template) => (
                  <div
                    key={template.id}
                    onClick={() => handleSelectTemplate(template)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all hover-elevate ${
                      selectedTemplate?.id === template.id
                        ? "bg-primary/10 border-primary"
                        : "bg-card border-border"
                    }`}
                    data-testid={`template-item-${template.id}`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-medium text-sm">{template.title}</h3>
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          template.category ? (categoryColors[template.category] || "bg-muted text-muted-foreground") : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {template.category || "geral"}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {template.content}
                    </p>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>

          <div className="border rounded-lg p-4 bg-muted/30">
            {selectedTemplate ? (
              <div className="h-full flex flex-col">
                <div className="mb-4">
                  <h3 className="font-semibold mb-1">{selectedTemplate.title}</h3>
                  <span
                    className={`inline-block text-xs px-2 py-1 rounded ${
                      selectedTemplate.category ? (categoryColors[selectedTemplate.category] || "bg-muted text-muted-foreground") : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {selectedTemplate.category || "geral"}
                  </span>
                </div>
                <ScrollArea className="flex-1 mb-4">
                  <div className="text-sm whitespace-pre-wrap bg-background p-3 rounded border">
                    {selectedTemplate.content}
                  </div>
                </ScrollArea>
                <Button
                  onClick={handleUseTemplate}
                  className="w-full"
                  data-testid="button-use-template"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Usar Template
                </Button>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                Selecione um template para visualizar
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
