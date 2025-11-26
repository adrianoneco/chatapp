import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Send, Loader2, Sparkles, MessageSquare, Camera, Video, 
  Mic, Paperclip, X, Image as ImageIcon, Play, Pause, Square, StopCircle, Reply,
  FileText, UserCircle, MapPin, ChevronUp, Search, CheckCircle2 
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { apiRequest } from "@/lib/api";
import { detectFileType, FileInfo, readAudioMetadata, AudioMetadata } from "@/lib/file-utils";
import { FilePreview } from "@/components/file-preview";

interface QuickMessage {
  id: string;
  text: string;
  category: string;
}

interface MessageInputProps {
  conversationId: string;
  onSendMessage: (data: {
    content: string;
    type: "text" | "image" | "video" | "audio" | "document" | "contact" | "location";
    mediaUrl?: string;
    duration?: string;
    caption?: string;
    recorded?: boolean;
    replyToId?: string;
    metadata?: {
      audio_tags?: {
        title: string;
        artist: string;
        album?: string;
        year?: string;
        cover: string | null;
      };
      contact?: {
        id: string;
        name: string;
        email?: string;
        phone?: string;
        avatarUrl?: string;
      };
      location?: {
        latitude: number;
        longitude: number;
        address?: string;
        name?: string;
      };
    };
  }) => void;
  replyingTo: string | null;
  onCancelReply: () => void;
  replyMessage?: {
    content: string;
    sender?: {
      displayName: string;
    };
    type: string;
  } | null;
  disabled?: boolean;
  isPending?: boolean;
  canSend?: boolean;
  conversationStatus?: "active" | "waiting" | "closed";
  needsToStart?: boolean;
  onStartConversation?: () => void;
  onAssignConversation?: () => void;
}

export function MessageInput({ 
  conversationId, 
  onSendMessage, 
  replyingTo, 
  onCancelReply,
  replyMessage,
  disabled = false,
  isPending = false,
  canSend = true,
  conversationStatus = "active",
  needsToStart = false,
  onStartConversation,
  onAssignConversation,
}: MessageInputProps) {
  const [messageInput, setMessageInput] = useState("");
  const [showQuickMessages, setShowQuickMessages] = useState(false);
  const [quickMessages, setQuickMessages] = useState<QuickMessage[]>([]);
  const [loadingQuickMessages, setLoadingQuickMessages] = useState(false);
  const [correctingText, setCorrectingText] = useState(false);
  
  // Media states
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "video" | "audio" | "document" | null>(null);
  const [mediaCaption, setMediaCaption] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null);
  const [audioMetadata, setAudioMetadata] = useState<AudioMetadata | null>(null);
  
  // Recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingType, setRecordingType] = useState<"audio" | "video" | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  
  // Contact and Location states
  const [showContactDialog, setShowContactDialog] = useState(false);
  const [showLocationDialog, setShowLocationDialog] = useState(false);
  const [contactSearch, setContactSearch] = useState("");
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [contacts, setContacts] = useState<any[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [locationName, setLocationName] = useState("");
  const [gettingLocation, setGettingLocation] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const recordingIntervalRef = useRef<number | null>(null);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
      if (mediaRecorder) {
        mediaRecorder.stop();
      }
    };
  }, [mediaRecorder]);

  const requestMediaPermission = async (type: "camera" | "microphone" | "both") => {
    try {
      const constraints: MediaStreamConstraints = {};
      
      if (type === "camera" || type === "both") {
        constraints.video = true;
      }
      if (type === "microphone" || type === "both") {
        constraints.audio = true;
      }

      await navigator.mediaDevices.getUserMedia(constraints);
      return true;
    } catch (error) {
      console.error("Erro ao solicitar permissão:", error);
      toast.error(`Permissão de ${type === "camera" ? "câmera" : type === "microphone" ? "microfone" : "câmera e microfone"} negada`);
      return false;
    }
  };

  const handleCorrectText = async () => {
    if (!messageInput.trim()) {
      toast.error("Digite um texto para corrigir");
      return;
    }

    setCorrectingText(true);
    try {
      const response = await apiRequest<{ correctedText: string }>("/messages/correct-text", {
        method: "POST",
        body: JSON.stringify({ text: messageInput }),
      });
      setMessageInput(response.correctedText);
      toast.success("Texto corrigido com sucesso!");
    } catch (error: any) {
      toast.error(error.message || "Erro ao corrigir texto");
    } finally {
      setCorrectingText(false);
    }
  };

  const loadQuickMessages = async () => {
    setLoadingQuickMessages(true);
    try {
      const response = await apiRequest<{ quickMessages: QuickMessage[] }>("/quick-messages");
      setQuickMessages(response.quickMessages);
      setShowQuickMessages(true);
    } catch (error) {
      toast.error("Erro ao carregar mensagens prontas");
    } finally {
      setLoadingQuickMessages(false);
    }
  };

  const handleSelectQuickMessage = (text: string) => {
    setMessageInput(text);
    setShowQuickMessages(false);
  };

  const handleTakePhoto = async () => {
    const hasPermission = await requestMediaPermission("camera");
    if (!hasPermission) return;
    imageInputRef.current?.click();
  };

  const handleRecordVideo = async () => {
    const hasPermission = await requestMediaPermission("both");
    if (!hasPermission) return;
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: "video/webm" });
      
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };
      
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        setMediaPreview(url);
        setMediaType("video");
        setRecordedChunks([blob]);
        stream.getTracks().forEach(track => track.stop());
      };
      
      setMediaRecorder(recorder);
      setRecordingType("video");
      setRecordingTime(0);
      setIsRecording(true);
      recorder.start();
      
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream;
        videoPreviewRef.current.play();
      }
      
      recordingIntervalRef.current = window.setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      toast.error("Erro ao iniciar gravação de vídeo");
    }
  };

  const handleRecordAudio = async () => {
    const hasPermission = await requestMediaPermission("microphone");
    if (!hasPermission) return;
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };
      
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        setMediaPreview(url);
        setMediaType("audio");
        setRecordedChunks([blob]);
        stream.getTracks().forEach(track => track.stop());
      };
      
      setMediaRecorder(recorder);
      setRecordingType("audio");
      setRecordingTime(0);
      setIsRecording(true);
      recorder.start();
      
      recordingIntervalRef.current = window.setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      toast.error("Erro ao iniciar gravação de áudio");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
      setIsRecording(false);
      setMediaRecorder(null);
      
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
    }
  };

  const cancelRecording = () => {
    stopRecording();
    setRecordingType(null);
    setRecordingTime(0);
    setMediaPreview(null);
    setMediaType(null);
    setRecordedChunks([]);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, sourceType?: "image" | "video") => {
    const file = e.target.files?.[0];
    if (!file) return;

    const info = detectFileType(file);
    const url = URL.createObjectURL(file);
    
    // If sourceType is provided (from camera/video button), use it
    // Otherwise use the detected type
    const finalType = sourceType || info.type;
    
    // Convert detected file type to media type
    let mediaTypeValue: "image" | "video" | "audio" | "document" = "image";
    if (finalType === "video") mediaTypeValue = "video";
    else if (finalType === "audio") mediaTypeValue = "audio";
    else if (finalType === "document") mediaTypeValue = "document";
    else if (finalType === "image") mediaTypeValue = "image";
    
    setSelectedFile(file);
    setFileInfo(info);
    setMediaPreview(url);
    setMediaType(mediaTypeValue);
    setRecordedChunks([file]);

    // If it's an audio file, read metadata
    if (mediaTypeValue === "audio" && file instanceof File) {
      try {
        console.log("[MessageInput] Reading audio metadata for:", file.name);
        const metadata = await readAudioMetadata(file);
        console.log("[MessageInput] Audio metadata loaded:", metadata);
        setAudioMetadata(metadata);
        
        // Also set recording time from duration for display
        if (metadata.duration) {
          setRecordingTime(Math.floor(metadata.duration));
        }
      } catch (error) {
        console.error("[MessageInput] Error reading audio metadata:", error);
        setAudioMetadata(null);
      }
    } else {
      setAudioMetadata(null);
    }
  };

  const uploadMedia = async (file: Blob, type: "image" | "video" | "audio" | "document"): Promise<string> => {
    const formData = new FormData();
    
    // Determine file extension based on type and file
    let extension = "bin";
    if (file instanceof File) {
      const parts = file.name.split(".");
      extension = parts.length > 1 ? parts[parts.length - 1] : extension;
    } else {
      extension = type === "audio" ? "webm" : type === "video" ? "webm" : "jpg";
    }
    
    formData.append(type, file, `${type}-${Date.now()}.${extension}`);

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          const percentComplete = (e.loaded / e.total) * 100;
          setUploadProgress(Math.round(percentComplete));
        }
      });

      xhr.addEventListener("load", () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          resolve(response.url);
        } else {
          reject(new Error("Erro no upload"));
        }
      });

      xhr.addEventListener("error", () => reject(new Error("Erro no upload")));

      xhr.open("POST", `/api/upload/${type}`);
      xhr.setRequestHeader("Accept", "application/json");
      xhr.withCredentials = true;
      xhr.send(formData);
    });
  };

  const handleSendMedia = async () => {
    if (recordedChunks.length === 0 || !mediaType) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const file = recordedChunks[0];
      
      // Force read audio metadata before sending if it's an audio file and not already loaded
      let finalAudioMetadata = audioMetadata;
      if (mediaType === "audio" && file instanceof File && !audioMetadata) {
        try {
          finalAudioMetadata = await readAudioMetadata(file);
        } catch (error) {
          console.error("Error reading audio metadata before upload:", error);
        }
      }
      
      const mediaUrl = await uploadMedia(file, mediaType);
      
      // Duration from recording or from audio metadata
      let duration: string | undefined;
      if (recordingTime > 0) {
        duration = `${Math.floor(recordingTime / 60)}:${(recordingTime % 60).toString().padStart(2, "0")}`;
      } else if (finalAudioMetadata?.duration) {
        const totalSeconds = Math.floor(finalAudioMetadata.duration);
        duration = `${Math.floor(totalSeconds / 60)}:${(totalSeconds % 60).toString().padStart(2, "0")}`;
      }

      const defaultContent = 
        mediaType === "audio" ? "Áudio" :
        mediaType === "video" ? "Vídeo" :
        mediaType === "document" ? (fileInfo?.name || "Documento") :
        "Imagem";

      // Prepare metadata for audio files
      let metadata = undefined;
      if (mediaType === "audio" && finalAudioMetadata) {
        console.log("[MessageInput] Preparing audio metadata for send:", finalAudioMetadata);
        // Convert album art to base64 if available
        let coverData: string | null = null;
        if (finalAudioMetadata.picture) {
          const blob = new Blob([finalAudioMetadata.picture.data], { type: finalAudioMetadata.picture.format });
          const reader = new FileReader();
          coverData = await new Promise<string>((resolve) => {
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
          console.log("[MessageInput] Cover art converted to base64, length:", coverData?.length);
        }

        metadata = {
          audio_tags: {
            title: finalAudioMetadata.title || "Sem título",
            artist: finalAudioMetadata.artist || "Artista desconhecido",
            album: finalAudioMetadata.album,
            year: finalAudioMetadata.year,
            cover: coverData,
          },
        };
        console.log("[MessageInput] Final metadata to send:", metadata);
      } else {
        console.log("[MessageInput] No audio metadata to send, mediaType:", mediaType, "finalAudioMetadata:", finalAudioMetadata);
      }

      console.log("[MessageInput] Sending message with:", {
        content: mediaCaption || defaultContent,
        type: mediaType,
        mediaUrl,
        duration,
        hasMetadata: !!metadata,
        metadata
      });

      onSendMessage({
        content: mediaCaption || defaultContent,
        type: mediaType,
        mediaUrl,
        duration,
        caption: mediaCaption || undefined,
        recorded: !!recordingType,
        replyToId: replyingTo || undefined,
        metadata,
      });

      setMediaPreview(null);
      setMediaType(null);
      setMediaCaption("");
      setRecordedChunks([]);
      setRecordingTime(0);
      setRecordingType(null);
      setSelectedFile(null);
      setFileInfo(null);
      setAudioMetadata(null);
      toast.success("Mídia enviada com sucesso!");
    } catch (error) {
      toast.error("Erro ao enviar mídia");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleSendText = () => {
    if (!messageInput.trim()) return;
    
    onSendMessage({
      content: messageInput,
      type: "text",
      replyToId: replyingTo || undefined,
    });
    
    setMessageInput("");
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Load contacts for sending
  const loadContacts = async () => {
    setLoadingContacts(true);
    try {
      const response = await apiRequest<{ users: any[] }>("/users?role=client");
      setContacts(response.users || []);
    } catch (error) {
      toast.error("Erro ao carregar contatos");
    } finally {
      setLoadingContacts(false);
    }
  };

  // Handle send contact
  const handleSendContact = async () => {
    if (!selectedContactId) {
      toast.error("Selecione um contato");
      return;
    }

    const contact = contacts.find(c => c.id === selectedContactId);
    if (!contact) return;

    onSendMessage({
      content: `Contato: ${contact.displayName}`,
      type: "contact",
      replyToId: replyingTo || undefined,
      metadata: {
        contact: {
          id: contact.id,
          name: contact.displayName,
          email: contact.email,
          phone: contact.phone,
          avatarUrl: contact.avatarUrl,
        },
      },
    });

    setShowContactDialog(false);
    setSelectedContactId(null);
    setContactSearch("");
    toast.success("Contato enviado!");
  };

  // Handle send location
  const handleSendLocation = async () => {
    setGettingLocation(true);
    
    try {
      // Get current position
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        });
      });

      const { latitude, longitude } = position.coords;
      
      // Try to get address from coordinates
      let address = "";
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=pt-BR`
        );
        const data = await response.json();
        if (data.display_name) {
          address = data.display_name;
        }
      } catch (error) {
        console.error("Error getting address:", error);
      }

      onSendMessage({
        content: `Localização${locationName ? `: ${locationName}` : ""}`,
        type: "location",
        replyToId: replyingTo || undefined,
        metadata: {
          location: {
            latitude,
            longitude,
            address: address || undefined,
            name: locationName || undefined,
          },
        },
      });

      setShowLocationDialog(false);
      setLocationName("");
      toast.success("Localização enviada!");
    } catch (error: any) {
      if (error.code === 1) {
        toast.error("Permissão de localização negada");
      } else {
        toast.error("Erro ao obter localização");
      }
    } finally {
      setGettingLocation(false);
    }
  };

  // Open contact dialog and load contacts
  const handleOpenContactDialog = () => {
    setShowContactDialog(true);
    if (contacts.length === 0) {
      loadContacts();
    }
  };

  const filteredContacts = contacts.filter(contact =>
    contact.displayName.toLowerCase().includes(contactSearch.toLowerCase()) ||
    contact.email?.toLowerCase().includes(contactSearch.toLowerCase())
  );

  // Show appropriate message based on conversation status
  if (conversationStatus === "waiting") {
    return (
      <div className="p-4 bg-card/30 border-t border-border shrink-0">
        <div className="flex flex-col items-center justify-center gap-2 text-center py-4">
          <p className="text-sm text-muted-foreground">
            {needsToStart 
              ? "É necessário iniciar a conversa antes de enviar mensagens"
              : "Esta conversa está aguardando um atendente"}
          </p>
          {needsToStart && onStartConversation && (
            <Button onClick={onStartConversation} data-testid="button-start-conversation">
              Iniciar Conversa
            </Button>
          )}
          {!needsToStart && onAssignConversation && (
            <Button onClick={onAssignConversation} data-testid="button-assign-conversation">
              Assumir Conversa
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (conversationStatus === "closed") {
    return (
      <div className="p-4 bg-card/30 border-t border-border shrink-0">
        <div className="flex flex-col items-center justify-center gap-2 text-center py-4">
          <p className="text-sm text-muted-foreground">
            Esta conversa está encerrada. Não é possível enviar mensagens.
          </p>
        </div>
      </div>
    );
  }

  if (!canSend) {
    return (
      <div className="p-4 bg-card/30 border-t border-border shrink-0">
        <div className="flex flex-col items-center justify-center gap-2 text-center py-4">
          <p className="text-sm text-muted-foreground">
            Apenas o atendente vinculado pode enviar mensagens nesta conversa
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-card/30 border-t border-border shrink-0">
        {/* Reply Preview */}
        {replyingTo && replyMessage && (
          <div className="px-4 pt-3 pb-2 border-b border-border/50">
            <div className="flex items-start gap-2 bg-accent/50 rounded-lg p-3 border-l-4 border-primary">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Reply className="h-3.5 w-3.5 opacity-70" />
                  <span className="text-xs font-semibold opacity-90">
                    Respondendo a {replyMessage.sender?.displayName || "Mensagem"}
                  </span>
                </div>
                <p className="text-sm opacity-80 whitespace-pre-wrap break-words max-h-32 overflow-y-auto">
                  {replyMessage.content || (
                    replyMessage.type === 'image' ? '📷 Imagem' : 
                    replyMessage.type === 'audio' ? '🎵 Áudio' : 
                    replyMessage.type === 'video' ? '🎬 Vídeo' : 
                    '📎 Arquivo'
                  )}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0"
                onClick={onCancelReply}
                data-testid="button-cancel-reply"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}

        <div className="p-4">
          <div className="flex items-end gap-2">
            <div className="flex-1 relative bg-background/50 rounded-lg flex items-end">
              <Textarea
                placeholder="Digite uma mensagem..."
                className="flex-1 bg-transparent border-0 focus-visible:ring-0 resize-none min-h-[44px] max-h-32 py-3 pl-3 pr-2"
                data-testid="input-message"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendText();
                  }
                }}
                rows={1}
                disabled={disabled}
              />
            <div className="flex items-center gap-1 pb-2 pr-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={handleCorrectText}
                disabled={!messageInput.trim() || correctingText}
                title="Corrigir texto com IA"
                data-testid="button-ai-correct"
              >
                {correctingText ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={loadQuickMessages}
                disabled={loadingQuickMessages}
                title="Mensagens prontas"
                data-testid="button-quick-messages"
              >
                <MessageSquare className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={handleTakePhoto}
                title="Tirar foto"
                data-testid="button-take-photo"
              >
                <Camera className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={handleRecordVideo}
                title="Gravar vídeo"
                data-testid="button-record-video"
              >
                <Video className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={handleRecordAudio}
                title="Gravar áudio"
                data-testid="button-record-audio"
              >
                <Mic className="h-4 w-4" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    title="Enviar anexo"
                    data-testid="button-attach"
                  >
                    <Paperclip className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" side="top" className="w-48">
                  <DropdownMenuItem onClick={() => fileInputRef.current?.click()} data-testid="menu-send-document">
                    <FileText className="mr-2 h-4 w-4" />
                    Enviar Documento
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleOpenContactDialog} data-testid="menu-send-contact">
                    <UserCircle className="mr-2 h-4 w-4" />
                    Contato
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowLocationDialog(true)} data-testid="menu-send-location">
                    <MapPin className="mr-2 h-4 w-4" />
                    Localização
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <Button
            size="icon"
            className="h-12 w-12 rounded-full shadow-lg shrink-0"
            data-testid="button-send"
            onClick={handleSendText}
            disabled={!messageInput.trim() || isPending || disabled}
          >
            {isPending ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <Send className="h-6 w-6" />
            )}
          </Button>
        </div>
        </div>
      </div>

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="*/*"
        className="hidden"
        onChange={(e) => handleFileSelect(e)}
        data-testid="input-file"
      />
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handleFileSelect(e, "image")}
        data-testid="input-image"
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handleFileSelect(e, "video")}
        data-testid="input-video"
      />

      {/* Quick Messages Dialog */}
      <Dialog open={showQuickMessages} onOpenChange={setShowQuickMessages}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Mensagens Prontas</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[400px]">
            <div className="space-y-2">
              {quickMessages.map((msg) => (
                <button
                  key={msg.id}
                  className="w-full text-left p-3 rounded-lg bg-card hover:bg-accent transition-colors"
                  onClick={() => handleSelectQuickMessage(msg.text)}
                  data-testid={`quick-message-${msg.id}`}
                >
                  <p className="text-sm">{msg.text}</p>
                  <p className="text-xs text-muted-foreground mt-1">{msg.category}</p>
                </button>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Recording Dialog */}
      <Dialog open={isRecording} onOpenChange={() => !isRecording && setIsRecording(false)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>
              {recordingType === "audio" ? "Gravando Áudio" : "Gravando Vídeo"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {recordingType === "video" && (
              <video
                ref={videoPreviewRef}
                className="w-full rounded-lg bg-black"
                autoPlay
                muted
              />
            )}
            <div className="flex items-center justify-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                <span className="text-2xl font-mono">{formatTime(recordingTime)}</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={cancelRecording}>
              <X className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
            <Button onClick={stopRecording} data-testid="button-stop-recording">
              <Square className="mr-2 h-4 w-4" />
              Parar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Media Preview Dialog */}
      <Dialog open={!!mediaPreview && !isRecording} onOpenChange={(open) => {
        if (!open) {
          setMediaPreview(null);
          setMediaType(null);
          setMediaCaption("");
          setRecordedChunks([]);
          setSelectedFile(null);
          setFileInfo(null);
        }
      }}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isUploading ? "Enviando..." : "Enviar Mídia"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* File Preview */}
            {mediaPreview && selectedFile && fileInfo && (
              <FilePreview 
                file={selectedFile} 
                fileInfo={fileInfo} 
                previewUrl={mediaPreview}
              />
            )}
            
            {/* Fallback for recorded media without file info */}
            {mediaPreview && !selectedFile && (
              <>
                {mediaType === "image" && (
                  <img src={mediaPreview} alt="Preview" className="w-full rounded-lg" />
                )}
                {mediaType === "video" && (
                  <video src={mediaPreview} controls className="w-full rounded-lg" />
                )}
                {mediaType === "audio" && (
                  <div className="p-8 bg-card rounded-lg flex flex-col items-center gap-4">
                    <Mic className="h-12 w-12 opacity-30" />
                    <audio src={mediaPreview} controls className="w-full" />
                    {recordingTime > 0 && (
                      <p className="text-sm text-muted-foreground">
                        Duração: {formatTime(recordingTime)}
                      </p>
                    )}
                  </div>
                )}
              </>
            )}
            
            {!isUploading && (
              <Textarea
                placeholder="Adicionar legenda (opcional)"
                value={mediaCaption}
                onChange={(e) => setMediaCaption(e.target.value)}
                rows={2}
                data-testid="input-caption"
              />
            )}
            {isUploading && (
              <div className="space-y-2">
                <Progress value={uploadProgress} />
                <p className="text-sm text-center text-muted-foreground">
                  {uploadProgress}%
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setMediaPreview(null);
                setMediaType(null);
                setMediaCaption("");
                setRecordedChunks([]);
                setSelectedFile(null);
                setFileInfo(null);
              }}
              disabled={isUploading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSendMedia}
              disabled={isUploading}
              data-testid="button-send-media"
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Enviar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Contact Dialog */}
      <Dialog open={showContactDialog} onOpenChange={setShowContactDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Enviar Contato</DialogTitle>
            <DialogDescription>
              Selecione um contato para enviar na conversa
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar contato..."
                value={contactSearch}
                onChange={(e) => setContactSearch(e.target.value)}
                className="pl-9"
                data-testid="input-search-contact"
              />
            </div>

            <ScrollArea className="h-[400px] pr-4">
              {loadingContacts ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredContacts.length > 0 ? (
                <div className="space-y-1">
                  {filteredContacts.map((contact) => (
                    <div
                      key={contact.id}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors",
                        selectedContactId === contact.id
                          ? "bg-primary/10 hover:bg-primary/20 border-2 border-primary"
                          : "hover:bg-accent/50 border-2 border-transparent"
                      )}
                      onClick={() => setSelectedContactId(contact.id)}
                      data-testid={`contact-item-${contact.id}`}
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={contact.avatarUrl || undefined} />
                        <AvatarFallback>
                          {contact.displayName.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{contact.displayName}</p>
                        <p className="text-sm text-muted-foreground truncate">
                          {contact.email || contact.phone || "Sem informações"}
                        </p>
                      </div>
                      {selectedContactId === contact.id && (
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <UserCircle className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-sm text-muted-foreground">
                    {contactSearch ? "Nenhum contato encontrado" : "Nenhum contato disponível"}
                  </p>
                </div>
              )}
            </ScrollArea>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowContactDialog(false);
                setSelectedContactId(null);
                setContactSearch("");
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSendContact}
              disabled={!selectedContactId}
              data-testid="button-send-contact"
            >
              <Send className="mr-2 h-4 w-4" />
              Enviar Contato
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Location Dialog */}
      <Dialog open={showLocationDialog} onOpenChange={setShowLocationDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Enviar Localização</DialogTitle>
            <DialogDescription>
              Compartilhe sua localização atual na conversa
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-muted/50 rounded-lg flex items-center gap-3">
              <MapPin className="h-8 w-8 text-primary" />
              <div className="flex-1">
                <p className="text-sm font-medium">Localização GPS</p>
                <p className="text-xs text-muted-foreground">
                  Sua localização atual será compartilhada
                </p>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Nome do local (opcional)
              </label>
              <Input
                placeholder="Ex: Minha casa, Escritório..."
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                data-testid="input-location-name"
              />
            </div>

            <div className="text-xs text-muted-foreground bg-yellow-500/10 border border-yellow-500/20 rounded p-3">
              <p className="font-medium text-yellow-700 dark:text-yellow-400 mb-1">
                Atenção
              </p>
              <p>
                Ao enviar sua localização, você compartilhará suas coordenadas GPS com o destinatário.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowLocationDialog(false);
                setLocationName("");
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSendLocation}
              disabled={gettingLocation}
              data-testid="button-send-location"
            >
              {gettingLocation ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Obtendo...
                </>
              ) : (
                <>
                  <MapPin className="mr-2 h-4 w-4" />
                  Enviar Localização
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
