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
import { Slider } from "@/components/ui/slider";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

// Assets
import mp3File from "@assets/13. Behind Enemy Lines_1763919687567.mp3";
import videoFile from "@assets/9312ac4fd6cf30b9cabb0eb07b5bc517_1763919709453.mp4";
import mp3File1 from "@assets/01. Here We Go Again_1763921733934.mp3";
import mp3File2 from "@assets/05. Demi Lovato & Joe Jonas - Wouldn't Change A Thing_1763921733934.mp3";
import mp3File3 from "@assets/10. Give Your Heart A Break_1763921733934.mp3";
import mp3File4 from "@assets/12. Back Around_1763921733934.mp3";

interface Message {
  id: number;
  conversationId: number;
  sender: string;
  content: string;
  time: string;
  type: 'text' | 'image' | 'video' | 'audio';
  mediaUrl?: string;
  duration?: string;
  caption?: string;
  recorded?: boolean;
  forwarded?: boolean;
  deleted?: boolean;
  replyTo?: number;
  reactions?: { emoji: string; count: number }[];
  metadata?: {
    title: string;
    artist: string;
    cover: string | null;
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
  { id: 1, conversationId: 1, sender: "me", content: "Oi Ana, tudo bem?", time: "10:30", type: "text", reactions: [{ emoji: "👋", count: 1 }] },
  { id: 2, conversationId: 1, sender: "other", content: "Oii! Tudo ótimo por aqui e com você?", time: "10:32", type: "text" },
  { id: 3, conversationId: 1, sender: "me", content: "Tudo certo. Viu o projeto novo?", time: "10:33", type: "text" },
  { id: 4, conversationId: 1, sender: "other", content: "Sim! Ficou incrível o design.", time: "10:35", type: "text", reactions: [{ emoji: "❤️", count: 2 }, { emoji: "👍", count: 1 }] },
  { id: 5, conversationId: 1, sender: "other", content: "Acho que só precisamos ajustar aquele detalhe no header.", time: "10:35", replyTo: 3, type: "text" },
  { id: 6, conversationId: 1, sender: "me", content: "Verdade. Vou mexer nisso agora.", time: "10:40", replyTo: 5, type: "text" },
  { id: 7, conversationId: 1, sender: "other", content: "Combinado! Até logo.", time: "10:42", type: "text" },
  { id: 8, conversationId: 1, sender: "other", content: "Encaminhando o orçamento que você pediu.", time: "10:45", forwarded: true, type: "text" },
  { id: 9, conversationId: 1, sender: "me", content: "Mensagem apagada", time: "10:46", deleted: true, type: "text" },
  { id: 20, conversationId: 1, sender: "other", content: "Desculpa, não vi essa mensagem!", time: "10:47", replyTo: 9, type: "text" },
  
  // Image Message
  { id: 10, conversationId: 1, sender: "other", content: "", time: "10:48", type: "image", mediaUrl: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OHx8d29ya3xlbnwwfHwwfHx8MA%3D%3D", caption: "Olha essa referência" },
  
  // Recorded Audio
  { id: 11, conversationId: 1, sender: "me", content: "", time: "10:50", type: "audio", duration: "0:15", recorded: true },
  
  // Recorded Video
  { id: 12, conversationId: 1, sender: "other", content: "", time: "10:52", type: "video", mediaUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4", duration: "0:30", recorded: true },
  
  // Uploaded Video (The one provided)
  { id: 13, conversationId: 1, sender: "me", content: "", time: "10:55", type: "video", mediaUrl: videoFile, duration: "0:12", caption: "Vídeo do projeto finalizado" },
  
  // Uploaded MP3 with ID3 (The one provided)
  { 
    id: 14, 
    conversationId: 1, 
    sender: "other", 
    content: "", 
    time: "10:58", 
    type: "audio", 
    mediaUrl: mp3File, 
    duration: "3:42",
    metadata: null
  },
  
  // Uploaded MP3 without ID3
  { id: 15, conversationId: 1, sender: "me", content: "", time: "11:00", type: "audio", mediaUrl: "#", duration: "2:15", caption: "Audio_sem_tags.mp3" },

  // New uploaded audio files
  { 
    id: 16, 
    conversationId: 1, 
    sender: "other", 
    content: "", 
    time: "11:02", 
    type: "audio", 
    mediaUrl: mp3File1, 
    duration: "3:48",
    metadata: null
  },
  { 
    id: 17, 
    conversationId: 1, 
    sender: "me", 
    content: "", 
    time: "11:05", 
    type: "audio", 
    mediaUrl: mp3File2, 
    duration: "3:28",
    metadata: null
  },
  { 
    id: 18, 
    conversationId: 1, 
    sender: "other", 
    content: "", 
    time: "11:08", 
    type: "audio", 
    mediaUrl: mp3File3, 
    duration: "3:27",
    metadata: null
  },
  { 
    id: 19, 
    conversationId: 1, 
    sender: "me", 
    content: "", 
    time: "11:10", 
    type: "audio", 
    mediaUrl: mp3File4, 
    duration: "3:12",
    metadata: null
  },

  { id: 101, conversationId: 2, sender: "other", content: "Você viu o novo layout?", time: "Ontem", type: "text" },
  { id: 102, conversationId: 2, sender: "me", content: "Ainda não, vou olhar agora!", time: "Ontem", type: "text" },
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
function ConversationDetailsContent({ currentDetails }: { currentDetails: ConversationDetails }) {
  return (
    <div className="p-4 space-y-6">
      {/* Protocol and Date */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <Hash className="h-4 w-4 text-muted-foreground" />
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">Protocolo</p>
            <p className="font-mono font-medium">{currentDetails.protocol}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">Data/Hora</p>
            <p className="font-medium">{currentDetails.date}</p>
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
            <AvatarImage src={currentDetails.client.avatar} />
            <AvatarFallback>{currentDetails.client.name.substring(0, 2)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{currentDetails.client.name}</p>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <MapPin className="h-3 w-3" />
              <span className="truncate">{currentDetails.client.location}</span>
            </div>
          </div>
        </div>
        <div className="text-xs space-y-1">
          <p className="text-muted-foreground">IP: <span className="font-mono text-foreground">{currentDetails.client.ip}</span></p>
        </div>
      </div>

      <Separator />

      {/* Attendant Info */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold flex items-center gap-2">
          <User className="h-4 w-4" />
          Atendente
        </h4>
        <div className="flex items-center gap-3 p-3 bg-background/50 rounded-lg">
          <Avatar className="h-10 w-10">
            <AvatarImage src={currentDetails.attendant.avatar} />
            <AvatarFallback>{currentDetails.attendant.name.substring(0, 2)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{currentDetails.attendant.name}</p>
            <p className="text-xs text-muted-foreground">Atendente responsável</p>
          </div>
        </div>
      </div>

      <Separator />

      {/* Previous Conversations */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold">Conversas Anteriores</h4>
        <div className="space-y-2">
          {currentDetails.previousConversations.map((conv) => (
            <div 
              key={conv.id}
              className="p-3 bg-background/50 rounded-lg hover:bg-background/70 transition-colors cursor-pointer"
              data-testid={`previous-conversation-${conv.id}`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="font-mono text-xs text-muted-foreground">{conv.protocol}</span>
                <Badge 
                  variant={conv.status === 'completed' ? 'default' : conv.status === 'pending' ? 'secondary' : 'outline'}
                  className="text-[10px] h-5"
                >
                  {conv.status === 'completed' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                  {conv.status === 'pending' && <Loader2 className="h-3 w-3 mr-1" />}
                  {conv.status === 'closed' && <XCircle className="h-3 w-3 mr-1" />}
                  {conv.status === 'completed' ? 'Concluída' : conv.status === 'pending' ? 'Pendente' : 'Fechada'}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">{conv.date}</p>
              <p className="text-xs mt-1">Atendente: <span className="font-medium">{conv.attendant}</span></p>
            </div>
          ))}
        </div>
      </div>
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
  const conversationId = Number(params?.id);
  const currentContact = contacts.find(c => c.id === conversationId) || contacts[0];
  const currentDetails = conversationDetails[conversationId] || conversationDetails[1];
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [detailsSidebarOpen, setDetailsSidebarOpen] = useState(true);
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [hoveredMessage, setHoveredMessage] = useState<number | null>(null);
  
  // Audio Player State
  const [playingId, setPlayingId] = useState<number | null>(null);
  const [audioProgress, setAudioProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const filteredMessages = messages.filter(m => m.conversationId === (conversationId || 1));

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
  }, [filteredMessages.length]);

  // Fetch ID3 Tags for audio files
  useEffect(() => {
    const fetchID3Tags = async () => {
      const updatedMessages = [...messages];
      let hasUpdates = false;

      for (let i = 0; i < updatedMessages.length; i++) {
        const msg = updatedMessages[i];
        
        if (msg.type === 'audio' && msg.mediaUrl && !msg.metadata && !msg.recorded && msg.mediaUrl !== '#') {
          try {
            const response = await fetch(msg.mediaUrl);
            const blob = await response.blob();
            
            const tags = await readID3Tags(blob);
            if (tags) {
              updatedMessages[i] = {
                ...msg,
                metadata: tags
              };
              hasUpdates = true;
            }
          } catch (error) {
            console.log('Error reading ID3 tags:', error);
          }
        }
      }

      if (hasUpdates) {
        setMessages(updatedMessages);
      }
    };

    fetchID3Tags();
  }, []);

  const togglePlay = (msg: Message) => {
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

  const scrollToMessage = (messageId: number) => {
    const element = document.getElementById(`message-${messageId}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      element.classList.add("bg-accent/50");
      setTimeout(() => element.classList.remove("bg-accent/50"), 1000);
    }
  };

  const getReplyMessage = (replyId: number) => {
    return messages.find(m => m.id === replyId);
  };

  const handleDeleteMessage = (messageId: number) => {
    setMessages(messages.map(m => 
      m.id === messageId ? { ...m, deleted: true, content: "Mensagem apagada" } : m
    ));
  };

  const handleReactToMessage = (messageId: number, emoji: string) => {
    setMessages(messages.map(m => {
      if (m.id === messageId) {
        const reactions = m.reactions || [];
        const existingReaction = reactions.find(r => r.emoji === emoji);
        
        if (existingReaction) {
          return {
            ...m,
            reactions: reactions.map(r => 
              r.emoji === emoji ? { ...r, count: r.count + 1 } : r
            )
          };
        } else {
          return {
            ...m,
            reactions: [...reactions, { emoji, count: 1 }]
          };
        }
      }
      return m;
    }));
  };

  const handleForwardMessage = (messageId: number) => {
    const msg = messages.find(m => m.id === messageId);
    if (msg) {
      const newMessage: Message = {
        ...msg,
        id: Math.max(...messages.map(m => m.id)) + 1,
        sender: "me",
        forwarded: true,
        time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        reactions: undefined,
        replyTo: undefined
      };
      setMessages([...messages, newMessage]);
    }
  };

  return (
    <MainLayout>
      <div className="flex h-[calc(100vh-8rem)] gap-6 overflow-hidden">
        {/* Contacts List */}
        <Card className={cn(
          "flex flex-col h-full border-border/50 bg-card/50 backdrop-blur shrink-0 transition-all duration-300 relative",
          isChatOpen ? "hidden lg:flex" : "flex w-full",
          sidebarCollapsed ? "lg:w-20" : "lg:w-80"
        )}>
          <div className="p-4 space-y-4">
            <div className="flex items-center gap-2">
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
            <div className="space-y-1 p-2">
              {contacts.map((contact) => (
                <Link key={contact.id} href={`/conversations/webchat/${contact.id}`}>
                  <div 
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors text-left group cursor-pointer",
                      conversationId === contact.id ? "bg-accent/60" : "",
                      sidebarCollapsed && "justify-center"
                    )}
                    data-testid={`link-contact-${contact.id}`}
                  >
                    <div className="relative shrink-0">
                      <Avatar>
                        <AvatarImage src={contact.avatar} />
                        <AvatarFallback>{contact.name.substring(0, 2)}</AvatarFallback>
                      </Avatar>
                      {contact.status === "Online" && (
                        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-card" />
                      )}
                      {contact.unread > 0 && sidebarCollapsed && (
                        <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground font-bold">
                          {contact.unread}
                        </span>
                      )}
                    </div>
                    {!sidebarCollapsed && (
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium truncate">{contact.name}</span>
                          <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">{contact.time}</span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm text-muted-foreground truncate group-hover:text-foreground transition-colors">
                            {contact.lastMessage}
                          </span>
                          {contact.unread > 0 && (
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground font-bold">
                              {contact.unread}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </ScrollArea>
        </Card>

        {/* Chat Area */}
        <Card className={cn(
          "flex-1 flex-col h-full border-border/50 bg-card/50 backdrop-blur overflow-hidden",
          !isChatOpen ? "hidden md:flex" : "flex"
        )}>
          {isChatOpen ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-border flex items-center justify-between bg-card/30 shrink-0">
                <div className="flex items-center gap-3">
                  <Link href="/conversations">
                    <Button variant="ghost" size="icon" className="md:hidden" data-testid="button-back">
                      <ArrowLeft className="h-5 w-5" />
                    </Button>
                  </Link>
                  <Avatar>
                    <AvatarImage src={currentContact.avatar} />
                    <AvatarFallback>{currentContact.name.substring(0, 2)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">{currentContact.name}</h3>
                    <p className={cn(
                      "text-xs flex items-center gap-1",
                      currentContact.status === "Online" ? "text-green-500" : "text-muted-foreground"
                    )}>
                      <span className={cn("h-1.5 w-1.5 rounded-full", currentContact.status === "Online" ? "bg-green-500" : "bg-slate-400")} /> 
                      {currentContact.status}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" data-testid="button-call"><Phone className="h-5 w-5" /></Button>
                  <Button variant="ghost" size="icon" data-testid="button-video"><Video className="h-5 w-5" /></Button>
                  <Separator orientation="vertical" className="h-6 mx-1" />
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setDetailsSidebarOpen(!detailsSidebarOpen)}
                    data-testid="button-toggle-details"
                    title={detailsSidebarOpen ? "Ocultar detalhes" : "Mostrar detalhes"}
                  >
                    {detailsSidebarOpen ? <PanelLeft className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
                  </Button>
                  <Button variant="ghost" size="icon" data-testid="button-more"><MoreVertical className="h-5 w-5" /></Button>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4 bg-background/20">
                <div className="space-y-6">
                  {filteredMessages.map((msg, index) => {
                    const replyMsg = msg.replyTo ? getReplyMessage(msg.replyTo) : null;
                    
                    if (msg.deleted) {
                      return (
                        <div key={msg.id} id={`message-${msg.id}`} className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"} transition-colors duration-500 rounded-lg p-1`}>
                          <div className={cn(
                            "flex items-start gap-2 p-3 rounded-lg border max-w-[85%] md:max-w-[70%]",
                            msg.sender === "me"
                              ? "bg-slate-800/50 border-slate-700/50"
                              : "bg-slate-700/50 border-slate-600/50"
                          )}>
                            <Quote className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold mb-1">
                                {msg.sender === "me" ? "Você" : currentContact.name}
                              </p>
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground italic">
                                <Trash2 className="h-3 w-3 shrink-0" />
                                <span>Mensagem apagada</span>
                              </div>
                              <p className="text-[10px] text-muted-foreground mt-1">{msg.time}</p>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={msg.id}
                        id={`message-${msg.id}`}
                        className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"} transition-colors duration-500 rounded-lg p-1 group/message`}
                        data-testid={`message-${msg.id}`}
                        onMouseEnter={() => setHoveredMessage(msg.id)}
                        onMouseLeave={() => setHoveredMessage(null)}
                      >
                        <div className="flex items-start gap-2 max-w-[85%] md:max-w-[70%]">
                          <div className="flex flex-col flex-1 relative">

                            <div
                              className={cn(
                                "relative rounded-2xl px-4 py-2.5 shadow-sm overflow-hidden",
                                msg.sender === "me"
                                  ? "bg-slate-800/90 text-white rounded-br-none"
                                  : "bg-slate-700/90 text-white rounded-bl-none"
                              )}
                            >
                            {/* Reply Preview with optional forwarded indicator */}
                            {replyMsg && (
                              <div 
                                className={cn(
                                  "mb-2 p-2 rounded text-xs cursor-pointer border-l-4 relative overflow-hidden group",
                                  msg.sender === "me" 
                                    ? "bg-black/20 border-white/50 hover:bg-black/30" 
                                    : "bg-black/20 border-white/50 hover:bg-black/30"
                                )}
                                onClick={() => scrollToMessage(replyMsg.id)}
                              >
                                <div className="font-semibold mb-0.5 flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-1 flex-1 min-w-0">
                                    <Quote className="h-3 w-3 shrink-0" />
                                    <span className="truncate">{replyMsg.sender === "me" ? "Você" : currentContact.name}</span>
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
                            {msg.forwarded && !msg.replyTo && (
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
                                  src={msg.mediaUrl} 
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
                              <div className="min-w-[240px]">
                                {msg.metadata ? (
                                  <div className="flex gap-3 items-center bg-black/20 p-2 rounded-lg mb-2">
                                    <div className="h-12 w-12 rounded bg-muted flex items-center justify-center overflow-hidden shrink-0 relative">
                                      {msg.metadata.cover ? (
                                        <img src={msg.metadata.cover} alt="Cover" className="h-full w-full object-cover" />
                                      ) : (
                                        <Music className="h-6 w-6 opacity-50" />
                                      )}
                                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity cursor-pointer" onClick={() => togglePlay(msg)}>
                                         {playingId === msg.id ? <Pause className="h-6 w-6 fill-white text-white" /> : <Play className="h-6 w-6 fill-white text-white" />}
                                      </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="font-semibold text-sm truncate">{msg.metadata.title}</p>
                                      <p className="text-xs opacity-70 truncate">{msg.metadata.artist}</p>
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
                                    variant="ghost" 
                                    className="h-8 w-8 rounded-full shrink-0 hover:bg-white/10"
                                    onClick={() => togglePlay(msg)}
                                    data-testid={`button-play-audio-${msg.id}`}
                                  >
                                    {playingId === msg.id ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current" />}
                                  </Button>
                                  <div className="flex-1 space-y-1">
                                    <Slider 
                                      value={[playingId === msg.id ? audioProgress : 0]} 
                                      max={100} 
                                      step={1}
                                      className="cursor-pointer"
                                      onValueChange={(val) => {
                                        if (playingId === msg.id && audioRef.current && audioRef.current.duration) {
                                          audioRef.current.currentTime = (val[0] / 100) * audioRef.current.duration;
                                          setAudioProgress(val[0]);
                                        }
                                      }}
                                    />
                                    <div className="flex justify-between text-[10px] opacity-70 font-mono">
                                      <span>{playingId === msg.id && audioRef.current ? formatTime(audioRef.current.currentTime) : "0:00"}</span>
                                      <span>{msg.duration}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Footer */}
                            <div className="flex items-center justify-end gap-1 mt-1 opacity-70 text-[10px]">
                              <span>{msg.time}</span>
                              {msg.sender === "me" && (
                                <span className="text-blue-300">✓✓</span>
                              )}
                            </div>
                          </div>

                          {/* Reactions */}
                          {msg.reactions && msg.reactions.length > 0 && (
                            <div className={cn(
                              "flex flex-wrap gap-1 mt-1",
                              msg.sender === "me" ? "justify-end" : "justify-start"
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

                          {/* Persistent Action Menu (accessible via keyboard and touch) */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 shrink-0"
                                data-testid={`button-message-menu-${msg.id}`}
                                aria-label="Ações da mensagem"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align={msg.sender === "me" ? "end" : "start"}>
                              <DropdownMenuItem onClick={() => setReplyingTo(msg.id)} data-testid={`menu-reply-${msg.id}`}>
                                <Reply className="h-4 w-4 mr-2" />
                                Responder
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleForwardMessage(msg.id)} data-testid={`menu-forward-${msg.id}`}>
                                <Forward className="h-4 w-4 mr-2" />
                                Encaminhar
                              </DropdownMenuItem>
                              <EmojiPicker 
                                messageId={msg.id} 
                                onSelect={(emoji) => handleReactToMessage(msg.id, emoji)} 
                              />
                              <DropdownMenuItem onClick={() => handleDeleteMessage(msg.id)} className="text-destructive" data-testid={`menu-delete-${msg.id}`}>
                                <Trash2 className="h-4 w-4 mr-2" />
                                Apagar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={scrollRef} />
                </div>
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
                    />
                    <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground shrink-0" data-testid="button-attach">
                      <Paperclip className="h-5 w-5" />
                    </Button>
                  </div>
                  <Button size="icon" className="h-12 w-12 rounded-full shadow-lg hover-elevate active-elevate-2 shrink-0" data-testid="button-send">
                    <Mic className="h-6 w-6" />
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
            {/* Mobile Sheet */}
            <Sheet open={detailsSidebarOpen} onOpenChange={setDetailsSidebarOpen}>
              <SheetContent side="right" className="w-80 p-0 lg:hidden">
                <SheetHeader className="p-4 border-b border-border">
                  <SheetTitle>Detalhes da Conversa</SheetTitle>
                </SheetHeader>
                <ScrollArea className="h-[calc(100vh-5rem)]">
                  <ConversationDetailsContent currentDetails={currentDetails} />
                </ScrollArea>
              </SheetContent>
            </Sheet>

            {/* Desktop Card */}
            <Card className={cn(
              "hidden lg:flex flex-col h-full border-border/50 bg-card/50 backdrop-blur shrink-0 transition-all duration-300 overflow-hidden",
              detailsSidebarOpen ? "w-80" : "w-0 border-0"
            )}>
              {detailsSidebarOpen && (
                <>
                  <div className="p-4 border-b border-border bg-card/30 shrink-0 flex items-center justify-between">
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
                    <ConversationDetailsContent currentDetails={currentDetails} />
                  </ScrollArea>
                </>
              )}
            </Card>
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

// Simple ID3 tag reader using browser APIs
async function readID3Tags(blob: Blob): Promise<{ title: string; artist: string; cover: string | null } | null> {
  try {
    const arrayBuffer = await blob.arrayBuffer();
    const view = new DataView(arrayBuffer);
    
    // Check for ID3v2 header
    if (String.fromCharCode(view.getUint8(0), view.getUint8(1), view.getUint8(2)) !== 'ID3') {
      return null;
    }
    
    const version = view.getUint8(3);
    const flags = view.getUint8(5);
    
    // Get tag size (synchsafe integer)
    const size = (view.getUint8(6) << 21) | (view.getUint8(7) << 14) | (view.getUint8(8) << 7) | view.getUint8(9);
    
    let offset = 10;
    let title = "Sem título";
    let artist = "Desconhecido";
    let cover: string | null = null;
    
    // Parse frames
    while (offset < size + 10) {
      const frameId = String.fromCharCode(
        view.getUint8(offset),
        view.getUint8(offset + 1),
        view.getUint8(offset + 2),
        view.getUint8(offset + 3)
      );
      
      if (frameId === '\0\0\0\0') break;
      
      const frameSize = version === 4
        ? (view.getUint8(offset + 4) << 21) | (view.getUint8(offset + 5) << 14) | (view.getUint8(offset + 6) << 7) | view.getUint8(offset + 7)
        : (view.getUint8(offset + 4) << 24) | (view.getUint8(offset + 5) << 16) | (view.getUint8(offset + 6) << 8) | view.getUint8(offset + 7);
      
      offset += 10; // Skip frame header
      
      const frameDataStart = offset;
      
      if (frameId === 'TIT2' || frameId === 'TT2') {
        // Title
        const encoding = view.getUint8(offset);
        offset++;
        title = readString(view, offset, frameSize - 1, encoding);
        offset = frameDataStart + frameSize;
      } else if (frameId === 'TPE1' || frameId === 'TP1') {
        // Artist
        const encoding = view.getUint8(offset);
        offset++;
        artist = readString(view, offset, frameSize - 1, encoding);
        offset = frameDataStart + frameSize;
      } else if (frameId === 'APIC' || frameId === 'PIC') {
        // Album art
        const encoding = view.getUint8(offset);
        offset++; // Skip encoding
        
        // Read MIME type
        const mimeEnd = findNullTerminator(view, offset, frameDataStart + frameSize);
        const mime = readString(view, offset, mimeEnd - offset, 0);
        offset = mimeEnd + 1;
        
        offset++; // Skip picture type
        
        // Read description
        const descEnd = findNullTerminator(view, offset, frameDataStart + frameSize);
        offset = descEnd + 1;
        
        // Read image data
        const imageStart = offset;
        const imageEnd = frameDataStart + frameSize;
        const imageData = new Uint8Array(arrayBuffer.slice(imageStart, imageEnd));
        
        // Convert to base64
        let binary = '';
        const len = imageData.byteLength;
        for (let i = 0; i < len; i++) {
          binary += String.fromCharCode(imageData[i]);
        }
        const base64 = btoa(binary);
        cover = `data:${mime};base64,${base64}`;
        
        offset = frameDataStart + frameSize;
      } else {
        offset = frameDataStart + frameSize;
      }
    }
    
    return { title, artist, cover };
  } catch (error) {
    console.error('Error reading ID3 tags:', error);
    return null;
  }
}

function readString(view: DataView, offset: number, length: number, encoding: number): string {
  const bytes = new Uint8Array(length);
  for (let i = 0; i < length; i++) {
    bytes[i] = view.getUint8(offset + i);
  }
  
  const decoder = new TextDecoder(encoding === 1 ? 'utf-16' : 'utf-8');
  return decoder.decode(bytes).replace(/\0/g, '').trim();
}

function findNullTerminator(view: DataView, start: number, end: number): number {
  for (let i = start; i < end; i++) {
    if (view.getUint8(i) === 0) return i;
  }
  return end;
}
