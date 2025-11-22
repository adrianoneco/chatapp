import { useState, useRef } from "react";
import { X, FileIcon, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import { cn } from "@/lib/utils";

interface AttachmentUploadProps {
  onUploadComplete: (fileInfo: {
    url: string;
    filename: string;
    size: number;
    mimetype: string;
  }) => void;
  onCancel?: () => void;
  className?: string;
}

export function AttachmentUpload({ onUploadComplete, onCancel, className }: AttachmentUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1024 * 1024 * 1024) {
      setError("Arquivo muito grande. Tamanho máximo: 1GB");
      return;
    }

    setSelectedFile(file);
    setError(null);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          const percentComplete = (e.loaded / e.total) * 100;
          setUploadProgress(Math.round(percentComplete));
        }
      });

      xhr.addEventListener("load", () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          onUploadComplete(response);
          setSelectedFile(null);
          setUploadProgress(0);
        } else {
          const errorData = JSON.parse(xhr.responseText);
          setError(errorData.message || "Erro ao fazer upload");
        }
        setIsUploading(false);
      });

      xhr.addEventListener("error", () => {
        setError("Erro de conexão ao fazer upload");
        setIsUploading(false);
      });

      xhr.open("POST", "/api/upload/attachment?type=attachments");
      xhr.send(formData);
    } catch (err: any) {
      setError(err.message || "Erro ao fazer upload");
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setUploadProgress(0);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onCancel?.();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  return (
    <div className={cn("space-y-4", className)}>
      {!selectedFile ? (
        <div className="border-2 border-dashed rounded-lg p-8 text-center">
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            className="hidden"
            id="file-upload"
          />
          <label htmlFor="file-upload" className="cursor-pointer">
            <FileIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">
              Clique para selecionar um arquivo
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Tamanho máximo: 1GB
            </p>
          </label>
        </div>
      ) : (
        <div className="border rounded-lg p-4 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{selectedFile.name}</div>
              <div className="text-sm text-muted-foreground">
                {formatFileSize(selectedFile.size)}
              </div>
            </div>
            {!isUploading && (
              <Button
                size="icon"
                variant="ghost"
                onClick={handleCancel}
                className="flex-shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {isUploading && (
            <div className="space-y-2">
              <Progress value={uploadProgress} />
              <div className="text-xs text-muted-foreground text-center">
                {uploadProgress}% enviado
              </div>
            </div>
          )}

          {error && (
            <div className="text-sm text-destructive">{error}</div>
          )}

          {!isUploading && (
            <div className="flex gap-2">
              <Button onClick={handleUpload} className="flex-1">
                Enviar Anexo
              </Button>
              <Button onClick={handleCancel} variant="outline">
                Cancelar
              </Button>
            </div>
          )}

          {isUploading && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Enviando...
            </div>
          )}
        </div>
      )}
    </div>
  );
}
