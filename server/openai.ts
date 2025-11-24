import OpenAI from "openai";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function correctText(text: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5",
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
    });

    return response.choices[0].message.content || text;
  } catch (error) {
    console.error("Erro ao corrigir texto com IA:", error);
    throw new Error("Falha ao corrigir texto");
  }
}

export async function transcribeAudio(audioBuffer: Buffer, mimeType: string): Promise<{ text: string }> {
  try {
    // Create a File-like object from the buffer
    const file = new File([audioBuffer], "audio.webm", { type: mimeType });
    
    const transcription = await openai.audio.transcriptions.create({
      file: file,
      model: "whisper-1",
      language: "pt",
    });

    return {
      text: transcription.text,
    };
  } catch (error) {
    console.error("Erro ao transcrever áudio:", error);
    throw new Error("Falha ao transcrever áudio");
  }
}
