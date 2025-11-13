import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Video, Square, Send, X } from "lucide-react";

interface VideoRecorderDialogProps {
  open: boolean;
  onClose: () => void;
  onSend: (videoBlob: Blob) => void;
}

export function VideoRecorderDialog({ open, onClose, onSend }: VideoRecorderDialogProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const previewRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const videoChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isClosingRef = useRef(false);

  useEffect(() => {
    if (open) {
      isClosingRef.current = false;
      if (!isRecording && !videoBlob) {
        startRecording();
      }
    } else {
      isClosingRef.current = true;
      cleanup();
    }
  }, [open]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 1280, height: 720 },
        audio: true 
      });
      
      if (isClosingRef.current) {
        stream.getTracks().forEach(track => track.stop());
        return;
      }
      
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      if (isClosingRef.current) {
        stream.getTracks().forEach(track => track.stop());
        return;
      }

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "video/webm;codecs=vp8,opus"
      });
      mediaRecorderRef.current = mediaRecorder;
      videoChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          videoChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        if (isClosingRef.current) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }
        const blob = new Blob(videoChunksRef.current, { type: "video/webm" });
        setVideoBlob(blob);
        const url = URL.createObjectURL(blob);
        setVideoUrl(url);
        stream.getTracks().forEach(track => track.stop());
      };

      if (isClosingRef.current) {
        stream.getTracks().forEach(track => track.stop());
        return;
      }

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error("Error accessing camera:", error);
      onClose();
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    }
  };

  const handleSend = () => {
    if (videoBlob) {
      onSend(videoBlob);
      cleanup();
      onClose();
    }
  };

  const cleanup = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRecorderRef.current) {
      if (mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      mediaRecorderRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl);
    }
    
    setVideoBlob(null);
    setVideoUrl(null);
    setRecordingTime(0);
    setIsRecording(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl" data-testid="dialog-video-recorder">
        <DialogHeader>
          <DialogTitle>Gravação de Vídeo</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-4">
          <div className="text-3xl font-mono text-primary" data-testid="text-recording-time">
            {formatTime(recordingTime)}
          </div>

          <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
            {!videoBlob ? (
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                autoPlay
                muted
                data-testid="video-preview-live"
              />
            ) : (
              <video
                ref={previewRef}
                src={videoUrl || undefined}
                className="w-full h-full object-cover"
                controls
                data-testid="video-preview-recorded"
              />
            )}
            {isRecording && (
              <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-500 text-white px-3 py-1 rounded-full">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                <span className="text-sm font-medium">Gravando</span>
              </div>
            )}
          </div>

          <div className="flex gap-2 w-full">
            {isRecording ? (
              <Button
                onClick={stopRecording}
                variant="destructive"
                className="flex-1"
                data-testid="button-stop-recording"
              >
                <Square className="h-4 w-4 mr-2" />
                Parar Gravação
              </Button>
            ) : videoBlob ? (
              <>
                <Button
                  onClick={() => {
                    setVideoBlob(null);
                    setVideoUrl(null);
                    startRecording();
                  }}
                  variant="outline"
                  className="flex-1"
                  data-testid="button-rerecord"
                >
                  <Video className="h-4 w-4 mr-2" />
                  Regravar
                </Button>
                <Button
                  onClick={handleSend}
                  className="flex-1"
                  data-testid="button-send-video"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Enviar
                </Button>
              </>
            ) : null}
            <Button
              onClick={() => {
                cleanup();
                onClose();
              }}
              variant="ghost"
              size="icon"
              data-testid="button-cancel-recording"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
