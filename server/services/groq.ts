const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_API_KEY = process.env.GROQ_API_KEY;

if (!GROQ_API_KEY) {
  throw new Error("GROQ_API_KEY environment variable is required but not set. Please configure it in your environment.");
}

interface GroqMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface GroqChatCompletionRequest {
  model: string;
  messages: GroqMessage[];
  temperature?: number;
  max_tokens?: number;
}

interface GroqChatCompletionResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export interface GroqTextCorrectionParams {
  text: string;
  language?: string;
}

export interface GroqAssistantParams {
  userMessage: string;
  context?: {
    conversationId?: string;
    clientName?: string;
    attendantName?: string;
    conversationHistory?: Array<{ role: string; content: string }>;
  };
  systemPrompt?: string;
}

async function callGroqAPI(request: GroqChatCompletionRequest): Promise<GroqChatCompletionResponse> {
  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`Groq API error: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

export class GroqService {
  async correctText(params: GroqTextCorrectionParams): Promise<string> {
    const { text, language = "pt-BR" } = params;

    const systemPrompt = `Você é um assistente de correção de texto profissional.
Corrija o texto fornecido mantendo o tom e intenção original.
Corrija apenas:
- Erros ortográficos
- Erros gramaticais
- Pontuação inadequada
- Concordância verbal/nominal

NÃO altere:
- Estilo de escrita
- Palavras informais ou gírias intencionais
- Emojis

Retorne APENAS o texto corrigido, sem explicações.`;

    const response = await callGroqAPI({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: text },
      ],
      temperature: 0.3,
      max_tokens: 1000,
    });

    return response.choices[0]?.message?.content?.trim() || text;
  }

  async generateAssistantResponse(params: GroqAssistantParams): Promise<string> {
    const { userMessage, context, systemPrompt } = params;

    const defaultSystemPrompt = `Você é um assistente inteligente de atendimento ao cliente brasileiro.

Contexto da conversa:
${context?.clientName ? `- Cliente: ${context.clientName}` : ""}
${context?.attendantName ? `- Atendente: ${context.attendantName}` : ""}
${context?.conversationId ? `- ID da Conversa: ${context.conversationId}` : ""}

Instruções:
- Seja profissional, cordial e prestativo
- Responda em português brasileiro
- Seja conciso mas completo
- Use linguagem clara e acessível
- Adapte o tom ao contexto do atendimento`;

    const messages: GroqMessage[] = [
      { role: "system", content: systemPrompt || defaultSystemPrompt },
    ];

    if (context?.conversationHistory && context.conversationHistory.length > 0) {
      context.conversationHistory.forEach((msg) => {
        if (msg.role === "user" || msg.role === "assistant") {
          messages.push({
            role: msg.role as "user" | "assistant",
            content: msg.content,
          });
        }
      });
    }

    messages.push({ role: "user", content: userMessage });

    const response = await callGroqAPI({
      model: "llama-3.3-70b-versatile",
      messages,
      temperature: 0.7,
      max_tokens: 2000,
    });

    return response.choices[0]?.message?.content?.trim() || "Desculpe, não consegui gerar uma resposta.";
  }

  async searchKnowledgeBase(query: string, templates: string[]): Promise<string> {
    const systemPrompt = `Você é um assistente que ajuda a encontrar a melhor resposta pré-configurada.

Templates disponíveis:
${templates.map((t, i) => `${i + 1}. ${t}`).join("\n")}

Analise a pergunta do usuário e retorne a resposta mais adequada dos templates acima.
Se nenhum template for adequado, retorne uma resposta genérica profissional.`;

    const response = await callGroqAPI({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: query },
      ],
      temperature: 0.5,
      max_tokens: 1000,
    });

    return response.choices[0]?.message?.content?.trim() || "";
  }
}

export const groqService = new GroqService();
