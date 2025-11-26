import { MainLayout } from "@/components/layout/main-layout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Search, Send, Phone, Video, MoreVertical, Smile, Paperclip, ArrowLeft, MessageSquare, CornerDownRight, Quote, Trash2, Play, Pause, Mic, Image as ImageIcon, Film, File, Disc, Music, Volume2, VolumeX, Maximize, PanelLeftClose, PanelLeft, Reply, Forward, Laugh, X, MapPin, Clock, Hash, User, CheckCircle2, XCircle, Loader2, Plus, PlayCircle, StopCircle, RotateCcw, X as XIcon, Globe, Copy, Download } from "lucide-react";
import { FaTrash } from "react-icons/fa6";
import { Separator } from "@/components/ui/separator";
import { useLocation, useRoute } from "wouter";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { useRef, useEffect, useState } from "react";
import { useConversations, useConversation, useMessages, useSendMessage, useDeleteMessage, useAddReaction, ConversationWithDetails, MessageWithDetails, useCreateConversation, useStartConversation, useCloseConversation, useReopenConversation, useDeleteConversation, useTransferConversation, useConversationHistory } from "@/hooks/use-conversations";
import { useUser } from "@/hooks/use-user";
import { useAudioMetadataUpdater } from "@/hooks/use-audio-metadata-updater";
import { format, isToday, isYesterday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Slider } from "@/components/ui/slider";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger, ContextMenuSeparator } from "@/components/ui/context-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUsers, apiRequest } from "@/lib/api";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageInput } from "@/components/message-input";


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

// Conversation Details Content Component
interface ConversationDetailsProps {
  conversation: ConversationWithDetails;
}

function ConversationDetailsContent({ conversation }: ConversationDetailsProps) {
  const client = conversation.client!;
  const attendant = conversation.attendant;
  const { data: history, isLoading: loadingHistory } = useConversationHistory(conversation.id);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; className: string }> = {
      active: { label: "Ativa", className: "bg-green-500/10 text-green-500 border-green-500/20" },
      waiting: { label: "Aguardando", className: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" },
      closed: { label: "Encerrada", className: "bg-gray-500/10 text-gray-500 border-gray-500/20" },
    };
    const variant = variants[status] || variants.waiting;
    return (
      <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${variant.className}`}>
        {variant.label}
      </span>
    );
  };

  const copyProtocol = () => {
    navigator.clipboard.writeText(conversation.protocol);
    toast.success("Protocolo copiado!");
  };

  const downloadNotes = () => {
    const notes = `ANOTAÇÕES DA CONVERSA\n\n` +
      `Protocolo: ${conversation.protocol}\n` +
      `Data/Hora: ${format(new Date(conversation.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}\n` +
      `IP: ${conversation.clientIp || "Não disponível"}\n` +
      `Localização: ${conversation.clientLocation || "Não disponível"}\n` +
      `Tipo: ${conversation.gpsLocation ? 'GPS' : 'IP/Browser'}\n\n` +
      `Cliente: ${client?.displayName || "N/A"}\n` +
      `Email: ${client?.email || "N/A"}\n\n` +
      `Atendente: ${attendant?.displayName || "Não atribuído"}\n` +
      `Email: ${attendant?.email || "N/A"}\n\n` +
      `Status: ${conversation.status}\n` +
      `Canal: ${conversation.channel}\n\n` +
      `---\n` +
      `Espaço para anotações:\n\n\n\n\n`;
    
    const blob = new Blob([notes], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `anotacoes-${conversation.protocol}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Arquivo baixado!");
  };

  return (
    <div className="p-4 space-y-6">
      {/* Protocol, Date and IP */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <Hash className="h-4 w-4 text-muted-foreground" />
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">Protocolo</p>
            <div className="flex items-center gap-2">
              <p className="font-mono font-medium flex-1">{conversation.protocol}</p>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={copyProtocol}
                      className="h-7 w-7"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Copiar protocolo</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={downloadNotes}
                      className="h-7 w-7"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Baixar anotações</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
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

      {/* Location Info with IP */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          IP e Localização
        </h4>
        <div className="p-3 bg-background/50 rounded-lg space-y-2">
          <div className="flex items-start gap-2">
            <Globe className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-mono">{conversation.clientIp || "IP não disponível"}</p>
              <p className="text-sm mt-1 truncate">{conversation.clientLocation || "Localização desconhecida"}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {conversation.clientIp ? `Baseado em ${conversation.gpsLocation ? 'GPS' : 'IP/Browser'}` : 'Não disponível'}
              </p>
            </div>
          </div>
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
              <Avatar className="h-12 w-12 border-2 border-primary/20">
                <AvatarImage src={attendant.avatarUrl || undefined} />
                <AvatarFallback>{attendant.displayName.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{attendant.displayName}</p>
                <p className="text-xs text-muted-foreground truncate">{attendant.email || "Atendente responsável"}</p>
              </div>
            </div>
          </div>
          <Separator />
        </>
      )}

      {/* Conversation History */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Histórico de Conversas
        </h4>
        {loadingHistory ? (
          <div className="flex items-center justify-center p-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : history && history.length > 0 ? (
          <div className="space-y-2">
            {history.map((conv: ConversationWithDetails) => (
              <div 
                key={conv.id} 
                className="p-3 bg-background/50 rounded-lg space-y-2 border border-border/50"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-mono text-muted-foreground truncate flex-1">
                    {conv.protocol}
                  </p>
                  {getStatusBadge(conv.status)}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>{format(new Date(conv.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}</span>
                </div>
                {conv.attendant && (
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={conv.attendant.avatarUrl || undefined} />
                      <AvatarFallback className="text-[10px]">
                        {conv.attendant.displayName.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-muted-foreground truncate">
                      {conv.attendant.displayName}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground text-center p-4">
            Nenhuma conversa anterior encontrada
          </p>
        )}
      </div>
    </div>
  );
}

export default function Conversations() {
  const [location, setLocation] = useLocation();
  const [match, params] = useRoute("/conversations/:channel/:id");
  const isChatOpen = !!match;
  const conversationId = params?.id;
  const channelFromUrl = params?.channel || "webchat";
  
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
  const [activeTab, setActiveTab] = useState<"waiting" | "active" | "closed">("waiting");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [hoveredMessage, setHoveredMessage] = useState<string | null>(null);
  const [isLargeScreen, setIsLargeScreen] = useState(false);
  const [messageInput, setMessageInput] = useState("");
  
  // Audio Player State
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [audioProgress, setAudioProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // New Conversation Dialog State
  const [newConversationDialogOpen, setNewConversationDialogOpen] = useState(false);
  const [contactSearch, setContactSearch] = useState("");
  const [debouncedContactSearch, setDebouncedContactSearch] = useState("");
  const [selectedChannel, setSelectedChannel] = useState<string>("all");
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [selectedAttendant, setSelectedAttendant] = useState<string>("");
  const [forwardDialogOpen, setForwardDialogOpen] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [messageToForward, setMessageToForward] = useState<MessageWithDetails | null>(null);
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [selectedReplyContacts, setSelectedReplyContacts] = useState<string[]>([]);
  const [messageToReply, setMessageToReply] = useState<MessageWithDetails | null>(null);
  const createConversationMutation = useCreateConversation();
  const startConversationMutation = useStartConversation();
  const closeConversationMutation = useCloseConversation();
  const reopenConversationMutation = useReopenConversation();
  const deleteConversationMutation = useDeleteConversation();
  const transferConversationMutation = useTransferConversation();
  const { data: contactsData, isLoading: loadingContacts } = useUsers("client", debouncedContactSearch);
  const { data: attendantsData, isLoading: loadingAttendants } = useUsers("attendant");
  
  // Process audio messages in background to extract metadata
  // This will automatically update audio messages without ID3 tags
  useAudioMetadataUpdater(messages, conversationId);
  
  // Process audio messages without duration when entering conversation
  useEffect(() => {
    if (!messages || messages.length === 0) return;

    const processAudioDurations = async () => {
      const audioMessagesWithoutDuration = messages.filter(
        msg => msg.type === 'audio' && msg.mediaUrl && msg.mediaUrl !== '#' && !msg.duration
      );

      if (audioMessagesWithoutDuration.length === 0) return;

      console.log(`[processAudioDurations] Found ${audioMessagesWithoutDuration.length} audio messages without duration`);

      // Process up to 3 messages at a time to avoid overwhelming the browser
      for (const msg of audioMessagesWithoutDuration.slice(0, 3)) {
        try {
          const audio = new Audio(msg.mediaUrl!);
          
          await new Promise<void>((resolve) => {
            audio.addEventListener('loadedmetadata', async () => {
              if (audio.duration && !isNaN(audio.duration)) {
                const durationMinutes = Math.floor(audio.duration / 60);
                const durationSeconds = Math.floor(audio.duration % 60);
                const durationStr = `${durationMinutes}:${durationSeconds.toString().padStart(2, '0')}`;
                
                console.log(`[processAudioDurations] Captured duration for message ${msg.id}: ${durationStr}`);
                
                try {
                  await apiRequest(`/messages/${msg.id}/metadata`, {
                    method: 'PATCH',
                    body: JSON.stringify({ duration: durationStr }),
                  });
                } catch (error) {
                  console.error('[processAudioDurations] Error updating duration:', error);
                }
              }
              resolve();
            });

            audio.addEventListener('error', () => {
              console.error('[processAudioDurations] Error loading audio:', msg.id);
              resolve();
            });
          });

          // Small delay between processing
          await new Promise(resolve => setTimeout(resolve, 300));
        } catch (error) {
          console.error('[processAudioDurations] Error processing message:', msg.id, error);
        }
      }
    };

    // Start processing after a small delay
    const timeout = setTimeout(processAudioDurations, 1000);

    return () => clearTimeout(timeout);
  }, [messages, conversationId]);
  
  // Debounce contact search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedContactSearch(contactSearch);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [contactSearch]);

  const currentContact = conversation?.client || conversation?.attendant;
  const currentConversation = conversations?.find(c => c.id === conversationId);

  // Automatically switch to the tab where the current conversation is
  useEffect(() => {
    if (!conversation) return;

    const conversationStatus = conversation.status;
    
    // Only switch if we're not already on the correct tab
    if (conversationStatus === "waiting" && activeTab !== "waiting") {
      setActiveTab("waiting");
    } else if (conversationStatus === "active" && activeTab !== "active") {
      setActiveTab("active");
    } else if (conversationStatus === "closed" && activeTab !== "closed") {
      setActiveTab("closed");
    }
  }, [conversation?.id, conversation?.status]);

  // Check if user can send messages - only assigned attendant or admin
  // If conversation is waiting, show assign button for attendants/admins
  const canSendMessage = conversation 
    ? (user?.role === "admin" || conversation.attendantId === user?.id) && 
      conversation.status === "active"
    : false;

  // Check if user can assign conversation
  const canAssignConversation = conversation
    ? (user?.role === "attendant" || user?.role === "admin") && 
      conversation.status === "waiting"
    : false;
  
  // Check if conversation needs to be started
  const needsToStart = conversation
    ? (user?.role === "attendant" || user?.role === "admin") &&
      conversation.status === "waiting" &&
      conversation.attendantId === user?.id
    : false;

  // Handle assigning conversation to current user
  const handleAssignConversation = async () => {
    if (!conversationId) return;
    
    try {
      await apiRequest(`/conversations/${conversationId}/assign`, {
        method: "PATCH",
      });
      toast.success("Conversa assumida com sucesso!");
    } catch (error: any) {
      toast.error(error.message || "Erro ao assumir conversa");
    }
  };

  // Handle conversation actions
  const handleStartConversation = async () => {
    if (!conversationId) return;
    
    try {
      await startConversationMutation.mutateAsync(conversationId);
      toast.success("Conversa iniciada com sucesso!");
    } catch (error: any) {
      toast.error(error.message || "Erro ao iniciar conversa");
    }
  };

  const handleCloseConversation = async () => {
    if (!conversationId) return;
    
    if (!confirm("Tem certeza que deseja encerrar esta conversa?")) return;
    
    try {
      await closeConversationMutation.mutateAsync(conversationId);
      toast.success("Conversa encerrada com sucesso!");
    } catch (error: any) {
      toast.error(error.message || "Erro ao encerrar conversa");
    }
  };

  const handleReopenConversation = async () => {
    if (!conversationId) return;
    
    try {
      await reopenConversationMutation.mutateAsync(conversationId);
      toast.success("Conversa reaberta com sucesso!");
    } catch (error: any) {
      toast.error(error.message || "Erro ao reabrir conversa");
    }
  };

  const handleDeleteConversation = async () => {
    if (!conversationId) return;
    
    if (!confirm("Tem certeza que deseja deletar esta conversa? Esta ação não pode ser desfeita.")) return;
    
    try {
      await deleteConversationMutation.mutateAsync(conversationId);
      toast.success("Conversa deletada com sucesso!");
      setLocation("/conversations");
    } catch (error: any) {
      toast.error(error.message || "Erro ao deletar conversa");
    }
  };

  const handleTransferConversation = async () => {
    if (!conversationId || !selectedAttendant) {
      toast.error("Selecione um atendente para transferir");
      return;
    }
    
    try {
      await transferConversationMutation.mutateAsync({
        conversationId,
        attendantId: selectedAttendant,
      });
      toast.success("Conversa transferida com sucesso!");
      setTransferDialogOpen(false);
      setSelectedAttendant("");
    } catch (error: any) {
      toast.error(error.message || "Erro ao transferir conversa");
    }
  };

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

  const togglePlay = async (msg: MessageWithDetails) => {
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

      // Capturar duração quando metadata for carregada
      audio.addEventListener('loadedmetadata', async () => {
        if (audio.duration && !msg.duration && !isNaN(audio.duration)) {
          const durationMinutes = Math.floor(audio.duration / 60);
          const durationSeconds = Math.floor(audio.duration % 60);
          const durationStr = `${durationMinutes}:${durationSeconds.toString().padStart(2, '0')}`;
          
          console.log(`[togglePlay] Captured duration for message ${msg.id}: ${durationStr}`);
          
          // Atualizar duração no servidor
          try {
            await apiRequest(`/messages/${msg.id}/metadata`, {
              method: 'PATCH',
              body: JSON.stringify({ duration: durationStr }),
            });
          } catch (error) {
            console.error('[togglePlay] Error updating duration:', error);
          }
        }
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
        gpsLocation: conversation.gpsLocation,
        latitude: conversation.latitude,
        longitude: conversation.longitude,
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

        // Processar metadata (manter cover como URL pública)
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
        ip: conversation.clientIp,
        location: conversation.clientLocation,
        gpsLocation: conversation.gpsLocation,
        latitude: conversation.latitude,
        longitude: conversation.longitude,
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
    if (msg) {
      setMessageToForward(msg);
      setForwardDialogOpen(true);
      setSelectedContacts([]);
    }
  };

  const handleForwardToContacts = async () => {
    if (!messageToForward || selectedContacts.length === 0) return;

    try {
      for (const contactId of selectedContacts) {
        // Buscar ou criar conversa com o contato
        const response = await apiRequest(`/conversations/with/${contactId}`, {
          method: 'GET'
        });

        let targetConversationId: string;
        if (response.conversation) {
          targetConversationId = response.conversation.id;
        } else {
          // Criar nova conversa se não existir
          const createResponse = await apiRequest('/conversations', {
            method: 'POST',
            body: JSON.stringify({ contactId })
          });
          targetConversationId = createResponse.id;
        }

        // Enviar mensagem encaminhada (reutilizando o mesmo arquivo)
        await apiRequest(`/conversations/${targetConversationId}/messages`, {
          method: 'POST',
          body: JSON.stringify({
            content: messageToForward.content,
            type: messageToForward.type,
            mediaUrl: messageToForward.mediaUrl || undefined,
            metadata: messageToForward.metadata || undefined,
            duration: messageToForward.duration || undefined,
            fileName: messageToForward.fileName || undefined,
            fileSize: messageToForward.fileSize || undefined,
            forwarded: true,
          })
        });
      }

      toast.success(`Mensagem encaminhada para ${selectedContacts.length} contato(s)`);
      setForwardDialogOpen(false);
      setSelectedContacts([]);
      setMessageToForward(null);
    } catch (error) {
      console.error('Error forwarding message:', error);
      toast.error('Erro ao encaminhar mensagem');
    }
  };

  const toggleContactSelection = (contactId: string) => {
    setSelectedContacts(prev => 
      prev.includes(contactId) 
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    );
  };

  const toggleReplyContactSelection = (contactId: string) => {
    setSelectedReplyContacts(prev => 
      prev.includes(contactId) 
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    );
  };

  const handleReplyMessage = (messageId: string) => {
    const msg = messages.find(m => m.id === messageId);
    if (msg) {
      setMessageToReply(msg);
      setReplyDialogOpen(true);
      setSelectedReplyContacts([]);
    }
  };

  const handleReplyToContacts = async () => {
    if (!messageToReply || selectedReplyContacts.length === 0) return;

    try {
      for (const contactId of selectedReplyContacts) {
        // Buscar ou criar conversa com o contato
        const response = await apiRequest(`/conversations/with/${contactId}`, {
          method: 'GET'
        });

        let targetConversationId: string;
        if (response.conversation) {
          targetConversationId = response.conversation.id;
        } else {
          // Criar nova conversa se não existir
          const createResponse = await apiRequest('/conversations', {
            method: 'POST',
            body: JSON.stringify({ contactId })
          });
          targetConversationId = createResponse.id;
        }

        // Enviar mensagem com resposta (reutilizando o mesmo arquivo)
        await apiRequest(`/conversations/${targetConversationId}/messages`, {
          method: 'POST',
          body: JSON.stringify({
            content: messageToReply.content,
            type: messageToReply.type,
            mediaUrl: messageToReply.mediaUrl || undefined,
            metadata: messageToReply.metadata || undefined,
            duration: messageToReply.duration || undefined,
            fileName: messageToReply.fileName || undefined,
            fileSize: messageToReply.fileSize || undefined,
            replyToId: messageToReply.id,
          })
        });
      }

      toast.success(`Resposta enviada para ${selectedReplyContacts.length} contato(s)`);
      setReplyDialogOpen(false);
      setSelectedReplyContacts([]);
      setMessageToReply(null);
    } catch (error) {
      console.error('Error replying to message:', error);
      toast.error('Erro ao enviar resposta');
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

  const handleCreateNewConversation = async (clientId: string, channel: string) => {
    // Guard against invalid channel - default to webchat if "all" is selected
    const validChannel = channel === "all" ? "webchat" : channel;
    
    // Collect location information
    let locationData: {
      clientLocation?: string;
      clientIp?: string;
      gpsLocation?: boolean;
      latitude?: number;
      longitude?: number;
    } = {};

    try {
      // Request geolocation permission
      if (navigator.geolocation) {
        await new Promise<void>((resolve) => {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              locationData.latitude = position.coords.latitude;
              locationData.longitude = position.coords.longitude;
              locationData.gpsLocation = true;

              // Try to get location name from coordinates using reverse geocoding
              try {
                const response = await fetch(
                  `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}&accept-language=pt-BR`
                );
                const data = await response.json();
                if (data.address) {
                  const city = data.address.city || data.address.town || data.address.village || '';
                  const state = data.address.state || '';
                  const country = data.address.country || '';
                  locationData.clientLocation = [city, state, country].filter(Boolean).join(', ');
                }
              } catch (error) {
                console.error('Error getting location name:', error);
              }
              resolve();
            },
            (error) => {
              console.warn('GPS location denied or unavailable:', error);
              resolve();
            },
            { timeout: 10000, enableHighAccuracy: true }
          );
        });
      }

      // Fallback: Get IP-based location if GPS failed
      if (!locationData.clientLocation) {
        try {
          const ipResponse = await fetch('https://ipapi.co/json/');
          const ipData = await ipResponse.json();
          locationData.clientLocation = [ipData.city, ipData.region, ipData.country_name].filter(Boolean).join(', ');
          locationData.clientIp = ipData.ip;
          locationData.gpsLocation = false;
        } catch (error) {
          console.error('Error getting IP location:', error);
          locationData.clientLocation = 'Localização desconhecida';
        }
      }

      const result = await createConversationMutation.mutateAsync({
        clientId,
        channel: validChannel as "webchat" | "whatsapp" | "telegram",
        ...locationData,
      });
      toast.success("Conversa iniciada com sucesso!");
      setNewConversationDialogOpen(false);
      setContactSearch("");
      setSelectedChannel("all");
      setLocation(`/conversations/${validChannel}/${result.id}`);
    } catch (error: any) {
      toast.error(error.message || "Erro ao iniciar conversa");
    }
  };

  const filteredContacts = contactsData?.users?.filter(contact => {
    if (selectedChannel === "all") return true;
    // Filter logic can be enhanced based on channel preference
    return true;
  }) || [];

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
                <>
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Buscar conversas..." className="pl-9 bg-background/50" data-testid="input-search-conversations" />
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => setNewConversationDialogOpen(true)}
                    className="shrink-0"
                    data-testid="button-new-conversation"
                    title="Nova conversa"
                  >
                    <Plus className="h-5 w-5" />
                  </Button>
                </>
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
          {!sidebarCollapsed && (
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "waiting" | "active" | "closed")} className="shrink-0">
              <TabsList className="w-full grid grid-cols-3 h-10 mx-2 mb-2">
                <TabsTrigger value="waiting" className="text-xs" data-testid="tab-waiting">
                  Pendente
                </TabsTrigger>
                <TabsTrigger value="active" className="text-xs" data-testid="tab-active">
                  Atendendo
                </TabsTrigger>
                <TabsTrigger value="closed" className="text-xs" data-testid="tab-closed">
                  Fechada
                </TabsTrigger>
              </TabsList>
            </Tabs>
          )}
          <ScrollArea className="flex-1">
            {loadingConversations ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : conversations && conversations.length > 0 ? (
              <div className="space-y-1 p-2">
                {conversations.filter(conv => conv.status === activeTab).map((conv) => {
                  // Determine who to show: if user is client, show attendant; if user is attendant/admin, show client
                  const contact = user?.id === conv.clientId ? conv.attendant : conv.client;
                  
                  // For clients: if no attendant yet (waiting status), show "Aguardando atendente"
                  // For attendants: always show the client
                  let displayName: string;
                  let avatarUrl: string;
                  
                  if (user?.role === "client" && !contact) {
                    // Client view with no attendant assigned
                    displayName = "Aguardando atendente";
                    avatarUrl = "/user-profile.png";
                  } else if (contact) {
                    displayName = contact.displayName;
                    avatarUrl = contact.avatarUrl || `/user-profile.png`;
                  } else {
                    displayName = "Sem nome";
                    avatarUrl = "/user-profile.png";
                  }
                  
                  return (
                    <ContextMenu key={conv.id}>
                      <ContextMenuTrigger asChild>
                        <Link href={`/conversations/${conv.channel || 'webchat'}/${conv.id}`}>
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
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs font-mono px-1.5 py-0">
                                  #{conv.sequenceNumber}
                                </Badge>
                                <span className="font-medium truncate">{displayName}</span>
                              </div>
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
                  </ContextMenuTrigger>
                  <ContextMenuContent>
                    {user && (user.role === "attendant" || user.role === "admin") ? (
                      <>
                        {conv.status === "waiting" && (
                          <ContextMenuItem 
                            onClick={async (e) => {
                              e.preventDefault();
                              try {
                                await startConversationMutation.mutateAsync(conv.id);
                                toast.success("Conversa iniciada com sucesso!");
                                setLocation(`/conversations/${conv.channel || 'webchat'}/${conv.id}`);
                              } catch (error: any) {
                                toast.error(error.message || "Erro ao iniciar conversa");
                              }
                            }}
                            data-testid={`context-start-${conv.id}`}
                          >
                            <PlayCircle className="mr-2 h-4 w-4" />
                            Iniciar Conversa
                          </ContextMenuItem>
                        )}
                        {conv.status === "active" && (
                          <>
                            <ContextMenuItem 
                              onClick={async (e) => {
                                e.preventDefault();
                                if (confirm("Tem certeza que deseja encerrar esta conversa?")) {
                                  try {
                                    await closeConversationMutation.mutateAsync(conv.id);
                                    toast.success("Conversa encerrada com sucesso!");
                                  } catch (error: any) {
                                    toast.error(error.message || "Erro ao encerrar conversa");
                                  }
                                }
                              }}
                              data-testid={`context-close-${conv.id}`}
                            >
                              <StopCircle className="mr-2 h-4 w-4" />
                              Encerrar Conversa
                            </ContextMenuItem>
                            <ContextMenuItem 
                              onClick={(e) => {
                                e.preventDefault();
                                setLocation(`/conversations/${conv.channel || 'webchat'}/${conv.id}`);
                                setTimeout(() => setTransferDialogOpen(true), 200);
                              }}
                              data-testid={`context-transfer-${conv.id}`}
                            >
                              <User className="mr-2 h-4 w-4" />
                              Transferir
                            </ContextMenuItem>
                          </>
                        )}
                        {conv.status === "closed" && (
                          <ContextMenuItem 
                            onClick={async (e) => {
                              e.preventDefault();
                              try {
                                await reopenConversationMutation.mutateAsync(conv.id);
                                toast.success("Conversa reaberta com sucesso!");
                                setLocation(`/conversations/${conv.channel || 'webchat'}/${conv.id}`);
                              } catch (error: any) {
                                toast.error(error.message || "Erro ao reabrir conversa");
                              }
                            }}
                            data-testid={`context-reopen-${conv.id}`}
                          >
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Reabrir Conversa
                          </ContextMenuItem>
                        )}
                        <ContextMenuSeparator />
                        <ContextMenuItem 
                          onClick={async (e) => {
                            e.preventDefault();
                            if (confirm("Tem certeza que deseja deletar esta conversa? Esta ação não pode ser desfeita.")) {
                              try {
                                await deleteConversationMutation.mutateAsync(conv.id);
                                toast.success("Conversa deletada com sucesso!");
                                if (conversationId === conv.id) {
                                  setLocation("/conversations");
                                }
                              } catch (error: any) {
                                toast.error(error.message || "Erro ao deletar conversa");
                              }
                            }
                          }}
                          className="text-destructive"
                          data-testid={`context-delete-${conv.id}`}
                        >
                          <FaTrash className="mr-2 h-4 w-4" />
                          Deletar Conversa
                        </ContextMenuItem>
                      </>
                    ) : (
                      <ContextMenuItem disabled>
                        Sem ações disponíveis
                      </ContextMenuItem>
                    )}
                  </ContextMenuContent>
                </ContextMenu>
                  );
                })}
                {conversations.filter(conv => conv.status === activeTab).length === 0 && (
                  <div className="flex flex-col items-center justify-center p-8 text-center">
                    <MessageSquare className="h-12 w-12 text-muted-foreground/50 mb-4" />
                    <p className="text-sm text-muted-foreground">
                      {activeTab === "waiting" && "Nenhuma conversa pendente"}
                      {activeTab === "active" && "Nenhuma conversa em atendimento"}
                      {activeTab === "closed" && "Nenhuma conversa fechada"}
                    </p>
                  </div>
                )}
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
                        <AvatarImage src={currentContact.avatarUrl || undefined} />
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
                          #{conversation.sequenceNumber}
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
                      {(user?.role === "attendant" || user?.role === "admin") && (
                        <>
                          {conversation?.status === "waiting" && (
                            <DropdownMenuItem onClick={handleStartConversation} data-testid="menu-start-conversation">
                              <PlayCircle className="mr-2 h-4 w-4" />
                              Iniciar Conversa
                            </DropdownMenuItem>
                          )}
                          {conversation?.status === "active" && (
                            <>
                              <DropdownMenuItem onClick={handleCloseConversation} data-testid="menu-close-conversation">
                                <StopCircle className="mr-2 h-4 w-4" />
                                Encerrar Conversa
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setTransferDialogOpen(true)} data-testid="menu-transfer-conversation">
                                <User className="mr-2 h-4 w-4" />
                                Transferir
                              </DropdownMenuItem>
                            </>
                          )}
                          {conversation?.status === "closed" && (
                            <DropdownMenuItem onClick={handleReopenConversation} data-testid="menu-reopen-conversation">
                              <RotateCcw className="mr-2 h-4 w-4" />
                              Reabrir Conversa
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={handleDeleteConversation} className="text-destructive" data-testid="menu-delete-conversation">
                            <FaTrash className="mr-2 h-4 w-4" />
                            Deletar Conversa
                          </DropdownMenuItem>
                          {import.meta.env.DEV && <DropdownMenuSeparator />}
                        </>
                      )}
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
                                    {replyMsg.content || (
                                      replyMsg.type === 'image' ? '📷 Imagem' : 
                                      replyMsg.type === 'audio' ? '🎵 Áudio' : 
                                      replyMsg.type === 'video' ? '🎬 Vídeo' : 
                                      replyMsg.type === 'contact' ? '👤 Contato' : 
                                      replyMsg.type === 'location' ? '📍 Localização' : 
                                      replyMsg.type === 'document' ? '📄 Documento' : 
                                      '📎 Arquivo'
                                    )}
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
                                    replyMsg.content || (
                                      replyMsg.type === 'image' ? 'Imagem' : 
                                      replyMsg.type === 'audio' ? 'Áudio' : 
                                      replyMsg.type === 'video' ? 'Vídeo' : 
                                      replyMsg.type === 'contact' ? 'Contato' : 
                                      replyMsg.type === 'location' ? 'Localização' : 
                                      replyMsg.type === 'document' ? 'Documento' : 
                                      'Arquivo'
                                    )
                                  )}
                                </p>
                              </div>
                            )}
                            
                            {/* Forwarded indicator in message header (only when no reply) */}
                            {msg.forwarded && !msg.replyToId && (
                              <div className={cn(
                                "mb-2 p-2 rounded text-xs border-l-4 relative overflow-hidden",
                                isMyMessage 
                                  ? "bg-black/20 border-blue-400/50" 
                                  : "bg-black/20 border-white/50"
                              )}>
                                <div className="flex items-center gap-1.5 opacity-80">
                                  <CornerDownRight className="h-3 w-3 shrink-0" />
                                  <span className="font-semibold">Mensagem Encaminhada</span>
                                </div>
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
                                {(() => {
                                  console.log("[Audio Message Debug]", { 
                                    messageId: msg.id, 
                                    hasMetadata: !!msg.metadata, 
                                    hasAudioTags: !!msg.metadata?.audio_tags,
                                    metadata: msg.metadata 
                                  });
                                  return null;
                                })()}
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
                                      {msg.duration && (
                                        <p className="text-xs opacity-70 mt-1">
                                          Duração: {msg.duration}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                ) : msg.recorded ? (
                                  <div className="flex items-center gap-2 mb-2 bg-black/20 p-2 rounded-lg">
                                    <Mic className="h-4 w-4 opacity-80" />
                                    <div className="flex-1">
                                      <span className="text-xs font-medium opacity-90">Mensagem de Voz</span>
                                      {msg.duration && (
                                        <span className="text-xs opacity-70 ml-2">{msg.duration}</span>
                                      )}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex gap-3 items-center bg-black/20 p-2 rounded-lg mb-2">
                                     <div className="h-12 w-12 rounded bg-white/10 flex items-center justify-center shrink-0">
                                       <Disc className="h-6 w-6 opacity-80" />
                                     </div>
                                     <div className="flex-1 min-w-0">
                                       <p className="text-sm truncate font-medium">{msg.caption || "Arquivo de Áudio"}</p>
                                       <div className="flex items-center gap-2 text-[10px] opacity-70">
                                         <span>MP3</span>
                                         {msg.duration && (
                                           <>
                                             <span>•</span>
                                             <span>{msg.duration}</span>
                                           </>
                                         )}
                                       </div>
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
                                      <span>{msg.duration || "--:--"}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {msg.type === 'contact' && msg.metadata?.contact && (
                              <div className="min-w-[250px]">
                                <div className="flex gap-3 items-center bg-black/20 p-3 rounded-lg border border-white/10">
                                  <Avatar className="h-12 w-12">
                                    <AvatarImage src={msg.metadata.contact.avatarUrl || undefined} />
                                    <AvatarFallback>
                                      {msg.metadata.contact.name.substring(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-sm truncate">{msg.metadata.contact.name}</p>
                                    {msg.metadata.contact.email && (
                                      <p className="text-xs opacity-70 truncate">{msg.metadata.contact.email}</p>
                                    )}
                                    {msg.metadata.contact.phone && (
                                      <p className="text-xs opacity-70 truncate">{msg.metadata.contact.phone}</p>
                                    )}
                                  </div>
                                  <User className="h-5 w-5 opacity-50" />
                                </div>
                              </div>
                            )}

                            {msg.type === 'location' && msg.metadata?.location && (
                              <div className="min-w-[300px] space-y-2">
                                <div className="relative rounded-lg overflow-hidden bg-muted h-[200px] border border-white/10">
                                  <iframe
                                    width="100%"
                                    height="200"
                                    frameBorder="0"
                                    style={{ border: 0 }}
                                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${msg.metadata.location.longitude - 0.01}%2C${msg.metadata.location.latitude - 0.01}%2C${msg.metadata.location.longitude + 0.01}%2C${msg.metadata.location.latitude + 0.01}&layer=mapnik&marker=${msg.metadata.location.latitude}%2C${msg.metadata.location.longitude}`}
                                    allowFullScreen
                                  />
                                </div>
                                <div className="bg-black/20 p-3 rounded-lg">
                                  <div className="flex items-start gap-2">
                                    <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                                    <div className="flex-1 min-w-0">
                                      {msg.metadata.location.name && (
                                        <p className="font-medium text-sm mb-1">{msg.metadata.location.name}</p>
                                      )}
                                      {msg.metadata.location.address && (
                                        <p className="text-xs opacity-70 mb-2">{msg.metadata.location.address}</p>
                                      )}
                                      <div className="flex items-center gap-2 text-[10px] font-mono opacity-60">
                                        <span>{msg.metadata.location.latitude.toFixed(6)}</span>
                                        <span>•</span>
                                        <span>{msg.metadata.location.longitude.toFixed(6)}</span>
                                      </div>
                                      <a
                                        href={`https://www.google.com/maps?q=${msg.metadata.location.latitude},${msg.metadata.location.longitude}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-primary hover:underline mt-2 inline-block"
                                      >
                                        Abrir no Google Maps →
                                      </a>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {msg.type === 'document' && (
                              <div className="min-w-[250px]">
                                <div className="flex gap-3 items-center bg-black/20 p-3 rounded-lg border border-white/10">
                                  <div className="h-12 w-12 rounded bg-white/10 flex items-center justify-center shrink-0">
                                    <File className="h-6 w-6 opacity-80" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm truncate font-medium">{msg.fileName || msg.caption || "Documento"}</p>
                                    {msg.fileSize && (
                                      <p className="text-xs opacity-70">{msg.fileSize}</p>
                                    )}
                                  </div>
                                  {msg.mediaUrl && (
                                    <a
                                      href={msg.mediaUrl}
                                      download
                                      className="text-primary hover:text-primary/80"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <Download className="h-5 w-5" />
                                    </a>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Footer with actions on left and time on right */}
                            <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-white/5">
                              {/* Action Buttons on Left */}
                              <div className="flex items-center gap-1 opacity-0 group-hover/message:opacity-100 transition-opacity">
                                {!isMyMessage && (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6 hover:bg-white/10"
                                      onClick={() => handleReplyMessage(msg.id)}
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
                                  </>
                                )}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 hover:bg-white/10"
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
              <MessageInput
                conversationId={conversationId || ""}
                onSendMessage={(data) => {
                  if (!conversationId) return;
                  sendMessageMutation.mutate({
                    conversationId,
                    data,
                  }, {
                    onSuccess: () => {
                      setReplyingTo(null);
                    },
                  });
                }}
                replyingTo={replyingTo}
                onCancelReply={() => setReplyingTo(null)}
                replyMessage={replyingTo ? getReplyMessage(replyingTo) : null}
                isPending={sendMessageMutation.isPending}
                canSend={canSendMessage}
                conversationStatus={conversation?.status}
                needsToStart={needsToStart}
                onStartConversation={needsToStart ? handleStartConversation : undefined}
                onAssignConversation={canAssignConversation ? handleAssignConversation : undefined}
              />
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
                    {conversation && <ConversationDetailsContent conversation={conversation} />}
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
                      {conversation && <ConversationDetailsContent conversation={conversation} />}
                    </ScrollArea>
                  </>
                )}
              </Card>
            )}
          </>
        )}
      </div>

      {/* Transfer Conversation Dialog */}
      <Dialog open={transferDialogOpen} onOpenChange={setTransferDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Transferir Conversa</DialogTitle>
            <DialogDescription>
              Selecione o atendente para quem deseja transferir esta conversa
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {loadingAttendants ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : attendantsData?.users && attendantsData.users.length > 0 ? (
              <>
                <Select value={selectedAttendant} onValueChange={setSelectedAttendant}>
                  <SelectTrigger data-testid="select-attendant">
                    <SelectValue placeholder="Selecione um atendente" />
                  </SelectTrigger>
                  <SelectContent>
                    {attendantsData.users
                      .filter(att => att.id !== conversation?.attendantId)
                      .map((attendant) => (
                        <SelectItem key={attendant.id} value={attendant.id}>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={attendant.avatarUrl || undefined} />
                              <AvatarFallback>{attendant.displayName.substring(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <span>{attendant.displayName}</span>
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                
                <div className="flex justify-end gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setTransferDialogOpen(false);
                      setSelectedAttendant("");
                    }}
                    data-testid="button-cancel-transfer"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleTransferConversation}
                    disabled={!selectedAttendant || transferConversationMutation.isPending}
                    data-testid="button-confirm-transfer"
                  >
                    {transferConversationMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Transferindo...
                      </>
                    ) : (
                      "Transferir"
                    )}
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <User className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-sm text-muted-foreground">
                  Nenhum atendente disponível para transferência
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* New Conversation Dialog */}
      <Dialog open={newConversationDialogOpen} onOpenChange={setNewConversationDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Nova Conversa</DialogTitle>
            <DialogDescription>
              Selecione um contato para iniciar uma nova conversa
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar contato..." 
                className="pl-9"
                value={contactSearch}
                onChange={(e) => setContactSearch(e.target.value)}
                data-testid="input-search-contacts"
              />
            </div>

            {/* Channel Filter */}
            <Select value={selectedChannel} onValueChange={setSelectedChannel}>
              <SelectTrigger data-testid="select-channel">
                <SelectValue placeholder="Filtrar por canal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os canais</SelectItem>
                <SelectItem value="webchat">WebChat</SelectItem>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                <SelectItem value="telegram">Telegram</SelectItem>
              </SelectContent>
            </Select>

            {/* Contacts List */}
            <ScrollArea className="h-[300px] border rounded-md">
              {loadingContacts ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredContacts.length > 0 ? (
                <div className="p-2 space-y-1">
                  {filteredContacts.map((contact) => (
                    <div
                      key={contact.id}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 cursor-pointer transition-colors"
                      onClick={() => handleCreateNewConversation(contact.id, selectedChannel === "all" ? "webchat" : selectedChannel)}
                      data-testid={`contact-item-${contact.id}`}
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={contact.avatarUrl || undefined} />
                        <AvatarFallback>{contact.displayName.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{contact.displayName}</p>
                        <p className="text-sm text-muted-foreground truncate">{contact.email}</p>
                      </div>
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <User className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-sm text-muted-foreground">
                    {contactSearch ? "Nenhum contato encontrado" : "Nenhum contato disponível"}
                  </p>
                </div>
              )}
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reply Message Dialog */}
      <Dialog open={replyDialogOpen} onOpenChange={setReplyDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Responder Mensagem</DialogTitle>
            <DialogDescription>
              Selecione um ou mais contatos para responder esta mensagem
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar contatos..."
                value={contactSearch}
                onChange={(e) => setContactSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <ScrollArea className="h-[300px] pr-4">
              {loadingContacts ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : contactsData?.users && contactsData.users.length > 0 ? (
                <div className="space-y-1">
                  {contactsData.users.filter(contact => contact.id !== user?.id).map((contact) => (
                    <div
                      key={contact.id}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors",
                        selectedReplyContacts.includes(contact.id)
                          ? "bg-primary/10 hover:bg-primary/20"
                          : "hover:bg-accent/50"
                      )}
                      onClick={() => toggleReplyContactSelection(contact.id)}
                    >
                      <div className={cn(
                        "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
                        selectedReplyContacts.includes(contact.id)
                          ? "bg-primary border-primary"
                          : "border-muted-foreground/50"
                      )}>
                        {selectedReplyContacts.includes(contact.id) && (
                          <CheckCircle2 className="h-3 w-3 text-primary-foreground" />
                        )}
                      </div>
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={contact.avatarUrl || undefined} />
                        <AvatarFallback>{contact.displayName.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{contact.displayName}</p>
                        <p className="text-sm text-muted-foreground truncate">{contact.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <User className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-sm text-muted-foreground">
                    {contactSearch ? "Nenhum contato encontrado" : "Nenhum contato disponível"}
                  </p>
                </div>
              )}
            </ScrollArea>

            <div className="flex items-center justify-between pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                {selectedReplyContacts.length} {selectedReplyContacts.length === 1 ? 'contato selecionado' : 'contatos selecionados'}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setReplyDialogOpen(false);
                    setSelectedReplyContacts([]);
                    setMessageToReply(null);
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleReplyToContacts}
                  disabled={selectedReplyContacts.length === 0}
                >
                  <Reply className="h-4 w-4 mr-2" />
                  Responder
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Forward Message Dialog */}
      <Dialog open={forwardDialogOpen} onOpenChange={setForwardDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Encaminhar Mensagem</DialogTitle>
            <DialogDescription>
              Selecione um ou mais contatos para encaminhar esta mensagem
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar contatos..."
                value={contactSearch}
                onChange={(e) => setContactSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <ScrollArea className="h-[300px] pr-4">
              {loadingContacts ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : contactsData?.users && contactsData.users.length > 0 ? (
                <div className="space-y-1">
                  {contactsData.users.filter(contact => contact.id !== user?.id).map((contact) => (
                    <div
                      key={contact.id}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors",
                        selectedContacts.includes(contact.id)
                          ? "bg-primary/10 hover:bg-primary/20"
                          : "hover:bg-accent/50"
                      )}
                      onClick={() => toggleContactSelection(contact.id)}
                    >
                      <div className={cn(
                        "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
                        selectedContacts.includes(contact.id)
                          ? "bg-primary border-primary"
                          : "border-muted-foreground/50"
                      )}>
                        {selectedContacts.includes(contact.id) && (
                          <CheckCircle2 className="h-3 w-3 text-primary-foreground" />
                        )}
                      </div>
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={contact.avatarUrl || undefined} />
                        <AvatarFallback>{contact.displayName.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{contact.displayName}</p>
                        <p className="text-sm text-muted-foreground truncate">{contact.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <User className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-sm text-muted-foreground">
                    {contactSearch ? "Nenhum contato encontrado" : "Nenhum contato disponível"}
                  </p>
                </div>
              )}
            </ScrollArea>

            <div className="flex items-center justify-between pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                {selectedContacts.length} {selectedContacts.length === 1 ? 'contato selecionado' : 'contatos selecionados'}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setForwardDialogOpen(false);
                    setSelectedContacts([]);
                    setMessageToForward(null);
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleForwardToContacts}
                  disabled={selectedContacts.length === 0}
                >
                  <Forward className="h-4 w-4 mr-2" />
                  Encaminhar
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
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
