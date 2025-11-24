import { useState, useEffect } from "react";
import { FileIcon, Music, File, Image as ImageIcon, Video as VideoIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  FileInfo, 
  AudioMetadata, 
  readAudioMetadata,
  formatFileSize 
} from "@/lib/file-utils";
import { pdfjs, Document, Page } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface FilePreviewProps {
  file: File;
  fileInfo: FileInfo;
  previewUrl: string;
  className?: string;
}

export function ImagePreview({ previewUrl, className = "" }: { previewUrl: string; className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <img 
        src={previewUrl} 
        alt="Preview" 
        className="w-full h-auto rounded-lg object-contain max-h-96"
        data-testid="preview-image"
      />
    </div>
  );
}

export function VideoPreview({ previewUrl, className = "" }: { previewUrl: string; className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <video 
        src={previewUrl} 
        controls 
        className="w-full rounded-lg max-h-96"
        data-testid="preview-video"
      />
    </div>
  );
}

export function AudioPreview({ 
  file, 
  previewUrl, 
  className = "" 
}: { 
  file: File; 
  previewUrl: string; 
  className?: string;
}) {
  const [metadata, setMetadata] = useState<AudioMetadata | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMetadata = async () => {
      setLoading(true);
      try {
        const meta = await readAudioMetadata(file);
        setMetadata(meta);
      } catch (error) {
        console.error("Error loading audio metadata:", error);
      } finally {
        setLoading(false);
      }
    };

    loadMetadata();
  }, [file]);

  return (
    <Card className={`p-6 ${className}`} data-testid="preview-audio">
      <div className="flex flex-col gap-4">
        {/* Album art placeholder */}
        <div className="w-full aspect-square bg-muted rounded-lg flex items-center justify-center overflow-hidden">
          <Music className="h-24 w-24 opacity-30" />
        </div>

        {/* Metadata */}
        <div className="space-y-2">
          {loading ? (
            <>
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </>
          ) : (
            <>
              <h3 className="font-semibold text-lg" data-testid="audio-title">
                {metadata?.title || file.name}
              </h3>
              <p className="text-sm text-muted-foreground">
                {formatFileSize(file.size)}
              </p>
            </>
          )}
        </div>

        {/* Audio player */}
        <audio 
          src={previewUrl} 
          controls 
          className="w-full mt-2"
          data-testid="audio-player"
        />
      </div>
    </Card>
  );
}

export function PDFPreview({ previewUrl, className = "" }: { previewUrl: string; className?: string }) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setLoading(false);
  }

  return (
    <Card className={`p-4 ${className}`} data-testid="preview-pdf">
      <div className="space-y-4">
        {loading && (
          <div className="flex items-center justify-center py-8">
            <Skeleton className="w-full h-96" />
          </div>
        )}
        <Document
          file={previewUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={
            <div className="flex items-center justify-center py-8">
              <Skeleton className="w-full h-96" />
            </div>
          }
        >
          <Page 
            pageNumber={1} 
            renderTextLayer={false}
            renderAnnotationLayer={false}
            className="shadow-sm"
            width={Math.min(window.innerWidth - 100, 600)}
          />
        </Document>
        {numPages && numPages > 1 && (
          <p className="text-sm text-center text-muted-foreground" data-testid="pdf-pages">
            Página 1 de {numPages}
          </p>
        )}
      </div>
    </Card>
  );
}

export function UnknownFilePreview({ fileInfo, className = "" }: { fileInfo: FileInfo; className?: string }) {
  return (
    <Card className={`p-8 ${className}`} data-testid="preview-unknown">
      <div className="flex flex-col items-center gap-4 text-center">
        <FileIcon className="h-16 w-16 opacity-30" />
        <div>
          <p className="font-medium">{fileInfo.name}</p>
          <p className="text-sm text-muted-foreground">
            {formatFileSize(fileInfo.size)}
          </p>
          {fileInfo.extension && (
            <p className="text-xs text-muted-foreground uppercase mt-1">
              .{fileInfo.extension}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}

export function FilePreview({ file, fileInfo, previewUrl, className = "" }: FilePreviewProps) {
  switch (fileInfo.type) {
    case "image":
      return <ImagePreview previewUrl={previewUrl} className={className} />;
    case "video":
      return <VideoPreview previewUrl={previewUrl} className={className} />;
    case "audio":
      return <AudioPreview file={file} previewUrl={previewUrl} className={className} />;
    case "document":
      if (fileInfo.extension === "pdf") {
        return <PDFPreview previewUrl={previewUrl} className={className} />;
      }
      return <UnknownFilePreview fileInfo={fileInfo} className={className} />;
    default:
      return <UnknownFilePreview fileInfo={fileInfo} className={className} />;
  }
}
