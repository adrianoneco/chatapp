import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function correctText(text: string): Promise<string> {
  try {
    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: "Você é um assistente especializado em correção de texto em português. Corrija erros gramaticais, ortográficos e de pontuação, mantendo o tom e o significado original. Retorne apenas o texto corrigido, sem explicações.",
        },
        {
          role: "user",
          content: text,
        },
      ],
      temperature: 0.3,
    });

    return response.choices[0].message.content || text;
  } catch (error) {
    console.error("Erro ao corrigir texto com Groq:", error);
    throw new Error("Falha ao corrigir texto");
  }
}
