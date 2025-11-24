import { useState, useEffect } from "react";
import { FileIcon, Music, File, Image as ImageIcon, Video as VideoIcon, Play, Pause } from "lucide-react";
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
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audioRef, setAudioRef] = useState<HTMLAudioElement | null>(null);
  const [audioError, setAudioError] = useState<string | null>(null);

  useEffect(() => {
    let objectUrl: string | null = null;

    const loadMetadata = async () => {
      setLoading(true);
      setAudioError(null);
      try {
        console.log("[AudioPreview] Loading metadata for file:", file.name);
        const meta = await readAudioMetadata(file);
        console.log("[AudioPreview] Metadata loaded:", {
          title: meta.title,
          artist: meta.artist,
          album: meta.album,
          duration: meta.duration,
          hasPicture: !!meta.picture
        });
        setMetadata(meta);

        // Convert album art to data URL if available
        if (meta.picture) {
          const blob = new Blob([new Uint8Array(meta.picture.data)], { type: meta.picture.format });
          const url = URL.createObjectURL(blob);
          objectUrl = url;
          setCoverUrl(url);
          console.log("[AudioPreview] Cover URL created");
        } else {
          console.log("[AudioPreview] No album art found");
        }
      } catch (error) {
        console.error("[AudioPreview] Error loading audio metadata:", error);
        // Set minimal metadata on error
        setMetadata({
          title: file.name.replace(/\.[^/.]+$/, "")
        });
      } finally {
        console.log("[AudioPreview] Metadata loading complete");
        setLoading(false);
      }
    };

    loadMetadata();

    return () => {
      // Revoke the object URL created in this effect
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [file]);

  const togglePlay = async () => {
    if (!audioRef) {
      console.log("[AudioPreview] No audio ref available");
      return;
    }
    
    try {
      if (isPlaying) {
        audioRef.pause();
        setIsPlaying(false);
      } else {
        await audioRef.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error("[AudioPreview] Error playing audio:", error);
      setAudioError("Erro ao reproduzir o áudio");
      setIsPlaying(false);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef || !duration) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newTime = percent * duration;
    audioRef.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Log previewUrl for debugging
  useEffect(() => {
    console.log("[AudioPreview] Preview URL:", previewUrl);
    console.log("[AudioPreview] File type:", file.type);
    console.log("[AudioPreview] File size:", file.size);
    console.log("[AudioPreview] File name:", file.name);
    
    // Test if URL is valid
    if (previewUrl.startsWith('blob:')) {
      console.log("[AudioPreview] Preview URL is a blob URL");
    } else {
      console.log("[AudioPreview] Preview URL is NOT a blob URL - this might cause issues");
    }
  }, [previewUrl, file]);

  // Setup and cleanup audio element event listeners
  useEffect(() => {
    if (!audioRef) return;

    console.log("[AudioPreview] Setting up audio event listeners");

    const handleTimeUpdate = () => {
      const currentTime = audioRef.currentTime;
      console.log("[AudioPreview] Time update:", currentTime);
      setCurrentTime(currentTime);
    };

    const handleLoadedMetadata = () => {
      const audioDuration = audioRef.duration;
      console.log("[AudioPreview] Loaded metadata - Duration:", audioDuration);
      if (!isNaN(audioDuration) && audioDuration > 0) {
        setDuration(audioDuration);
      }
    };

    const handleDurationChange = () => {
      console.log("[AudioPreview] Duration changed:", audioRef.duration);
      if (audioRef.duration && !isNaN(audioRef.duration) && audioRef.duration > 0) {
        setDuration(audioRef.duration);
      }
    };

    const handleEnded = () => {
      console.log("[AudioPreview] Audio ended");
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handleError = (e: Event) => {
      console.error("[AudioPreview] Error loading audio:", e);
      setAudioError("Erro ao carregar o arquivo de áudio");
      setIsPlaying(false);
    };

    const handleCanPlay = () => {
      console.log("[AudioPreview] Audio can play");
      setAudioError(null);
    };

    const handlePlay = () => {
      console.log("[AudioPreview] Audio started playing");
      setIsPlaying(true);
    };

    const handlePause = () => {
      console.log("[AudioPreview] Audio paused");
      setIsPlaying(false);
    };

    const handleCanPlayThrough = () => {
      console.log("[AudioPreview] Audio can play through");
      if (audioRef.duration && !isNaN(audioRef.duration) && audioRef.duration > 0) {
        console.log("[AudioPreview] Setting duration from canplaythrough:", audioRef.duration);
        setDuration(audioRef.duration);
      }
    };

    audioRef.addEventListener('timeupdate', handleTimeUpdate);
    audioRef.addEventListener('loadedmetadata', handleLoadedMetadata);
    audioRef.addEventListener('durationchange', handleDurationChange);
    audioRef.addEventListener('ended', handleEnded);
    audioRef.addEventListener('error', handleError);
    audioRef.addEventListener('canplay', handleCanPlay);
    audioRef.addEventListener('play', handlePlay);
    audioRef.addEventListener('pause', handlePause);
    audioRef.addEventListener('canplaythrough', handleCanPlayThrough);

    return () => {
      console.log("[AudioPreview] Cleaning up audio element");
      audioRef.removeEventListener('timeupdate', handleTimeUpdate);
      audioRef.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audioRef.removeEventListener('durationchange', handleDurationChange);
      audioRef.removeEventListener('ended', handleEnded);
      audioRef.removeEventListener('error', handleError);
      audioRef.removeEventListener('canplay', handleCanPlay);
      audioRef.removeEventListener('play', handlePlay);
      audioRef.removeEventListener('pause', handlePause);
      audioRef.removeEventListener('canplaythrough', handleCanPlayThrough);
      audioRef.pause();
      audioRef.src = '';
    };
  }, [audioRef]);

  return (
    <div className={`${className}`} data-testid="preview-audio">
      <div className="flex flex-col gap-6 p-6 bg-gradient-to-br from-card via-card to-muted/50 rounded-xl border border-border/50">
        {audioError && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-sm text-destructive">
            {audioError}
          </div>
        )}
        {/* Album art and metadata */}
        <div className="flex gap-6 items-start">
          <div className="w-32 h-32 bg-muted rounded-xl flex items-center justify-center overflow-hidden shrink-0 shadow-xl">
            {coverUrl ? (
              <img 
                src={coverUrl} 
                alt="Album art" 
                className="w-full h-full object-cover"
                data-testid="audio-cover"
              />
            ) : (
              <Music className="h-16 w-16 opacity-30" />
            )}
          </div>

          <div className="flex-1 min-w-0 space-y-2">
            {loading ? (
              <>
                <Skeleton className="h-7 w-3/4" />
                <Skeleton className="h-5 w-1/2" />
                <Skeleton className="h-4 w-2/3" />
              </>
            ) : (
              <>
                <h3 className="font-bold text-xl truncate" data-testid="audio-title">
                  {metadata?.title || file.name.replace(/\.[^/.]+$/, "")}
                </h3>
                <p className="text-base text-muted-foreground truncate" data-testid="audio-artist">
                  {metadata?.artist || "Artista desconhecido"}
                </p>
                {metadata?.album && (
                  <p className="text-sm text-muted-foreground truncate" data-testid="audio-album">
                    {metadata.album}
                    {metadata.year && ` (${metadata.year})`}
                  </p>
                )}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{formatFileSize(file.size)}</span>
                  <span>•</span>
                  <span data-testid="audio-duration">
                    {duration > 0 ? formatTime(duration) : (metadata?.duration ? formatTime(metadata.duration) : "--:--")}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Custom Audio Player */}
        <div className="space-y-3">
          {/* Progress Bar */}
          <div 
            className="relative h-2 bg-muted rounded-full overflow-hidden cursor-pointer group"
            onClick={handleSeek}
          >
            <div 
              className="absolute inset-y-0 left-0 bg-primary rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
            <div 
              className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-primary rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
              style={{ left: `calc(${progress}% - 8px)` }}
            />
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={togglePlay}
                disabled={!!audioError || !audioRef}
                className="h-14 w-14 rounded-full bg-primary hover:bg-primary/90 flex items-center justify-center shadow-lg transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                data-testid="audio-play-button"
              >
                {isPlaying ? (
                  <Pause className="h-7 w-7 fill-current text-primary-foreground" />
                ) : (
                  <Play className="h-7 w-7 fill-current text-primary-foreground ml-1" />
                )}
              </button>
              <div className="text-sm font-mono text-muted-foreground">
                {formatTime(currentTime)}
              </div>
            </div>
            <div className="text-sm font-mono text-muted-foreground">
              {formatTime(duration || metadata?.duration || 0)}
            </div>
          </div>
        </div>

        {/* Hidden audio element */}
        <audio 
          ref={setAudioRef}
          src={previewUrl}
          data-testid="audio-player"
          className="hidden"
          preload="metadata"
        />
      </div>
    </div>
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
