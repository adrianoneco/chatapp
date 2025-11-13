import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Bot, Library, Loader2 } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { apiRequest } from "@/lib/queryClient";

interface AIMessageToolbarProps {
  messageText: string;
  onMessageUpdate: (text: string) => void;
  conversationId: string;
  clientName?: string;
  attendantName?: string;
}

export function AIMessageToolbar({
  messageText,
  onMessageUpdate,
  conversationId,
  clientName,
  attendantName,
}: AIMessageToolbarProps) {
  const { toast } = useToast();
  const [isCorrectingText, setIsCorrectingText] = useState(false);
  const [isGeneratingResponse, setIsGeneratingResponse] = useState(false);
  const [isSearchingTemplates, setIsSearchingTemplates] = useState(false);

  const handleCorrectText = async () => {
    const textToCorrect = messageText.trim() || "Olá, como posso te ajudar hoje?";
    
    setIsCorrectingText(true);
    try {
      const response = await apiRequest("POST", "/api/ai/correct-text", { 
        text: textToCorrect 
      });
      const data = await response.json();

      onMessageUpdate(data.correctedText);
      toast({
        title: "Texto corrigido",
        description: "O texto foi corrigido com IA",
      });
    } catch (error) {
      toast({
        title: "Erro ao corrigir texto",
        description: error instanceof Error ? error.message : "Falha ao corrigir texto",
        variant: "destructive",
      });
    } finally {
      setIsCorrectingText(false);
    }
  };

  const handleGenerateResponse = async () => {
    const userMessage = messageText.trim() || "Gere uma saudação profissional de atendimento ao cliente em português brasileiro";
    
    setIsGeneratingResponse(true);
    try {
      const response = await apiRequest("POST", "/api/ai/assistant", {
        userMessage,
        context: {
          conversationId,
          ...(clientName && { clientName }),
          ...(attendantName && { attendantName }),
        },
      });
      const data = await response.json();

      onMessageUpdate(data.response);
      toast({
        title: "Resposta gerada",
        description: "Assistente IA gerou uma resposta",
      });
    } catch (error) {
      toast({
        title: "Erro ao gerar resposta",
        description: error instanceof Error ? error.message : "Falha ao gerar resposta",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingResponse(false);
    }
  };

  const handleSearchTemplates = async () => {
    const templates = [
      "Olá! Como posso ajudá-lo hoje?",
      "Entendo sua situação. Vamos resolver isso juntos.",
      "Obrigado por entrar em contato. Estou aqui para ajudar.",
      "Sua solicitação foi registrada e será processada em breve.",
      "Por favor, forneça mais detalhes para que eu possa ajudá-lo melhor.",
    ];
    
    const queryText = messageText.trim() || "saudação inicial de atendimento profissional";

    setIsSearchingTemplates(true);
    try {
      const response = await apiRequest("POST", "/api/ai/search-templates", {
        query: queryText,
        templates,
      });
      const data = await response.json();

      onMessageUpdate(data.result);
      toast({
        title: "Template encontrado",
        description: "IA encontrou a melhor resposta pronta",
      });
    } catch (error) {
      toast({
        title: "Erro ao buscar template",
        description: error instanceof Error ? error.message : "Falha ao buscar template",
        variant: "destructive",
      });
    } finally {
      setIsSearchingTemplates(false);
    }
  };

  return (
    <div className="flex gap-1 px-4 py-2 border-b border-border bg-muted/20">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCorrectText}
            disabled={isCorrectingText}
            data-testid="button-ai-correct-text"
          >
            {isCorrectingText ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            <span className="ml-2 hidden sm:inline">Corrigir</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Corrigir texto com IA</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleGenerateResponse}
            disabled={isGeneratingResponse}
            data-testid="button-ai-generate-response"
          >
            {isGeneratingResponse ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Bot className="h-4 w-4" />
            )}
            <span className="ml-2 hidden sm:inline">Assistente</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Gerar resposta com assistente IA</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSearchTemplates}
            disabled={isSearchingTemplates}
            data-testid="button-ai-search-templates"
          >
            {isSearchingTemplates ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Library className="h-4 w-4" />
            )}
            <span className="ml-2 hidden sm:inline">Respostas</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Buscar resposta pronta com IA</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
