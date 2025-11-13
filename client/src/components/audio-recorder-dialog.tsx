import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Mic, Square, Send, X } from "lucide-react";

interface AudioRecorderDialogProps {
  open: boolean;
  onClose: () => void;
  onSend: (audioBlob: Blob) => void;
}

export function AudioRecorderDialog({ open, onClose, onSend }: AudioRecorderDialogProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [volumeLevels, setVolumeLevels] = useState<number[]>(new Array(20).fill(0));
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const isClosingRef = useRef(false);

  useEffect(() => {
    if (open) {
      isClosingRef.current = false;
      if (!isRecording && !audioBlob) {
        startRecording();
      }
    } else {
      isClosingRef.current = true;
      cleanup();
    }
  }, [open]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      if (isClosingRef.current) {
        stream.getTracks().forEach(track => track.stop());
        return;
      }
      
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      analyserRef.current = analyser;

      if (isClosingRef.current) {
        stream.getTracks().forEach(track => track.stop());
        audioContext.close();
        return;
      }

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        if (isClosingRef.current) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        stream.getTracks().forEach(track => track.stop());
      };

      if (isClosingRef.current) {
        stream.getTracks().forEach(track => track.stop());
        audioContext.close();
        return;
      }

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      visualize();
    } catch (error) {
      console.error("Error accessing microphone:", error);
      onClose();
    }
  };

  const visualize = () => {
    if (!analyserRef.current) return;

    const analyser = analyserRef.current;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const draw = () => {
      analyser.getByteFrequencyData(dataArray);
      
      const levels = Array.from(dataArray.slice(0, 20)).map(value => 
        Math.min(100, (value / 255) * 100)
      );
      setVolumeLevels(levels);

      animationFrameRef.current = requestAnimationFrame(draw);
    };

    draw();
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }
  };

  const handleSend = () => {
    if (audioBlob) {
      onSend(audioBlob);
      cleanup();
      onClose();
    }
  };

  const cleanup = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (mediaRecorderRef.current) {
      if (mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      mediaRecorderRef.current = null;
    }
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingTime(0);
    setIsRecording(false);
    setVolumeLevels(new Array(20).fill(0));
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" data-testid="dialog-audio-recorder">
        <DialogHeader>
          <DialogTitle>Gravação de Áudio</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-6 py-6">
          <div className="text-4xl font-mono text-primary" data-testid="text-recording-time">
            {formatTime(recordingTime)}
          </div>

          <div className="flex items-end justify-center gap-1 h-24 w-full px-4">
            {volumeLevels.map((level, index) => (
              <div
                key={index}
                className="flex-1 bg-primary rounded-t transition-all duration-75"
                style={{ height: `${Math.max(4, level)}%` }}
                data-testid={`equalizer-bar-${index}`}
              />
            ))}
          </div>

          {audioUrl && (
            <audio
              src={audioUrl}
              controls
              className="w-full"
              data-testid="audio-preview"
            />
          )}

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
            ) : audioBlob ? (
              <>
                <Button
                  onClick={() => {
                    setAudioBlob(null);
                    setAudioUrl(null);
                    startRecording();
                  }}
                  variant="outline"
                  className="flex-1"
                  data-testid="button-rerecord"
                >
                  <Mic className="h-4 w-4 mr-2" />
                  Regravar
                </Button>
                <Button
                  onClick={handleSend}
                  className="flex-1"
                  data-testid="button-send-audio"
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
