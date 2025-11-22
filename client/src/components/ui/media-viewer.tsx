import { useState } from "react";
import { X, Download, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./dialog";

interface MediaViewerProps {
  src: string;
  type: "image" | "pdf";
  filename?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MediaViewer({ src, type, filename, open, onOpenChange }: MediaViewerProps) {
  const [zoom, setZoom] = useState(100);

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = src;
    link.download = filename || "download";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[90vh]">
        <DialogHeader>
          <DialogTitle>{filename || "Visualizar"}</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-auto bg-muted rounded-lg p-4">
          {type === "image" ? (
            <div className="flex items-center justify-center min-h-full">
              <img
                src={src}
                alt={filename}
                style={{ transform: `scale(${zoom / 100})` }}
                className="max-w-full h-auto transition-transform"
              />
            </div>
          ) : (
            <iframe
              src={src}
              className="w-full h-full border-0"
              title={filename}
            />
          )}
        </div>

        <div className="flex items-center justify-between gap-4 pt-4 border-t">
          <div className="flex items-center gap-2">
            {type === "image" && (
              <>
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => setZoom(Math.max(25, zoom - 25))}
                  disabled={zoom <= 25}
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground min-w-[4rem] text-center">
                  {zoom}%
                </span>
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => setZoom(Math.min(200, zoom + 25))}
                  disabled={zoom >= 200}
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
          
          <Button onClick={handleDownload} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface AttachmentThumbnailProps {
  src: string;
  type: "image" | "pdf" | "audio" | "video" | "file";
  filename?: string;
  onClick?: () => void;
  className?: string;
}

export function AttachmentThumbnail({ src, type, filename, onClick, className }: AttachmentThumbnailProps) {
  const getThumbnail = () => {
    switch (type) {
      case "image":
        return (
          <img
            src={src}
            alt={filename}
            className="w-full h-full object-cover"
          />
        );
      case "pdf":
        return (
          <div className="w-full h-full flex items-center justify-center bg-red-500/10">
            <span className="text-2xl font-bold text-red-500">PDF</span>
          </div>
        );
      case "audio":
        return (
          <div className="w-full h-full flex items-center justify-center bg-blue-500/10">
            <span className="text-2xl font-bold text-blue-500">♪</span>
          </div>
        );
      case "video":
        return (
          <div className="w-full h-full flex items-center justify-center bg-purple-500/10">
            <span className="text-2xl font-bold text-purple-500">▶</span>
          </div>
        );
      default:
        return (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <span className="text-2xl font-bold text-muted-foreground">📄</span>
          </div>
        );
    }
  };

  return (
    <div
      className={cn(
        "relative w-40 h-40 rounded-lg overflow-hidden border cursor-pointer hover:opacity-80 transition-opacity",
        className
      )}
      onClick={onClick}
    >
      {getThumbnail()}
      {filename && (
        <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-2 truncate">
          {filename}
        </div>
      )}
    </div>
  );
}
