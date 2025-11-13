import React, { useState, useCallback, useRef } from "react";
import Cropper from "react-easy-crop";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface Props {
  initialImage?: string;
  onChange: (mediaUrl: string) => void;
}

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.addEventListener("load", () => resolve(img));
    img.addEventListener("error", (e) => reject(e));
    img.setAttribute("crossOrigin", "anonymous");
    img.src = url;
  });
}

function getCroppedImg(imageSrc: string, pixelCrop: any): Promise<Blob> {
  return new Promise(async (resolve, reject) => {
    try {
      const image = await createImage(imageSrc);
      const canvas = document.createElement("canvas");
      const size = Math.max(pixelCrop.width, pixelCrop.height);
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d")!;

      // draw white bg (in case png transparency)
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        canvas.width,
        canvas.height
      );

      canvas.toBlob((blob) => {
        if (!blob) return reject(new Error("Canvas is empty"));
        resolve(blob);
      }, "image/png");
    } catch (e) {
      reject(e);
    }
  });
}

export default function AvatarUploader({ initialImage, onChange }: Props) {
  const [showCrop, setShowCrop] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | undefined>(initialImage);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setImageSrc(url);
    setShowCrop(true);
  };

  const onCropComplete = useCallback((_: any, croppedAreaPixelsLocal: any) => {
    setCroppedAreaPixels(croppedAreaPixelsLocal);
  }, []);

  const uploadCropped = useCallback(async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    setUploading(true);
    try {
      const blob = await getCroppedImg(imageSrc, croppedAreaPixels);
      const file = new File([blob], "avatar.png", { type: "image/png" });

      // perform upload to /api/uploads using FormData (multipart)
      const form = new FormData();
      form.append("file", file, file.name);

      const res = await fetch(`/api/uploads`, {
        method: "POST",
        body: form,
        credentials: "include",
      });
      if (!res.ok) throw new Error(`Upload failed ${res.status}`);
      const data = await res.json();
      onChange(data.mediaUrl);
      setShowCrop(false);
    } catch (err) {
      console.error("Avatar upload error:", err);
      alert("Erro ao enviar imagem");
    } finally {
      setUploading(false);
    }
  }, [imageSrc, croppedAreaPixels, onChange]);

  return (
    <div>
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full overflow-hidden bg-muted">
          {initialImage ? <img src={initialImage} className="w-full h-full object-cover" alt="avatar"/> : null}
        </div>
        <input ref={inputRef} type="file" accept="image/*" onChange={onFileChange} />
      </div>

      <Dialog open={showCrop} onOpenChange={setShowCrop}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Cortar imagem</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div style={{ position: "relative", width: "100%", height: 400, background: "#333" }}>
              {imageSrc && (
                <Cropper
                  image={imageSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                />
              )}
            </div>

            <div className="flex items-center gap-3">
              <label className="text-sm">Zoom</label>
              <input
                type="range"
                min={1}
                max={3}
                step={0.01}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="flex-1"
              />
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
                <Button variant="outline" onClick={() => setShowCrop(false)}>Cancelar</Button>
                <Button onClick={uploadCropped} disabled={uploading}>{uploading ? "Enviando..." : "Confirmar & Enviar"}</Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
