import { Router } from "express";
import { z, ZodError } from "zod";
import { groqService } from "../services/groq";
import { requireAuth } from "../middleware/auth";

const router = Router();

const correctTextSchema = z.object({
  text: z.string().min(1),
  language: z.string().optional(),
});

const assistantResponseSchema = z.object({
  userMessage: z.string().min(1),
  context: z.object({
    conversationId: z.string().optional(),
    clientName: z.string().optional(),
    attendantName: z.string().optional(),
    conversationHistory: z.array(z.object({
      role: z.string(),
      content: z.string(),
    })).optional(),
  }).optional(),
  systemPrompt: z.string().optional(),
});

const searchTemplatesSchema = z.object({
  query: z.string().min(1),
  templates: z.array(z.string()),
});

router.post("/ai/correct-text", requireAuth, async (req, res) => {
  try {
    const data = correctTextSchema.parse(req.body);
    const correctedText = await groqService.correctText(data);
    
    res.json({ 
      success: true, 
      correctedText,
      originalText: data.text,
    });
  } catch (error) {
    console.error("Error correcting text:", error);
    
    if (error instanceof ZodError) {
      return res.status(400).json({ 
        success: false, 
        error: "Validation error",
        details: error.errors,
      });
    }
    
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to correct text" 
    });
  }
});

router.post("/ai/assistant", requireAuth, async (req, res) => {
  try {
    const data = assistantResponseSchema.parse(req.body);
    const response = await groqService.generateAssistantResponse(data);
    
    res.json({ 
      success: true, 
      response,
    });
  } catch (error) {
    console.error("Error generating assistant response:", error);
    
    if (error instanceof ZodError) {
      return res.status(400).json({ 
        success: false, 
        error: "Validation error",
        details: error.errors,
      });
    }
    
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to generate response" 
    });
  }
});

router.post("/ai/search-templates", requireAuth, async (req, res) => {
  try {
    const data = searchTemplatesSchema.parse(req.body);
    const result = await groqService.searchKnowledgeBase(data.query, data.templates);
    
    res.json({ 
      success: true, 
      result,
    });
  } catch (error) {
    console.error("Error searching templates:", error);
    
    if (error instanceof ZodError) {
      return res.status(400).json({ 
        success: false, 
        error: "Validation error",
        details: error.errors,
      });
    }
    
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to search templates" 
    });
  }
});

export default router;
