import { useEffect, useRef } from "react";
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { UserAvatar } from "./user-avatar";
import { useState } from "react";

interface CallDialogProps {
  open: boolean;
  onClose: () => void;
  recipientName: string;
  recipientAvatarUrl?: string | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isVideo: boolean;
  status: "initiating" | "ringing" | "active" | "ended";
  onToggleVideo?: () => void;
  onToggleAudio?: () => void;
  onEndCall: () => void;
}

export function CallDialog({
  open,
  onClose,
  recipientName,
  recipientAvatarUrl,
  localStream,
  remoteStream,
  isVideo,
  status,
  onToggleVideo,
  onToggleAudio,
  onEndCall,
}: CallDialogProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const handleToggleVideo = () => {
    setIsVideoEnabled(prev => !prev);
    onToggleVideo?.();
  };

  const handleToggleAudio = () => {
    setIsAudioEnabled(prev => !prev);
    onToggleAudio?.();
  };

  const handleEndCall = () => {
    onEndCall();
    onClose();
  };

  const statusText = {
    initiating: "Iniciando chamada...",
    ringing: "Chamando...",
    active: "Chamada em andamento",
    ended: "Chamada encerrada",
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[600px] p-0 gap-0" data-testid="dialog-call">
        <div className="relative flex flex-col h-full bg-muted/20">
          {isVideo && remoteStream ? (
            <div className="flex-1 relative bg-black">
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
                data-testid="video-remote"
              />
              {localStream && (
                <div className="absolute bottom-4 right-4 w-48 h-36 bg-black rounded-lg overflow-hidden border-2 border-white">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover mirror"
                    data-testid="video-local"
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8">
              <UserAvatar name={recipientName} avatarUrl={recipientAvatarUrl} size="lg" />
              <div className="text-center">
                <h3 className="text-2xl font-semibold mb-2">{recipientName}</h3>
                <p className="text-muted-foreground">{statusText[status]}</p>
              </div>
            </div>
          )}

          <Card className="m-4 p-4">
            <div className="flex items-center justify-center gap-3">
              {isVideo && (
                <Button
                  size="icon"
                  variant={isVideoEnabled ? "default" : "destructive"}
                  onClick={handleToggleVideo}
                  data-testid="button-toggle-video"
                >
                  {isVideoEnabled ? (
                    <Video className="h-5 w-5" />
                  ) : (
                    <VideoOff className="h-5 w-5" />
                  )}
                </Button>
              )}
              
              <Button
                size="icon"
                variant={isAudioEnabled ? "default" : "destructive"}
                onClick={handleToggleAudio}
                data-testid="button-toggle-audio"
              >
                {isAudioEnabled ? (
                  <Mic className="h-5 w-5" />
                ) : (
                  <MicOff className="h-5 w-5" />
                )}
              </Button>

              <Button
                size="icon"
                variant="destructive"
                onClick={handleEndCall}
                data-testid="button-end-call"
              >
                <PhoneOff className="h-5 w-5" />
              </Button>
            </div>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
