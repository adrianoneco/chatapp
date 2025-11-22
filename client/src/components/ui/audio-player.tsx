import { useState, useRef, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";
import { Button } from "./button";
import { Slider } from "./slider";
import { cn } from "@/lib/utils";
import { parseBlob } from "music-metadata";

interface AudioPlayerProps {
  src: string;
  className?: string;
  metadata?: {
    title?: string;
    artist?: string;
    album?: string;
    artwork?: string;
  };
}

let currentlyPlayingAudio: HTMLAudioElement | null = null;

export function AudioPlayer({ src, className, metadata: initialMetadata }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [metadata, setMetadata] = useState<{
    title?: string;
    artist?: string;
    album?: string;
    artwork?: string;
  }>(initialMetadata || {});

  useEffect(() => {
    if (!initialMetadata && src) {
      fetch(src)
        .then(response => response.blob())
        .then(blob => parseBlob(blob))
        .then(metadata => {
          let artwork = undefined;
          
          if (metadata.common.picture && metadata.common.picture.length > 0) {
            const picture = metadata.common.picture[0];
            const base64String = btoa(
              new Uint8Array(picture.data).reduce((data, byte) => data + String.fromCharCode(byte), '')
            );
            artwork = `data:${picture.format};base64,${base64String}`;
          }
          
          setMetadata({
            title: metadata.common.title,
            artist: metadata.common.artist,
            album: metadata.common.album,
            artwork,
          });
        })
        .catch(error => {
          console.warn("Error reading audio tags:", error);
        });
    }
  }, [src, initialMetadata]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("durationchange", updateDuration);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("loadedmetadata", updateDuration);

    if ("mediaSession" in navigator && audio) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: metadata.title || "Áudio",
        artist: metadata.artist || "Desconhecido",
        album: metadata.album || "",
        artwork: metadata.artwork ? [{ src: metadata.artwork }] : [],
      });
    }

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("durationchange", updateDuration);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("loadedmetadata", updateDuration);
    };
  }, [metadata]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      if (currentlyPlayingAudio && currentlyPlayingAudio !== audio) {
        currentlyPlayingAudio.pause();
      }
      audio.play();
      currentlyPlayingAudio = audio;
      setIsPlaying(true);
    }
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleSeek = (value: number[]) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = value[0];
    setCurrentTime(value[0]);
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className={cn("bg-card border rounded-lg p-4 w-full sm:max-w-[512px]", className)}>
      <audio ref={audioRef} src={src} preload="metadata" crossOrigin="anonymous" />
      
      <div className="flex gap-4 mb-4">
        <div className="w-20 h-20 bg-muted rounded flex-shrink-0 flex items-center justify-center overflow-hidden">
          {metadata.artwork ? (
            <img src={metadata.artwork} alt="Album art" className="w-full h-full object-cover" />
          ) : (
            <Volume2 className="h-8 w-8 text-muted-foreground" />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="font-semibold truncate">{metadata.title || "Áudio"}</div>
          <div className="text-sm text-muted-foreground truncate">
            {metadata.artist || "Artista desconhecido"}
          </div>
          {metadata.album && (
            <div className="text-xs text-muted-foreground truncate">{metadata.album}</div>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Slider
          value={[currentTime]}
          max={duration || 100}
          step={0.1}
          onValueChange={handleSeek}
          className="cursor-pointer"
        />
        
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant="ghost"
              onClick={togglePlay}
              className="h-8 w-8"
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <span className="text-xs text-muted-foreground tabular-nums">
              {formatTime(currentTime)}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground tabular-nums">
              {formatTime(duration)}
            </span>
            <Button
              size="icon"
              variant="ghost"
              onClick={toggleMute}
              className="h-8 w-8"
            >
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
