import Groq from "groq-sdk";

if (!process.env.GROQ_API_KEY) {
  console.warn("GROQ_API_KEY not found. AI features will not work.");
}

const getRandomApiKey = (): string | null => {
  if (!process.env.GROQ_API_KEY) return null;
  
  const apiKeys = process.env.GROQ_API_KEY.split(',').map(key => key.trim());
  if (apiKeys.length === 0) return null;
  
  const randomIndex = Math.floor(Math.random() * apiKeys.length);
  return apiKeys[randomIndex];
};

const getGroqClient = (): Groq | null => {
  const apiKey = getRandomApiKey();
  return apiKey ? new Groq({ apiKey }) : null;
};

export async function correctText(text: string): Promise<string> {
  const groq = getGroqClient();
  if (!groq) {
    throw new Error("Groq API key not configured");
  }

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "Você é um assistente especializado em corrigir textos em português. Corrija apenas erros gramaticais, ortográficos e de pontuação. Mantenha o tom e o significado original. Retorne APENAS o texto corrigido, sem explicações ou comentários adicionais."
        },
        {
          role: "user",
          content: text
        }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.3,
      max_tokens: 1000,
    });

    return completion.choices[0]?.message?.content?.trim() || text;
  } catch (error) {
    console.error("Groq API error:", error);
    throw new Error("Erro ao corrigir texto com IA");
  }
}

export async function generateQuickMessage(
  prompt: string,
  parameters: Record<string, string>
): Promise<string> {
  const groq = getGroqClient();
  if (!groq) {
    throw new Error("Groq API key not configured");
  }

  try {
    // Build context with parameter values
    const paramContext = Object.entries(parameters)
      .map(([key, value]) => `- ${key}: ${value}`)
      .join('\n');

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `Você é um assistente especializado em criar mensagens de atendimento ao cliente em português. 
          
Sua tarefa é criar uma mensagem clara, profissional e amigável baseada no contexto fornecido.

IMPORTANTE:
- Use os parâmetros fornecidos para personalizar a mensagem
- A mensagem deve ser natural e fluente
- Mantenha um tom profissional mas acolhedor
- Retorne APENAS a mensagem, sem explicações ou comentários adicionais
- Use os valores dos parâmetros diretamente, não use placeholders como {{nome}}`
        },
        {
          role: "user",
          content: `Crie uma mensagem de atendimento baseada nesta solicitação: "${prompt}"

Parâmetros disponíveis:
${paramContext}

Gere a mensagem usando estes valores diretamente.`
        }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_tokens: 500,
    });

    return completion.choices[0]?.message?.content?.trim() || "";
  } catch (error) {
    console.error("Groq API error:", error);
    throw new Error("Erro ao gerar mensagem com IA");
  }
}

export async function summarizeConversation(transcript: string): Promise<string> {
  const groq = getGroqClient();
  if (!groq) {
    throw new Error("Groq API key not configured");
  }

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "Você é um assistente especializado em resumir conversas de atendimento ao cliente. Crie um resumo conciso e estruturado da conversa, destacando: 1) Motivo do contato, 2) Principais pontos discutidos, 3) Resolução ou próximos passos. Use bullet points e seja objetivo."
        },
        {
          role: "user",
          content: `Resuma esta conversa de atendimento:\n\n${transcript}`
        }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.3,
      max_tokens: 1000,
    });

    return completion.choices[0]?.message?.content?.trim() || "Não foi possível gerar o resumo";
  } catch (error) {
    console.error("Groq API error:", error);
    throw new Error("Erro ao resumir conversa com IA");
  }
}
