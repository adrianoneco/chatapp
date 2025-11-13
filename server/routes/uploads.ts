import { Router, type Request, type Response } from "express";
import { requireAuth } from "../middleware/auth";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { nanoid } from "nanoid";

const router = Router();

const ALLOWED_TYPES = {
  audio: ["audio/webm", "audio/mp4", "audio/mpeg", "audio/wav"],
  video: ["video/webm", "video/mp4", "video/quicktime"],
  image: ["image/jpeg", "image/png", "image/gif", "image/webp"],
  file: ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain"],
};

const MAX_SIZES = {
  audio: 10 * 1024 * 1024, // 10MB
  video: 50 * 1024 * 1024, // 50MB
  image: 5 * 1024 * 1024,  // 5MB
  file: 10 * 1024 * 1024,   // 10MB
};

type MediaType = keyof typeof ALLOWED_TYPES;

router.post("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const contentType = req.headers["content-type"] || "";
    const mediaType = (req.query.type as MediaType) || "file";
    const fileName = (req.query.name as string) || "upload";
    
    if (!ALLOWED_TYPES[mediaType]) {
      return res.status(400).json({ error: "Tipo de mídia inválido" });
    }

    if (!ALLOWED_TYPES[mediaType].includes(contentType)) {
      return res.status(400).json({ error: `Tipo de arquivo não permitido: ${contentType}` });
    }

    const chunks: Buffer[] = [];
    let totalSize = 0;

    req.on("data", (chunk: Buffer) => {
      totalSize += chunk.length;
      if (totalSize > MAX_SIZES[mediaType]) {
        req.pause();
        res.status(413).json({ error: "Arquivo muito grande" });
        return;
      }
      chunks.push(chunk);
    });

    req.on("end", async () => {
      try {
        const buffer = Buffer.concat(chunks);
        
        const extension = contentType.split("/")[1] || "bin";
        const uniqueId = nanoid(10);
        const safeFileName = `${uniqueId}.${extension}`;
        
        const uploadDir = path.join(process.cwd(), "uploads", mediaType);
        if (!existsSync(uploadDir)) {
          await mkdir(uploadDir, { recursive: true });
        }

        const filePath = path.join(uploadDir, safeFileName);
        await writeFile(filePath, buffer);

        const mediaUrl = `/uploads/${mediaType}/${safeFileName}`;

        res.json({
          mediaUrl,
          mediaType,
          size: buffer.length,
          contentType,
        });
      } catch (error) {
        console.error("Error saving file:", error);
        res.status(500).json({ error: "Erro ao salvar arquivo" });
      }
    });

    req.on("error", (error) => {
      console.error("Upload error:", error);
      res.status(500).json({ error: "Erro no upload" });
    });
  } catch (error) {
    console.error("Upload route error:", error);
    res.status(500).json({ error: "Erro no servidor" });
  }
});

export default router;
