import { MainLayout } from "@/components/layout/main-layout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Search, Send, Phone, Video, MoreVertical, Smile, Paperclip, ArrowLeft, MessageSquare, CornerDownRight, Quote, Trash2, Play, Pause, Mic, Image as ImageIcon, Film, File, Disc, Music, Volume2, VolumeX, Maximize, PanelLeftClose, PanelLeft, Reply, Forward, Laugh, X, MapPin, Clock, Hash, User, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useLocation, useRoute } from "wouter";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { useRef, useEffect, useState } from "react";
import { useConversations, useConversation, useMessages, useSendMessage, useDeleteMessage, useAddReaction, ConversationWithDetails, MessageWithDetails } from "@/hooks/use-conversations";
import { useUser } from "@/hooks/use-user";
import { format, isToday, isYesterday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Slider } from "@/components/ui/slider";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

// Assets - usando /storage para servir arquivos de forma segura
const mp3File = "/storage/13. Behind Enemy Lines_1763919687567.mp3";
const videoFile = "/storage/9312ac4fd6cf30b9cabb0eb07b5bc517_1763919709453.mp4";
const mp3File1 = "/storage/01. Here We Go Again_1763921733934.mp3";
const mp3File2 = "/storage/05. Demi Lovato & Joe Jonas - Wouldn't Change A Thing_1763921733934.mp3";
const mp3File3 = "/storage/10. Give Your Heart A Break_1763921733934.mp3";
const mp3File4 = "/storage/12. Back Around_1763921733934.mp3";

// Album Covers - usando /storage para servir arquivos de forma segura
const cover14 = "/storage/covers/cover-14.jpg";
const cover16 = "/storage/covers/cover-16.jpg";
const cover17 = "/storage/covers/cover-17.jpg";
const cover18 = "/storage/covers/cover-18.jpg";
const cover19 = "/storage/covers/cover-19.jpg";

interface Message {
  id: number;
  conversationId: number;
  sender: string;
  content: string;
  time: string;
  date: string;
  type: 'text' | 'image' | 'video' | 'audio';
  channel: string;
  remoteJid: string | null;
  mediaUrl?: string;
  duration?: string;
  caption?: string;
  recorded?: boolean;
  forwarded?: boolean;
  deleted?: boolean;
  replyTo?: number;
  reactions?: { emoji: string; count: number }[];
  metadata?: {
    audio_tags?: {
      title: string;
      artist: string;
      album?: string;
      year?: string;
      cover: string | null;
    },
    file?: {
      name: string;
      size: string;
      type: string;
    }
  } | null;
}

const contacts = [
  { id: 1, name: "Ana Silva", status: "Online", lastMessage: "Enviando o vídeo...", time: "10:42", unread: 2, avatar: "https://i.pravatar.cc/150?u=1" },
  { id: 2, name: "Carlos Oliveira", status: "Offline", lastMessage: "Você viu o novo layout?", time: "Ontem", unread: 0, avatar: "https://i.pravatar.cc/150?u=2" },
  { id: 3, name: "Equipe de Design", status: "Online", lastMessage: "João: Precisamos aprovar o...", time: "Segunda", unread: 5, avatar: "https://i.pravatar.cc/150?u=3" },
  { id: 4, name: "Mariana Costa", status: "Online", lastMessage: "Te envio o arquivo já.", time: "10:05", unread: 0, avatar: "https://i.pravatar.cc/150?u=4" },
  { id: 5, name: "Roberto Santos", status: "Ausente", lastMessage: "Ok.", time: "09:30", unread: 0, avatar: "https://i.pravatar.cc/150?u=5" },
  { id: 6, name: "Julia Pereira", status: "Online", lastMessage: "Vamos almoçar?", time: "09:15", unread: 1, avatar: "https://i.pravatar.cc/150?u=6" },
];

const initialMessages: Message[] = [
  { id: 1, conversationId: 1, sender: "me", content: "Oi Ana, tudo bem?", time: "10:30", date: "2025-11-10", type: "text", channel: "webchat", remoteJid: null, reactions: [{ emoji: "👋", count: 1 }] },
  { id: 2, conversationId: 1, sender: "other", content: "Oii! Tudo ótimo por aqui e com você?", time: "10:32", date: "2025-11-10", type: "text", channel: "webchat", remoteJid: null },
  { id: 3, conversationId: 1, sender: "me", content: "Tudo certo. Viu o projeto novo?", time: "10:33", date: "2025-11-10", type: "text", channel: "webchat", remoteJid: null },
  { id: 4, conversationId: 1, sender: "other", content: "Sim! Ficou incrível o design.", time: "10:35", date: "2025-11-10", type: "text", channel: "webchat", remoteJid: null, reactions: [{ emoji: "❤️", count: 2 }, { emoji: "👍", count: 1 }] },
  { id: 5, conversationId: 1, sender: "other", content: "Acho que só precisamos ajustar aquele detalhe no header.", time: "10:35", date: "2025-11-10", replyTo: 3, type: "text", channel: "webchat", remoteJid: null },
  { id: 6, conversationId: 1, sender: "me", content: "Verdade. Vou mexer nisso agora.", time: "10:40", date: "2025-11-10", replyTo: 5, type: "text", channel: "webchat", remoteJid: null },
  { id: 7, conversationId: 1, sender: "other", content: "Combinado! Até logo.", time: "10:42", date: "2025-11-10", type: "text", channel: "webchat", remoteJid: null },
  { id: 8, conversationId: 1, sender: "other", content: "Encaminhando o orçamento que você pediu.", time: "10:45", date: "2025-11-10", forwarded: true, type: "text", channel: "webchat", remoteJid: null },
  { id: 9, conversationId: 1, sender: "me", content: "Mensagem apagada", time: "10:46", date: "2025-11-10", deleted: true, type: "text", channel: "webchat", remoteJid: null },
  { id: 20, conversationId: 1, sender: "other", content: "Desculpa, não vi essa mensagem!", time: "10:47", date: "2025-11-10", replyTo: 9, type: "text", channel: "webchat", remoteJid: null },
  
  // Image Message
  { 
    id: 10, 
    conversationId: 1, 
    sender: "other", 
    content: "", 
    time: "10:48", 
    date: "2025-11-10", 
    type: "image", 
    channel: "webchat", 
    remoteJid: null, 
    mediaUrl: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OHx8d29ya3xlbnwwfHwwfHx8MA%3D%3D", 
    caption: "Olha essa referência",
    metadata: {
      file: {
        name: "referencia-trabalho.jpg",
        size: "2.4 MB",
        type: "image/jpeg"
      }
    }
  },
  
  // Recorded Audio
  { id: 11, conversationId: 1, sender: "me", content: "", time: "10:50", date: "2025-11-10", type: "audio", channel: "webchat", remoteJid: null, duration: "0:15", recorded: true },
  
  // Recorded Video
  { 
    id: 12, 
    conversationId: 1, 
    sender: "other", 
    content: "", 
    time: "10:52", 
    date: "2025-11-10", 
    type: "video", 
    channel: "webchat", 
    remoteJid: null, 
    mediaUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4", 
    duration: "0:30", 
    recorded: true,
    metadata: {
      file: {
        name: "video-gravado.mp4",
        size: "1.8 MB",
        type: "video/mp4"
      }
    }
  },
  
  // Uploaded Video (The one provided)
  { 
    id: 13, 
    conversationId: 1, 
    sender: "me", 
    content: "", 
    time: "10:55", 
    date: "2025-11-10", 
    type: "video", 
    channel: "webchat", 
    remoteJid: null, 
    mediaUrl: videoFile, 
    duration: "0:12", 
    caption: "Vídeo do projeto finalizado",
    metadata: {
      file: {
        name: "9312ac4fd6cf30b9cabb0eb07b5bc517_1763919709453.mp4",
        size: "856 KB",
        type: "video/mp4"
      }
    }
  },
  
  // Uploaded MP3 with ID3 (The one provided)
  { 
    id: 14, 
    conversationId: 1, 
    sender: "other", 
    content: "", 
    time: "10:58", 
    date: "2025-11-10",
    type: "audio",
    channel: "webchat",
    remoteJid: null,
    mediaUrl: mp3File, 
    duration: "3:42",
    metadata: {
      audio_tags: {
        title: "Behind Enemy Lines",
        artist: "Demi Lovato",
        album: "Here We Go Again",
        year: "2009",
        cover: cover14
      },
      file: {
        name: "13. Behind Enemy Lines_1763919687567.mp3",
        size: "5.2 MB",
        type: "audio/mpeg"
      }
    }
  },
  
  // Uploaded MP3 without ID3
  { 
    id: 15, 
    conversationId: 1, 
    sender: "me", 
    content: "", 
    time: "11:00", 
    date: "2025-11-10", 
    type: "audio", 
    channel: "webchat", 
    remoteJid: null, 
    mediaUrl: "#", 
    duration: "2:15", 
    caption: "Audio_sem_tags.mp3",
    metadata: {
      file: {
        name: "Audio_sem_tags.mp3",
        size: "3.1 MB",
        type: "audio/mpeg"
      }
    }
  },

  // New uploaded audio files
  { 
    id: 16, 
    conversationId: 1, 
    sender: "other", 
    content: "", 
    time: "11:02", 
    date: "2025-11-10",
    type: "audio",
    channel: "webchat",
    remoteJid: null,
    mediaUrl: mp3File1, 
    duration: "3:48",
    metadata: {
      audio_tags: {
        title: "Here We Go Again",
        artist: "Demi Lovato",
        album: "Here We Go Again",
        year: "2009",
        cover: cover16
      },
      file: {
        name: "01. Here We Go Again_1763921733934.mp3",
        size: "5.4 MB",
        type: "audio/mpeg"
      }
    }
  },
  { 
    id: 17, 
    conversationId: 1, 
    sender: "me", 
    content: "", 
    time: "11:05", 
    date: "2025-11-10",
    type: "audio",
    channel: "webchat",
    remoteJid: null,
    mediaUrl: mp3File2, 
    duration: "3:28",
    metadata: {
      audio_tags: {
        title: "Wouldn't Change A Thing",
        artist: "Demi Lovato & Joe Jonas",
        album: "Camp Rock 2: The Final Jam",
        year: "2010",
        cover: cover17
      },
      file: {
        name: "05. Demi Lovato & Joe Jonas - Wouldn't Change A Thing_1763921733934.mp3",
        size: "4.9 MB",
        type: "audio/mpeg"
      }
    }
  },
  { 
    id: 18, 
    conversationId: 1, 
    sender: "other", 
    content: "", 
    time: "11:08", 
    date: "2025-11-10",
    type: "audio",
    channel: "webchat",
    remoteJid: null,
    mediaUrl: mp3File3, 
    duration: "3:27",
    metadata: {
      audio_tags: {
        title: "Give Your Heart A Break",
        artist: "Demi Lovato",
        album: "Unbroken",
        year: "2011",
        cover: cover18
      },
      file: {
        name: "10. Give Your Heart A Break_1763921733934.mp3",
        size: "4.8 MB",
        type: "audio/mpeg"
      }
    }
  },
  { 
    id: 19, 
    conversationId: 1, 
    sender: "me", 
    content: "", 
    time: "11:10", 
    date: "2025-11-10",
    type: "audio",
    channel: "webchat",
    remoteJid: null,
    mediaUrl: mp3File4, 
    duration: "3:12",
    metadata: {
      audio_tags: {
        title: "Back Around",
        artist: "Demi Lovato",
        album: "Here We Go Again",
        year: "2009",
        cover: cover19
      },
      file: {
        name: "12. Back Around_1763921733934.mp3",
        size: "4.5 MB",
        type: "audio/mpeg"
      }
    }
  },

  { id: 101, conversationId: 2, sender: "other", content: "Você viu o novo layout?", time: "Ontem", date: "2025-11-09", type: "text", channel: "webchat", remoteJid: null },
  { id: 102, conversationId: 2, sender: "me", content: "Ainda não, vou olhar agora!", time: "Ontem", date: "2025-11-09", type: "text", channel: "webchat", remoteJid: null },
];

// Custom Video Player Component
function CustomVideoPlayer({ src, poster, recorded }: { src: string, poster?: string, recorded?: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    const handleLoadedMetadata = () => setDuration(video.duration);
    const handleEnded = () => setIsPlaying(false);

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('ended', handleEnded);
    };
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      // Always show controls in fullscreen
      if (document.fullscreenElement) {
        setShowControls(true);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSeek = (value: number[]) => {
    if (videoRef.current) {
      videoRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    if (videoRef.current) {
      videoRef.current.volume = value[0];
      setVolume(value[0]);
      setIsMuted(value[0] === 0);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleFullscreen = () => {
    if (containerRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        containerRef.current.requestFullscreen();
      }
    }
  };

  return (
    <div 
      ref={containerRef}
      className={cn(
        "relative rounded-lg overflow-hidden bg-black group",
        recorded ? "aspect-[9/16] max-h-[300px]" : "w-full max-h-[400px]",
        isFullscreen && "!max-h-screen w-screen h-screen aspect-auto"
      )}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => !isFullscreen && setShowControls(isPlaying ? false : true)}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="w-full h-full object-cover cursor-pointer"
        onClick={togglePlay}
      />
      
      {recorded && (
        <div className="absolute top-2 right-2 bg-red-500/80 text-white text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 z-10">
          <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> REC
        </div>
      )}

      {/* Custom Controls */}
      <div className={cn(
        "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-3 transition-opacity duration-200",
        showControls ? "opacity-100" : "opacity-0"
      )}>
        {/* Progress Bar */}
        <Slider
          value={[currentTime]}
          max={duration || 100}
          step={0.1}
          className="mb-2 cursor-pointer"
          onValueChange={handleSeek}
        />

        {/* Control Buttons */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-white hover:bg-white/20"
              onClick={togglePlay}
            >
              {isPlaying ? <Pause className="h-5 w-5 fill-current" /> : <Play className="h-5 w-5 fill-current" />}
            </Button>

            <div className="flex items-center gap-1 group/volume">
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-white hover:bg-white/20"
                onClick={toggleMute}
              >
                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>
              <div className="w-0 group-hover/volume:w-16 transition-all overflow-hidden">
                <Slider
                  value={[isMuted ? 0 : volume]}
                  max={1}
                  step={0.1}
                  className="cursor-pointer"
                  onValueChange={handleVolumeChange}
                />
              </div>
            </div>

            <span className="text-xs text-white font-mono ml-1">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-white hover:bg-white/20"
            onClick={toggleFullscreen}
          >
            <Maximize className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// Emoji list for reactions
const EMOJI_LIST = [
  '❤️', '👍', '👏', '😂', '😮', '😢', '🙏', '🔥', '🎉', '💯',
  '👎', '😍', '🤔', '😊', '😎', '💪', '✨', '🙌', '👌', '💖'
];

// Emoji Picker Component
function EmojiPicker({ onSelect, messageId }: { onSelect: (emoji: string) => void; messageId: number }) {
  const [open, setOpen] = useState(false);

  const handleSelect = (emoji: string) => {
    onSelect(emoji);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
          aria-label="Reagir com emoji"
          data-testid={`button-emoji-picker-${messageId}`}
        >
          <Smile className="h-4 w-4 mr-2" />
          Reagir
        </button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-auto p-2" 
        side="right" 
        align="start"
        role="dialog"
        aria-label="Seletor de emojis"
      >
        <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-5 gap-1 max-w-xs">
          {EMOJI_LIST.map((emoji) => (
            <Button
              key={emoji}
              variant="ghost"
              size="icon"
              className="h-9 w-9 sm:h-10 sm:w-10 text-xl sm:text-2xl hover:bg-accent"
              onClick={() => handleSelect(emoji)}
              data-testid={`emoji-${emoji}-${messageId}`}
              aria-label={`Reagir com ${emoji}`}
            >
              {emoji}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Mock conversation details
interface ConversationDetails {
  protocol: string;
  date: string;
  client: {
    name: string;
    avatar: string;
    ip: string;
    location: string;
  };
  attendant: {
    name: string;
    avatar: string;
  };
  previousConversations: Array<{
    id: number;
    protocol: string;
    date: string;
    status: 'completed' | 'pending' | 'closed';
    attendant: string;
  }>;
}

// Conversation Details Content Component
interface ConversationDetailsProps {
  conversation: ConversationWithDetails;
}

function ConversationDetailsContent({ conversation }: ConversationDetailsProps) {
  const client = conversation.client!;
  const attendant = conversation.attendant;

  return (
    <div className="p-4 space-y-6">
      {/* Protocol and Date */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <Hash className="h-4 w-4 text-muted-foreground" />
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">Protocolo</p>
            <p className="font-mono font-medium">{conversation.protocol}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">Data/Hora</p>
            <p className="font-medium">{format(new Date(conversation.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}</p>
          </div>
        </div>
      </div>

      <Separator />

      {/* Client Info */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold flex items-center gap-2">
          <User className="h-4 w-4" />
          Cliente
        </h4>
        <div className="flex items-center gap-3 p-3 bg-background/50 rounded-lg">
          <Avatar className="h-12 w-12">
            <AvatarImage src={client.avatarUrl || undefined} />
            <AvatarFallback>{client.displayName.substring(0, 2)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{client.displayName}</p>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <MapPin className="h-3 w-3" />
              <span className="truncate">{conversation.clientLocation || "Localização desconhecida"}</span>
            </div>
          </div>
        </div>
        <div className="text-xs space-y-1">
          <p className="text-muted-foreground">IP: <span className="font-mono text-foreground">{conversation.clientIp || "Não disponível"}</span></p>
        </div>
      </div>

      <Separator />

      {/* Attendant Info */}
      {attendant && (
        <>
          <div className="space-y-3">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <User className="h-4 w-4" />
              Atendente
            </h4>
            <div className="flex items-center gap-3 p-3 bg-background/50 rounded-lg">
              <Avatar className="h-10 w-10">
                <AvatarImage src={attendant.avatarUrl || undefined} />
                <AvatarFallback>{attendant.displayName.substring(0, 2)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{attendant.displayName}</p>
                <p className="text-xs text-muted-foreground">Atendente responsável</p>
              </div>
            </div>
          </div>
          <Separator />
        </>
      )}
    </div>
  );
}

const conversationDetails: Record<number, ConversationDetails> = {
  1: {
    protocol: "WEB-2024-001234",
    date: "23/11/2024 15:30",
    client: {
      name: "Ana Silva",
      avatar: "https://i.pravatar.cc/150?u=1",
      ip: "177.45.123.89",
      location: "São Paulo, SP"
    },
    attendant: {
      name: "João Atendente",
      avatar: "https://i.pravatar.cc/150?u=10"
    },
    previousConversations: [
      { id: 1, protocol: "WEB-2024-001100", date: "20/11/2024", status: "completed", attendant: "Maria Santos" },
      { id: 2, protocol: "WEB-2024-000987", date: "15/11/2024", status: "completed", attendant: "João Atendente" },
      { id: 3, protocol: "WEB-2024-000756", date: "10/11/2024", status: "closed", attendant: "Carlos Lima" }
    ]
  },
  2: {
    protocol: "WEB-2024-001235",
    date: "22/11/2024 14:20",
    client: {
      name: "Carlos Oliveira",
      avatar: "https://i.pravatar.cc/150?u=2",
      ip: "200.150.100.50",
      location: "Rio de Janeiro, RJ"
    },
    attendant: {
      name: "Maria Santos",
      avatar: "https://i.pravatar.cc/150?u=11"
    },
    previousConversations: [
      { id: 1, protocol: "WEB-2024-001050", date: "18/11/2024", status: "completed", attendant: "Ana Costa" }
    ]
  }
};

export default function Conversations() {
  const [location, setLocation] = useLocation();
  const [match, params] = useRoute("/conversations/webchat/:id");
  const isChatOpen = !!match;
  const conversationId = params?.id;
  
  // API hooks
  const { data: user } = useUser();
  const { data: conversations, isLoading: loadingConversations } = useConversations();
  const { data: conversation } = useConversation(conversationId);
  const { data: messages = [], isLoading: loadingMessages } = useMessages(conversationId);
  const sendMessageMutation = useSendMessage();
  const deleteMessageMutation = useDeleteMessage();
  const addReactionMutation = useAddReaction();
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [detailsSidebarOpen, setDetailsSidebarOpen] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [hoveredMessage, setHoveredMessage] = useState<string | null>(null);
  const [isLargeScreen, setIsLargeScreen] = useState(false);
  const [messageInput, setMessageInput] = useState("");
  
  // Audio Player State
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [audioProgress, setAudioProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const currentContact = conversation?.client || conversation?.attendant;
  const currentConversation = conversations?.find(c => c.id === conversationId);

  // Expandir sidebar direita automaticamente em telas grandes
  useEffect(() => {
    const handleResize = () => {
      const largeScreen = window.matchMedia('(min-width: 1024px)').matches;
      setIsLargeScreen(largeScreen);
      if (largeScreen && isChatOpen) {
        setDetailsSidebarOpen(true);
      } else if (!largeScreen) {
        setDetailsSidebarOpen(false);
      }
    };

    // Verificar na montagem
    handleResize();

    // Adicionar listener para mudanças de tamanho
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isChatOpen]);

  useEffect(() => {
    // Scroll to bottom when entering a conversation or when messages update
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
      }
    }, 100);
  }, [conversationId]);

  useEffect(() => {
    // Smooth scroll when messages update
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages.length]);

  const togglePlay = (msg: MessageWithDetails) => {
    if (!msg.mediaUrl) return;

    if (playingId === msg.id) {
      audioRef.current?.pause();
      setPlayingId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setPlayingId(msg.id);
      setAudioProgress(0);
      
      const audio = new Audio(msg.mediaUrl);
      audioRef.current = audio;
      
      audio.addEventListener('timeupdate', () => {
        if (audio.duration) {
          setAudioProgress((audio.currentTime / audio.duration) * 100);
        }
      });
      
      audio.addEventListener('ended', () => {
        setPlayingId(null);
        setAudioProgress(0);
      });
      
      audio.play().catch(e => console.log("Playback error", e));
    }
  };

  const exportConversationFull = async () => {
    if (!conversation || !currentContact) return;

    const conversationInfo = {
      id: conversationId,
      protocol: conversation.protocol,
      channel: conversation.channel || "webchat",
      client: {
        id: currentContact.id,
        name: currentContact.displayName,
        avatar: currentContact.avatarUrl,
        ip: conversation.clientIp,
        location: conversation.clientLocation,
      },
      attendant: conversation.attendant ? {
        id: conversation.attendant.id,
        name: conversation.attendant.displayName,
        avatar: conversation.attendant.avatarUrl,
      } : null,
      status: conversation.status,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
    };

    // Função auxiliar para converter arquivo para base64
    const fileToBase64 = async (url: string): Promise<{ mime: string; data: string } | null> => {
      try {
        const response = await fetch(url);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64data = reader.result as string;
            const base64 = base64data.split(',')[1]; // Remove o prefixo "data:mime;base64,"
            resolve({
              mime: blob.type,
              data: base64
            });
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } catch (error) {
        console.error('Error converting file to base64:', error);
        return null;
      }
    };

    // Processar mensagens para converter arquivos para base64
    const processedMessages = await Promise.all(
      messages.map(async (msg) => {
        const sender = msg.sender || (msg.senderId === user?.id ? user : currentContact);

        const processedMsg: any = {
          id: msg.id,
          conversationId: msg.conversationId,
          senderId: msg.senderId,
          sender: sender ? {
            id: sender.id,
            name: sender.displayName,
            role: sender.role,
          } : null,
          content: msg.content,
          time: format(new Date(msg.createdAt), "HH:mm"),
          date: format(new Date(msg.createdAt), "dd/MM/yyyy"),
          type: msg.type,
          deleted: msg.deleted || false,
        };

        // Adicionar campos opcionais apenas se existirem
        if (msg.duration) processedMsg.duration = msg.duration;
        if (msg.caption) processedMsg.caption = msg.caption;
        if (msg.recorded !== undefined) processedMsg.recorded = msg.recorded;
        if (msg.forwarded !== undefined) processedMsg.forwarded = msg.forwarded;
        if (msg.replyToId !== undefined) processedMsg.replyTo = msg.replyToId;
        if (msg.reactions) processedMsg.reactions = msg.reactions;

        // Converter mediaUrl para base64 se existir
        if (msg.mediaUrl && msg.mediaUrl !== '#') {
          const fileData = await fileToBase64(msg.mediaUrl);
          if (fileData) {
            processedMsg.mediaUrl = fileData;
          }
        }

        // Processar metadata (converter cover para base64 se existir)
        if (msg.metadata?.audio_tags) {
          const coverData = msg.metadata.audio_tags.cover 
            ? await fileToBase64(msg.metadata.audio_tags.cover)
            : null;

          processedMsg.metadata = {
            audio_tags: {
              title: msg.metadata.audio_tags.title,
              artist: msg.metadata.audio_tags.artist,
              album: msg.metadata.audio_tags.album,
              year: msg.metadata.audio_tags.year,
              cover: coverData
            }
          };
        }

        // Adicionar informações do arquivo se existirem
        if (msg.metadata?.file) {
          if (!processedMsg.metadata) processedMsg.metadata = {};
          processedMsg.metadata.file = msg.metadata.file;
        }

        return processedMsg;
      })
    );

    const conversationData = {
      id: conversationInfo.id,
      protocol: conversationInfo.protocol,
      channel: conversationInfo.channel,
      client: conversationInfo.client,
      status: conversationInfo.status,
      createdAt: conversationInfo.createdAt,
      updatedAt: conversationInfo.updatedAt,
      messages: processedMessages,
      exportedAt: new Date().toISOString(),
    };
    
    const jsonStr = JSON.stringify(conversationData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `conversation-${currentContact?.displayName}-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportConversation = async () => {
    if (!conversation || !currentContact) return;

    const conversationInfo = {
      id: conversationId,
      protocol: conversation.protocol,
      channel: conversation.channel || "webchat",
      client: {
        id: currentContact.id,
        name: currentContact.displayName,
        avatar: currentContact.avatarUrl,
      },
      attendant: conversation.attendant ? {
        id: conversation.attendant.id,
        name: conversation.attendant.displayName,
        avatar: conversation.attendant.avatarUrl,
      } : null,
      status: conversation.status,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
    };

    // Processar mensagens mantendo URLs públicas
    const processedMessages = messages.map((msg) => {
      const sender = msg.sender || (msg.senderId === user?.id ? user : currentContact);

      const processedMsg: any = {
        id: msg.id,
        conversationId: msg.conversationId,
        senderId: msg.senderId,
        sender: sender ? {
          id: sender.id,
          name: sender.displayName,
          role: sender.role,
        } : null,
        content: msg.content,
        time: format(new Date(msg.createdAt), "HH:mm"),
        date: format(new Date(msg.createdAt), "dd/MM/yyyy"),
        type: msg.type,
        deleted: msg.deleted || false,
      };

      // Adicionar campos opcionais apenas se existirem
      if (msg.duration) processedMsg.duration = msg.duration;
      if (msg.caption) processedMsg.caption = msg.caption;
      if (msg.recorded !== undefined) processedMsg.recorded = msg.recorded;
      if (msg.forwarded !== undefined) processedMsg.forwarded = msg.forwarded;
      if (msg.replyToId !== undefined) processedMsg.replyTo = msg.replyToId;
      if (msg.reactions) processedMsg.reactions = msg.reactions;

      // Manter URL pública do mediaUrl
      if (msg.mediaUrl && msg.mediaUrl !== '#') {
        processedMsg.mediaUrl = msg.mediaUrl;
      }

      // Processar metadata mantendo URL pública do cover
      if (msg.metadata?.audio_tags) {
        processedMsg.metadata = {
          audio_tags: {
            title: msg.metadata.audio_tags.title,
            artist: msg.metadata.audio_tags.artist,
            album: msg.metadata.audio_tags.album,
            year: msg.metadata.audio_tags.year,
            cover: msg.metadata.audio_tags.cover
          }
        };
      }

      // Adicionar informações do arquivo se existirem
      if (msg.metadata?.file) {
        if (!processedMsg.metadata) processedMsg.metadata = {};
        processedMsg.metadata.file = msg.metadata.file;
      }

      return processedMsg;
    });

    const conversationData = {
      id: conversationInfo.id,
      protocol: conversationInfo.protocol,
      channel: conversationInfo.channel,
      client: conversationInfo.client,
      status: conversationInfo.status,
      createdAt: conversationInfo.createdAt,
      updatedAt: conversationInfo.updatedAt,
      messages: processedMessages,
      exportedAt: new Date().toISOString(),
    };
    
    const jsonStr = JSON.stringify(conversationData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `conversation-${currentContact?.displayName}-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const scrollToMessage = (messageId: string) => {
    const element = document.getElementById(`message-${messageId}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      element.classList.add("bg-accent/50");
      setTimeout(() => element.classList.remove("bg-accent/50"), 1000);
    }
  };

  const getReplyMessage = (replyId: string) => {
    return messages.find(m => m.id === replyId);
  };

  const handleDeleteMessage = (messageId: string) => {
    if (!conversationId) return;
    deleteMessageMutation.mutate({ messageId, conversationId });
  };

  const handleReactToMessage = (messageId: string, emoji: string) => {
    if (!conversationId) return;
    addReactionMutation.mutate({ messageId, conversationId, emoji });
  };

  const handleForwardMessage = (messageId: string) => {
    const msg = messages.find(m => m.id === messageId);
    if (msg && conversationId) {
      sendMessageMutation.mutate({
        conversationId,
        data: {
          content: msg.content,
          type: msg.type,
          mediaUrl: msg.mediaUrl || undefined,
          forwarded: true,
        },
      });
    }
  };

  const handleSendMessage = () => {
    if (!messageInput.trim() || !conversationId) return;
    
    sendMessageMutation.mutate({
      conversationId,
      data: {
        content: messageInput,
        type: "text",
        replyToId: replyingTo || undefined,
      },
    }, {
      onSuccess: () => {
        setMessageInput("");
        setReplyingTo(null);
      },
    });
  };

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    if (isToday(date)) {
      return format(date, "HH:mm");
    } else if (isYesterday(date)) {
      return "Ontem";
    } else {
      return format(date, "dd/MM");
    }
  };

  return (
    <MainLayout>
      <div className="flex h-[calc(100vh-5.50rem)] overflow-hidden">
        {/* Contacts List */}
        <Card className={cn(
          "flex flex-col h-full border-0 bg-card/50 backdrop-blur shrink-0 transition-all duration-300 relative rounded-none",
          isChatOpen ? "hidden lg:flex" : "flex w-full",
          sidebarCollapsed ? "lg:w-20" : "lg:w-80"
        )}>
          <div className="h-16 px-4 flex items-center shrink-0">
            <div className="flex items-center gap-2 w-full">
              {!sidebarCollapsed && (
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Buscar conversas..." className="pl-9 bg-background/50" data-testid="input-search-conversations" />
                </div>
              )}
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className={cn("shrink-0", sidebarCollapsed && "mx-auto")}
                data-testid="button-toggle-sidebar"
              >
                {sidebarCollapsed ? <PanelLeft className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
              </Button>
            </div>
          </div>
          <ScrollArea className="flex-1">
            {loadingConversations ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : conversations && conversations.length > 0 ? (
              <div className="space-y-1 p-2">
                {conversations.map((conv) => {
                  const contact = user?.id === conv.clientId ? conv.attendant : conv.client;
                  const displayName = contact?.displayName || "Sem nome";
                  const avatarUrl = contact?.avatarUrl || `https://i.pravatar.cc/150?u=${contact?.id}`;
                  
                  return (
                    <Link key={conv.id} href={`/conversations/webchat/${conv.id}`}>
                      <div 
                        className={cn(
                          "w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors text-left group cursor-pointer",
                          conversationId === conv.id ? "bg-accent/60" : "",
                          sidebarCollapsed && "justify-center"
                        )}
                        data-testid={`link-contact-${conv.id}`}
                      >
                        <div className="relative shrink-0">
                          <Avatar>
                            <AvatarImage src={avatarUrl} />
                            <AvatarFallback>{displayName.substring(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          {conv.status === "active" && (
                            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-card" />
                          )}
                          {conv.unreadCount > 0 && sidebarCollapsed && (
                            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground font-bold">
                              {conv.unreadCount}
                            </span>
                          )}
                        </div>
                        {!sidebarCollapsed && (
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium truncate">{displayName}</span>
                              <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                                {conv.lastMessage ? formatMessageTime(conv.lastMessage.createdAt) : ""}
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-sm text-muted-foreground truncate group-hover:text-foreground transition-colors">
                                {conv.lastMessage?.content || "Sem mensagens"}
                              </span>
                              {conv.unreadCount > 0 && (
                                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground font-bold">
                                  {conv.unreadCount}
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <MessageSquare className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-sm text-muted-foreground">Nenhuma conversa disponível</p>
              </div>
            )}
          </ScrollArea>
        </Card>

        {/* Chat Area */}
        <Card className={cn(
          "flex-1 flex-col h-full border-0 bg-card/50 backdrop-blur overflow-hidden rounded-none",
          !isChatOpen ? "hidden md:flex" : "flex"
        )}>
          {isChatOpen ? (
            <>
              {/* Chat Header */}
              <div className="h-16 px-4 flex items-center justify-between bg-card/30 shrink-0">
                <div className="flex items-center gap-3">
                  <Link href="/conversations">
                    <Button variant="ghost" size="icon" className="md:hidden" data-testid="button-back">
                      <ArrowLeft className="h-5 w-5" />
                    </Button>
                  </Link>
                  {currentContact ? (
                    <>
                      <Avatar>
                        <AvatarImage src={currentContact.avatarUrl || `https://i.pravatar.cc/150?u=${currentContact.id}`} />
                        <AvatarFallback>{currentContact.displayName.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold">{currentContact.displayName}</h3>
                        <p className={cn(
                          "text-xs flex items-center gap-1",
                          conversation?.status === "active" ? "text-green-500" : "text-muted-foreground"
                        )}>
                          <span className={cn("h-1.5 w-1.5 rounded-full", conversation?.status === "active" ? "bg-green-500" : "bg-slate-400")} /> 
                          {conversation?.status === "active" ? "Ativo" : conversation?.status === "waiting" ? "Aguardando" : "Fechado"}
                        </p>
                      </div>
                    </>
                  ) : conversation ? (
                    <>
                      <Avatar>
                        <AvatarFallback>...</AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold">Carregando...</h3>
                        <p className="text-xs text-muted-foreground">
                          Protocolo: {conversation.protocol}
                        </p>
                      </div>
                    </>
                  ) : null}
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" data-testid="button-call"><Phone className="h-5 w-5" /></Button>
                  <Button variant="ghost" size="icon" data-testid="button-video"><Video className="h-5 w-5" /></Button>
                  <Separator orientation="vertical" className="h-6 mx-1" />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" data-testid="button-more">
                        <MoreVertical className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {import.meta.env.DEV && (
                        <>
                          <DropdownMenuItem onClick={exportConversationFull}>
                            <File className="mr-2 h-4 w-4" />
                            Exportar Dados
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={exportConversation}>
                            <File className="mr-2 h-4 w-4" />
                            Exportar Conversa
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setDetailsSidebarOpen(!detailsSidebarOpen)}
                    data-testid="button-toggle-details"
                    title={detailsSidebarOpen ? "Ocultar detalhes" : "Mostrar detalhes"}
                  >
                    {detailsSidebarOpen ? <PanelLeft className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
                  </Button>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4 bg-card/50 backdrop-blur">
                {loadingMessages ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <MessageSquare className="h-16 w-16 mb-4 opacity-50" />
                    <p>Nenhuma mensagem ainda</p>
                    <p className="text-sm">Envie a primeira mensagem!</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {messages.map((msg, index) => {
                      const replyMsg = msg.replyToId ? getReplyMessage(msg.replyToId) : null;
                      const isMyMessage = msg.senderId === user?.id;
                    
                      if (msg.deleted) {
                        return (
                          <div key={msg.id} id={`message-${msg.id}`} className={`flex ${isMyMessage ? "justify-end" : "justify-start"} transition-colors duration-500 rounded-lg p-1`}>
                            <div className={cn(
                              "flex flex-col gap-2 max-w-[85%] md:max-w-[70%]"
                            )}>
                              {/* Preview da mensagem original com efeito de citação */}
                              {replyMsg && (
                                <div 
                                  className={cn(
                                    "p-2.5 rounded-lg text-xs cursor-pointer border-l-4 backdrop-blur-md hover:bg-black/20 transition-colors",
                                    isMyMessage 
                                      ? "bg-black/15 border-white/30" 
                                      : "bg-black/10 border-white/30"
                                  )}
                                  onClick={() => scrollToMessage(replyMsg.id)}
                                >
                                  <div className="flex items-center gap-1.5 mb-1 opacity-80">
                                    <Quote className="h-3 w-3 shrink-0" />
                                    <span className="font-semibold truncate">
                                      {replyMsg.senderId === user?.id ? "Você" : replyMsg.sender?.displayName}
                                    </span>
                                  </div>
                                  <p className="truncate opacity-70 text-[11px]">
                                    {replyMsg.content || (replyMsg.type === 'image' ? '📷 Imagem' : replyMsg.type === 'audio' ? '🎵 Áudio' : replyMsg.type === 'video' ? '🎬 Vídeo' : '📎 Arquivo')}
                                  </p>
                                </div>
                              )}
                              
                              {/* Mensagem apagada com efeito muted */}
                              <div className={cn(
                                "flex items-start gap-2 p-3 rounded-lg border backdrop-blur-md shadow-lg opacity-60",
                                isMyMessage
                                  ? "bg-black/20 border-white/5"
                                  : "bg-black/15 border-white/5"
                              )}>
                                <Trash2 className="h-4 w-4 text-muted-foreground/70 shrink-0 mt-0.5" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-semibold mb-1 text-muted-foreground/80">
                                    {isMyMessage ? "Você" : msg.sender?.displayName}
                                  </p>
                                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground/70 italic">
                                    <span>Mensagem apagada</span>
                                  </div>
                                  <p className="text-[10px] text-muted-foreground/60 mt-1">
                                    {format(new Date(msg.createdAt), "HH:mm")}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={msg.id}
                          id={`message-${msg.id}`}
                          className={`flex ${isMyMessage ? "justify-end" : "justify-start"} transition-colors duration-500 rounded-lg p-1 group/message`}
                          data-testid={`message-${msg.id}`}
                          onMouseEnter={() => setHoveredMessage(msg.id)}
                          onMouseLeave={() => setHoveredMessage(null)}
                        >
                        <div className="flex items-start gap-2 max-w-[85%] md:max-w-[70%]">
                          <div className="flex flex-col flex-1 relative">

                              <div
                                className={cn(
                                  "relative rounded-2xl px-4 py-2.5 shadow-lg overflow-hidden backdrop-blur-md",
                                  isMyMessage
                                    ? "bg-black/40 border border-white/10 text-white rounded-br-none after:content-[''] after:absolute after:bottom-0 after:right-[-8px] after:w-0 after:h-0 after:border-l-[8px] after:border-l-black/40 after:border-b-[8px] after:border-b-transparent after:border-t-[8px] after:border-t-transparent"
                                    : "bg-black/30 border border-white/10 text-white rounded-bl-none before:content-[''] before:absolute before:bottom-0 before:left-[-8px] before:w-0 before:h-0 before:border-r-[8px] before:border-r-black/30 before:border-b-[8px] before:border-b-transparent before:border-t-[8px] before:border-t-transparent"
                                )}
                              >
                            {/* Reply Preview with optional forwarded indicator */}
                            {replyMsg && (
                              <div 
                                className={cn(
                                  "mb-2 p-2 rounded text-xs cursor-pointer border-l-4 relative overflow-hidden group",
                                  msg.senderId === user?.id 
                                    ? "bg-black/20 border-white/50 hover:bg-black/30" 
                                    : "bg-black/20 border-white/50 hover:bg-black/30"
                                )}
                                onClick={() => scrollToMessage(replyMsg.id)}
                              >
                                <div className="font-semibold mb-0.5 flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-1 flex-1 min-w-0">
                                    <Quote className="h-3 w-3 shrink-0" />
                                    <span className="truncate">{replyMsg.senderId === user?.id ? "Você" : replyMsg.sender?.displayName || currentContact?.displayName}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-[10px] opacity-70 shrink-0">
                                    {msg.forwarded && (
                                      <div className="flex items-center gap-0.5">
                                        <CornerDownRight className="h-2.5 w-2.5" />
                                        <span>Encaminhada</span>
                                      </div>
                                    )}
                                    <div className="flex items-center gap-0.5">
                                      <Quote className="h-2.5 w-2.5" />
                                      <span>Resposta</span>
                                    </div>
                                  </div>
                                </div>
                                <p className="truncate opacity-90">
                                  {replyMsg.deleted ? (
                                    <span className="italic flex items-center gap-1">
                                      <Trash2 className="h-2.5 w-2.5" />
                                      Mensagem apagada
                                    </span>
                                  ) : (
                                    replyMsg.content || (replyMsg.type === 'image' ? 'Imagem' : replyMsg.type === 'audio' ? 'Áudio' : replyMsg.type === 'video' ? 'Vídeo' : 'Arquivo')
                                  )}
                                </p>
                              </div>
                            )}
                            
                            {/* Forwarded indicator in message header (only when no reply) */}
                            {msg.forwarded && !msg.replyToId && (
                              <div className="mb-2 flex items-center justify-end gap-1 text-[10px] opacity-70">
                                <CornerDownRight className="h-2.5 w-2.5" />
                                <span>Encaminhada</span>
                              </div>
                            )}

                            {/* Message Content Based on Type */}
                            
                            {msg.type === 'text' && (
                              <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                            )}

                            {msg.type === 'image' && (
                              <div className="space-y-2">
                                <img 
                                  src={msg.mediaUrl || undefined} 
                                  alt="Imagem enviada" 
                                  className="rounded-lg max-h-[300px] w-full object-cover cursor-pointer hover:opacity-95 transition-opacity" 
                                  data-testid={`img-message-${msg.id}`}
                                />
                                {msg.caption && <p className="text-sm">{msg.caption}</p>}
                              </div>
                            )}

                            {msg.type === 'video' && (
                              <div className="space-y-2 min-w-[250px]">
                                <CustomVideoPlayer 
                                  src={msg.mediaUrl!} 
                                  poster={msg.recorded ? undefined : "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=500&auto=format&fit=crop&q=60"}
                                  recorded={msg.recorded}
                                />
                                {(msg.caption || !msg.recorded) && <p className="text-sm flex items-center gap-1"><Film className="h-3 w-3" /> {msg.caption || "Vídeo"}</p>}
                              </div>
                            )}

                            {msg.type === 'audio' && (
                              <div className="min-w-[280px]">
                                {msg.metadata?.audio_tags ? (
                                  <div className="flex gap-3 items-start bg-black/20 p-3 rounded-lg mb-2">
                                    <div className="h-16 w-16 rounded-lg bg-muted flex items-center justify-center overflow-hidden shrink-0 shadow-lg">
                                      {msg.metadata.audio_tags.cover ? (
                                        <img src={msg.metadata.audio_tags.cover} alt="Cover" className="h-full w-full object-cover" />
                                      ) : (
                                        <Music className="h-8 w-8 opacity-50" />
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="font-semibold text-sm truncate">{msg.metadata.audio_tags.title}</p>
                                      <p className="text-xs opacity-70 truncate">{msg.metadata.audio_tags.artist}</p>
                                      {msg.metadata.audio_tags.album && (
                                        <p className="text-xs opacity-60 truncate mt-0.5 italic">
                                          {msg.metadata.audio_tags.album}
                                          {msg.metadata.audio_tags.year && ` (${msg.metadata.audio_tags.year})`}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                ) : msg.recorded ? (
                                  <div className="flex items-center gap-2 mb-2 bg-black/20 p-2 rounded-lg">
                                    <Mic className="h-4 w-4 opacity-80" />
                                    <span className="text-xs font-medium opacity-90">Mensagem de Voz</span>
                                  </div>
                                ) : (
                                  <div className="flex gap-3 items-center bg-black/20 p-2 rounded-lg mb-2">
                                     <div className="h-12 w-12 rounded bg-white/10 flex items-center justify-center shrink-0">
                                       <Disc className="h-6 w-6 opacity-80" />
                                     </div>
                                     <div className="flex-1 min-w-0">
                                       <p className="text-sm truncate font-medium">{msg.caption || "Arquivo de Áudio"}</p>
                                       <p className="text-[10px] opacity-70">MP3</p>
                                     </div>
                                  </div>
                                )}

                                <div className="flex items-center gap-3 mt-1">
                                  <Button 
                                    size="icon" 
                                    className="h-10 w-10 rounded-full shrink-0 bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/50 text-white"
                                    onClick={() => togglePlay(msg)}
                                    data-testid={`button-play-audio-${msg.id}`}
                                  >
                                    {playingId === msg.id ? <Pause className="h-5 w-5 fill-current" /> : <Play className="h-5 w-5 fill-current" />}
                                  </Button>
                                  <div className="flex-1 space-y-1">
                                    <div className="relative h-1 bg-white/20 rounded-full overflow-hidden cursor-pointer"
                                      onClick={(e) => {
                                        if (playingId === msg.id && audioRef.current && audioRef.current.duration) {
                                          const rect = e.currentTarget.getBoundingClientRect();
                                          const percent = ((e.clientX - rect.left) / rect.width) * 100;
                                          audioRef.current.currentTime = (percent / 100) * audioRef.current.duration;
                                          setAudioProgress(percent);
                                        }
                                      }}
                                    >
                                      <div 
                                        className="absolute inset-y-0 left-0 bg-blue-500 rounded-full transition-all"
                                        style={{ width: `${playingId === msg.id ? audioProgress : 0}%` }}
                                      />
                                    </div>
                                    <div className="flex justify-between text-[10px] opacity-70 font-mono">
                                      <span>{playingId === msg.id && audioRef.current ? formatTime(audioRef.current.currentTime) : "0:00"}</span>
                                      <span>{msg.duration}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Footer with actions on left and time on right */}
                            <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-white/5">
                              {/* Action Buttons on Left */}
                              <div className="flex items-center gap-1 opacity-0 group-hover/message:opacity-100 transition-opacity">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 hover:bg-white/10"
                                  onClick={() => setReplyingTo(msg.id)}
                                  data-testid={`button-reply-${msg.id}`}
                                  title="Responder"
                                >
                                  <Reply className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 hover:bg-white/10"
                                  onClick={() => handleForwardMessage(msg.id)}
                                  data-testid={`button-forward-${msg.id}`}
                                  title="Encaminhar"
                                >
                                  <Forward className="h-3.5 w-3.5" />
                                </Button>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6 hover:bg-white/10"
                                      data-testid={`button-emoji-${msg.id}`}
                                      title="Reagir"
                                    >
                                      <Smile className="h-3.5 w-3.5" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="start" className="w-auto p-2">
                                    <div className="grid grid-cols-5 gap-1">
                                      {EMOJI_LIST.slice(0, 10).map((emoji) => (
                                        <Button
                                          key={emoji}
                                          variant="ghost"
                                          size="icon"
                                          className="h-8 w-8 text-lg hover:bg-accent"
                                          onClick={() => handleReactToMessage(msg.id, emoji)}
                                          data-testid={`emoji-${emoji}-${msg.id}`}
                                        >
                                          {emoji}
                                        </Button>
                                      ))}
                                    </div>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 hover:bg-white/10 text-red-400 hover:text-red-500"
                                  onClick={() => handleDeleteMessage(msg.id)}
                                  data-testid={`button-delete-${msg.id}`}
                                  title="Apagar"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>

                                {/* Time on Right */}
                                <div className="flex items-center gap-1 opacity-70 text-[10px] ml-auto">
                                  <span>{format(new Date(msg.createdAt), "HH:mm")}</span>
                                  {isMyMessage && (
                                    <span className="text-blue-300">✓✓</span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Reactions */}
                            {msg.reactions && msg.reactions.length > 0 && (
                              <div className={cn(
                                "flex flex-wrap gap-1 mt-1",
                                isMyMessage ? "justify-end" : "justify-start"
                              )}>
                              {msg.reactions.map((reaction, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center gap-1 bg-card/90 border border-border rounded-full px-2 py-0.5 text-xs"
                                >
                                  <span>{reaction.emoji}</span>
                                  <span className="text-[10px] text-muted-foreground">{reaction.count}</span>
                                </div>
                              ))}
                            </div>
                            )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={scrollRef} />
                  </div>
                )}
              </ScrollArea>

              {/* Input Area */}
              <div className="p-4 bg-card/30 border-t border-border shrink-0">
                <div className="flex items-center gap-2">
                  <div className="flex-1 relative bg-background/50 rounded-lg flex items-center px-3 py-2">
                    <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground shrink-0" data-testid="button-emoji">
                      <Smile className="h-5 w-5" />
                    </Button>
                    <Input 
                      placeholder="Digite uma mensagem..." 
                      className="flex-1 bg-transparent border-0 focus-visible:ring-0 px-2"
                      data-testid="input-message"
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                    />
                    <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground shrink-0" data-testid="button-attach">
                      <Paperclip className="h-5 w-5" />
                    </Button>
                  </div>
                  <Button 
                    size="icon" 
                    className="h-12 w-12 rounded-full shadow-lg hover-elevate active-elevate-2 shrink-0" 
                    data-testid="button-send"
                    onClick={handleSendMessage}
                    disabled={!messageInput.trim() || sendMessageMutation.isPending}
                  >
                    {sendMessageMutation.isPending ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      <Send className="h-6 w-6" />
                    )}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8 text-center bg-card/20">
              <div className="h-24 w-24 rounded-full bg-accent/20 flex items-center justify-center mb-6">
                <MessageSquare className="h-10 w-10 opacity-50" />
              </div>
              <h2 className="text-xl font-semibold mb-2 text-foreground">WebChat for Business</h2>
              <p className="max-w-md text-sm mb-8">
                Selecione uma conversa para começar a atender. O histórico de mensagens será carregado aqui.
              </p>
              <div className="flex items-center gap-2 text-xs opacity-50">
                <LockIcon className="h-3 w-3" />
                Mensagens protegidas com criptografia de ponta a ponta
              </div>
            </div>
          )}
        </Card>

        {/* Details Sidebar - Sheet for mobile, Card for desktop */}
        {isChatOpen && (
          <>
            {/* Mobile Sheet - Only render on small/medium screens */}
            {!isLargeScreen && (
              <Sheet open={detailsSidebarOpen} onOpenChange={setDetailsSidebarOpen}>
                <SheetContent side="right" className="w-80 p-0">
                  <SheetHeader className="p-4 border-b border-border">
                    <SheetTitle>Detalhes da Conversa</SheetTitle>
                  </SheetHeader>
                  <ScrollArea className="h-[calc(100vh-5rem)]">
                    <ConversationDetailsContent conversation={conversation!} />
                  </ScrollArea>
                </SheetContent>
              </Sheet>
            )}

            {/* Desktop Card - Only render on large screens */}
            {isLargeScreen && (
              <Card className={cn(
                "flex flex-col h-full border-0 bg-card/50 backdrop-blur shrink-0 transition-all duration-300 overflow-hidden rounded-none",
                detailsSidebarOpen ? "w-80" : "w-0"
              )}>
                {detailsSidebarOpen && (
                  <>
                    <div className="h-16 px-4 bg-card/30 shrink-0 flex items-center justify-between">
                      <h3 className="font-semibold">Detalhes da Conversa</h3>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => setDetailsSidebarOpen(false)}
                        className="h-8 w-8"
                        data-testid="button-close-details"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <ScrollArea className="flex-1">
                      <ConversationDetailsContent conversation={conversation!} />
                    </ScrollArea>
                  </>
                )}
              </Card>
            )}
          </>
        )}
      </div>
    </MainLayout>
  );
}

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

function LockIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}
