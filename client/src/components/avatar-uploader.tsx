import React, { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface Props {
  initialImage?: string;
  onChange: (mediaUrl: string) => void;
}

export default function AvatarUploader({ initialImage, onChange }: Props) {
  const [showDialog, setShowDialog] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | undefined>(initialImage);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;
    const url = URL.createObjectURL(file);
    setSelectedFile(file);
    setImageSrc(url);
    setShowDialog(true);
  };

  const uploadFile = async () => {
    if (!selectedFile) return alert("Nenhum arquivo selecionado");
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", selectedFile, selectedFile.name);

      const res = await fetch(`/api/uploads`, {
        method: "POST",
        body: form,
        credentials: "include",
      });
      if (!res.ok) throw new Error(`Upload failed ${res.status}`);
      const data = await res.json();
      onChange(data.mediaUrl);
      setShowDialog(false);
    } catch (err) {
      console.error("Avatar upload error:", err);
      alert("Erro ao enviar imagem");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full overflow-hidden bg-muted">
          {initialImage ? <img src={initialImage} className="w-full h-full object-cover" alt="avatar" /> : null}
        </div>
        <input ref={inputRef} type="file" accept="image/*" onChange={onFileChange} />
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Enviar imagem</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div style={{ position: "relative", width: "100%", height: 400, background: "#333" }} className="flex items-center justify-center">
              {imageSrc ? (
                <img src={imageSrc} alt="preview" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
              ) : (
                <div className="text-muted">Nenhuma imagem selecionada</div>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-white border">
                {imageSrc && (
                  <img
                    src={imageSrc}
                    alt="preview"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                )}
              </div>

              <div className="flex gap-2 ml-auto">
                <Button variant="outline" onClick={() => setShowDialog(false)}>Cancelar</Button>
                <Button onClick={uploadFile} disabled={uploading}>{uploading ? "Enviando..." : "Confirmar & Enviar"}</Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
