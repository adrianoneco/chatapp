import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Send, X, Image as ImageIcon, Paperclip } from "lucide-react";
import { Input } from "@/components/ui/input";

interface FileUploadDialogProps {
  open: boolean;
  onClose: () => void;
  onSend: (files: File[]) => void;
  mode: "image" | "attachment";
}

export function FileUploadDialog({ open, onClose, onSend, mode }: FileUploadDialogProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    setSelectedFiles(files);

    if (mode === "image") {
      const urls = files.map(file => URL.createObjectURL(file));
      setPreviewUrls(urls);
    }
  };

  const handleSend = () => {
    if (selectedFiles.length > 0) {
      onSend(selectedFiles);
      cleanup();
      onClose();
    }
  };

  const cleanup = () => {
    previewUrls.forEach(url => URL.revokeObjectURL(url));
    setSelectedFiles([]);
    setPreviewUrls([]);
  };

  const handleClose = () => {
    cleanup();
    onClose();
  };

  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    const newUrls = previewUrls.filter((_, i) => i !== index);
    
    if (previewUrls[index]) {
      URL.revokeObjectURL(previewUrls[index]);
    }
    
    setSelectedFiles(newFiles);
    setPreviewUrls(newUrls);
  };

  const acceptTypes = mode === "image" 
    ? "image/*" 
    : "*/*";

  const title = mode === "image" ? "Enviar Foto(s)" : "Enviar Anexo(s)";
  const icon = mode === "image" ? ImageIcon : Paperclip;
  const Icon = icon;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl" data-testid={`dialog-${mode}-upload`}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-4">
          <Input
            ref={fileInputRef}
            type="file"
            accept={acceptTypes}
            multiple
            onChange={handleFileSelect}
            className="cursor-pointer"
            data-testid={`input-${mode}-file`}
          />

          {selectedFiles.length > 0 && (
            <div className="space-y-4">
              {mode === "image" && previewUrls.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {previewUrls.map((url, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={url}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                        data-testid={`image-preview-${index}`}
                      />
                      <Button
                        size="icon"
                        variant="destructive"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6"
                        onClick={() => removeFile(index)}
                        data-testid={`button-remove-image-${index}`}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                      <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                        {selectedFiles[index].name}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {mode === "attachment" && (
                <div className="space-y-2">
                  {selectedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-muted rounded-lg"
                      data-testid={`attachment-item-${index}`}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Paperclip className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(file.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => removeFile(index)}
                        className="h-8 w-8 flex-shrink-0"
                        data-testid={`button-remove-attachment-${index}`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <div className="text-sm text-muted-foreground">
                {selectedFiles.length} arquivo(s) selecionado(s)
              </div>
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <Button
              onClick={handleClose}
              variant="outline"
              data-testid="button-cancel-upload"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSend}
              disabled={selectedFiles.length === 0}
              data-testid="button-send-files"
            >
              <Send className="h-4 w-4 mr-2" />
              Enviar {selectedFiles.length > 0 && `(${selectedFiles.length})`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
