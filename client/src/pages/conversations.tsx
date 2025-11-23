import { MainLayout } from "@/components/layout/main-layout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Search, Send, Phone, Video, MoreVertical, Smile, Paperclip, ArrowLeft, MessageSquare, CornerDownRight, Quote, Trash2, Play, Pause, Mic, Image as ImageIcon, Film, File, Disc, Music } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useLocation, useRoute } from "wouter";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { useRef, useEffect, useState } from "react";
import { Slider } from "@/components/ui/slider";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import jsmediatags from "jsmediatags";

// Assets
import mp3File from "@assets/13. Behind Enemy Lines_1763919687567.mp3";
import videoFile from "@assets/9312ac4fd6cf30b9cabb0eb07b5bc517_1763919709453.mp4";

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
  { id: 1, conversationId: 1, sender: "me", content: "Oi Ana, tudo bem?", time: "10:30", type: "text" },
  { id: 2, conversationId: 1, sender: "other", content: "Oii! Tudo ótimo por aqui e com você?", time: "10:32", type: "text" },
  { id: 3, conversationId: 1, sender: "me", content: "Tudo certo. Viu o projeto novo?", time: "10:33", type: "text" },
  { id: 4, conversationId: 1, sender: "other", content: "Sim! Ficou incrível o design.", time: "10:35", type: "text" },
  { id: 5, conversationId: 1, sender: "other", content: "Acho que só precisamos ajustar aquele detalhe no header.", time: "10:35", replyTo: 3, type: "text" },
  { id: 6, conversationId: 1, sender: "me", content: "Verdade. Vou mexer nisso agora.", time: "10:40", replyTo: 5, type: "text" },
  { id: 7, conversationId: 1, sender: "other", content: "Combinado! Até logo.", time: "10:42", type: "text" },
  { id: 8, conversationId: 1, sender: "other", content: "Encaminhando o orçamento que você pediu.", time: "10:45", forwarded: true, type: "text" },
  { id: 9, conversationId: 1, sender: "me", content: "Mensagem apagada", time: "10:46", deleted: true, type: "text" },
  
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
    // Metadata initially null, will be fetched
    metadata: null
  },
  
  // Uploaded MP3 without ID3
  { id: 15, conversationId: 1, sender: "me", content: "", time: "11:00", type: "audio", mediaUrl: "#", duration: "2:15", caption: "Audio_sem_tags.mp3" },

  { id: 101, conversationId: 2, sender: "other", content: "Você viu o novo layout?", time: "Ontem", type: "text" },
  { id: 102, conversationId: 2, sender: "me", content: "Ainda não, vou olhar agora!", time: "Ontem", type: "text" },
];

export default function Conversations() {
  const [location, setLocation] = useLocation();
  const [match, params] = useRoute("/conversations/webchat/:id");
  const isChatOpen = !!match;
  const conversationId = Number(params?.id);
  const currentContact = contacts.find(c => c.id === conversationId) || contacts[0];
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  
  // Audio Player State
  const [playingId, setPlayingId] = useState<number | null>(null);
  const [audioProgress, setAudioProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const filteredMessages = messages.filter(m => m.conversationId === (conversationId || 1));

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [filteredMessages, conversationId]);

  // Fetch ID3 Tags
  useEffect(() => {
    const fetchTags = async () => {
      // Work with a deep copy if necessary, or just map
      const newMessages = [...messages];
      let hasUpdates = false;

      for (let i = 0; i < newMessages.length; i++) {
        const msg = newMessages[i];
        if (msg.type === 'audio' && msg.mediaUrl && !msg.metadata && !msg.recorded && msg.mediaUrl.startsWith('/assets/')) {
           // Attempt to read tags for local assets
           try {
             const response = await fetch(msg.mediaUrl);
             const blob = await response.blob();
             
             await new Promise((resolve) => {
               // @ts-ignore - jsmediatags types might be tricky with import
               jsmediatags.read(blob, {
                 onSuccess: (tag: any) => {
                   const { tags } = tag;
                   let cover = null;
                   if (tags.picture) {
                     const { data, format } = tags.picture;
                     let base64String = "";
                     for (let j = 0; j < data.length; j++) {
                       base64String += String.fromCharCode(data[j]);
                     }
                     cover = `data:${format};base64,${window.btoa(base64String)}`;
                   }
                   
                   newMessages[i] = {
                     ...msg,
                     metadata: {
                       title: tags.title || "Sem título",
                       artist: tags.artist || "Desconhecido",
                       cover: cover
                     }
                   };
                   hasUpdates = true;
                   resolve(true);
                 },
                 onError: (error: any) => {
                   console.log("Error reading tags:", error);
                   resolve(false);
                 }
               });
             });
           } catch (e) {
             console.log("Error fetching audio file:", e);
           }
        }
      }
      
      if (hasUpdates) {
        setMessages(newMessages);
      }
    };

    fetchTags();
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

  return (
    <MainLayout>
      <div className="flex h-[calc(100vh-8rem)] gap-6 overflow-hidden">
        {/* Contacts List */}
        <Card className={cn(
          "flex flex-col h-full border-border/50 bg-card/50 backdrop-blur shrink-0 transition-all duration-300",
          isChatOpen ? "hidden md:flex md:w-80 lg:w-96" : "flex w-full md:w-80 lg:w-96"
        )}>
          <div className="p-4 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar conversas..." className="pl-9 bg-background/50" />
            </div>
          </div>
          <ScrollArea className="flex-1">
            <div className="space-y-1 p-2">
              {contacts.map((contact) => (
                <Link key={contact.id} href={`/conversations/webchat/${contact.id}`}>
                  <a className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors text-left group cursor-pointer",
                    conversationId === contact.id ? "bg-accent/60" : ""
                  )}>
                    <div className="relative shrink-0">
                      <Avatar>
                        <AvatarImage src={contact.avatar} />
                        <AvatarFallback>{contact.name.substring(0, 2)}</AvatarFallback>
                      </Avatar>
                      {contact.status === "Online" && (
                        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-card" />
                      )}
                    </div>
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
                  </a>
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
                    <Button variant="ghost" size="icon" className="md:hidden">
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
                  <Button variant="ghost" size="icon"><Phone className="h-5 w-5" /></Button>
                  <Button variant="ghost" size="icon"><Video className="h-5 w-5" /></Button>
                  <Separator orientation="vertical" className="h-6 mx-1" />
                  <Button variant="ghost" size="icon"><MoreVertical className="h-5 w-5" /></Button>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4 bg-background/20">
                <div className="space-y-6">
                  {filteredMessages.map((msg, index) => {
                    const replyMsg = msg.replyTo ? getReplyMessage(msg.replyTo) : null;
                    
                    if (msg.deleted) {
                      return (
                        <div key={msg.id} className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"} transition-colors duration-500 rounded-lg p-1`}>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground italic border border-dashed border-border px-3 py-2 rounded-lg select-none">
                            <Trash2 className="h-3 w-3" />
                            Mensagem apagada
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={msg.id}
                        id={`message-${msg.id}`}
                        className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"} transition-colors duration-500 rounded-lg p-1`}
                      >
                        <div className="flex flex-col max-w-[85%] md:max-w-[70%]">
                          {/* Labels */}
                          {msg.forwarded && (
                            <div className="flex items-center text-xs text-muted-foreground mb-1 italic">
                              <CornerDownRight className="h-3 w-3 mr-1" />
                              Encaminhada
                            </div>
                          )}
                          {msg.replyTo && !replyMsg && (
                             <div className="flex items-center text-xs text-muted-foreground mb-1 italic">
                              <Quote className="h-3 w-3 mr-1" />
                              Respondendo
                            </div>
                          )}

                          <div
                            className={cn(
                              "relative rounded-2xl px-4 py-2.5 shadow-sm overflow-hidden",
                              msg.sender === "me"
                                ? "bg-violet-900/90 text-white rounded-br-none" // Darker purple for sender
                                : "bg-slate-800/90 text-white rounded-bl-none"  // Dark slate for receiver
                            )}
                          >
                            {/* Reply Preview */}
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
                                <div className="font-semibold mb-0.5 flex items-center gap-1">
                                  <Quote className="h-3 w-3" />
                                  {replyMsg.sender === "me" ? "Você" : currentContact.name}
                                </div>
                                <p className="truncate opacity-90">{replyMsg.content || (replyMsg.type === 'image' ? '📷 Imagem' : replyMsg.type === 'audio' ? '🎤 Áudio' : 'Arquivo')}</p>
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
                                />
                                {msg.caption && <p className="text-sm">{msg.caption}</p>}
                              </div>
                            )}

                            {msg.type === 'video' && (
                              <div className="space-y-2 min-w-[250px]">
                                {msg.recorded ? (
                                   <div className="relative bg-black rounded-lg overflow-hidden aspect-[9/16] max-h-[300px] flex items-center justify-center border-2 border-white/20">
                                      <video src={msg.mediaUrl} controls className="w-full h-full object-cover" />
                                      <div className="absolute top-2 right-2 bg-red-500/80 text-white text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">
                                        <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> REC
                                      </div>
                                   </div>
                                ) : (
                                  <div className="rounded-lg overflow-hidden bg-black/20">
                                     <video src={msg.mediaUrl} controls className="w-full max-h-[400px]" poster="https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=500&auto=format&fit=crop&q=60" />
                                  </div>
                                )}
                                {(msg.caption || !msg.recorded) && <p className="text-sm flex items-center gap-1"><Film className="h-3 w-3" /> {msg.caption || "Vídeo"}</p>}
                              </div>
                            )}

                            {msg.type === 'audio' && (
                              <div className="min-w-[240px]">
                                {msg.metadata ? (
                                  // ID3 Tag Style
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
                                  // Recorded Audio Style
                                  <div className="flex items-center gap-2 mb-2 bg-black/20 p-2 rounded-lg">
                                    <Mic className="h-4 w-4 opacity-80" />
                                    <span className="text-xs font-medium opacity-90">Mensagem de Voz</span>
                                  </div>
                                ) : (
                                  // Generic File Style
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
                                  >
                                    {playingId === msg.id ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current" />}
                                  </Button>
                                  <div className="flex-1 space-y-1">
                                     {msg.recorded ? (
                                       <div className="h-6 flex items-center gap-0.5 opacity-80">
                                          {[...Array(20)].map((_, i) => (
                                            <div 
                                              key={i} 
                                              className={cn(
                                                "w-1 rounded-full transition-all duration-300 bg-white", 
                                                i < 8 ? "h-2 opacity-50" : i < 15 ? "h-4" : "h-3 opacity-70",
                                                playingId === msg.id && "animate-pulse"
                                              )}
                                            />
                                          ))}
                                       </div>
                                     ) : (
                                       <Slider 
                                        value={[playingId === msg.id ? audioProgress : 0]} 
                                        max={100} 
                                        step={1} 
                                        className="w-full [&_.bg-primary]:bg-white"
                                       />
                                     )}
                                     <div className="flex justify-between text-[10px] opacity-70">
                                       <span>{playingId === msg.id ? "Reproduzindo" : "0:00"}</span>
                                       <span>{msg.duration}</span>
                                     </div>
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            {/* Timestamp */}
                            <div className="flex items-center justify-end gap-1 mt-1 opacity-70">
                              <p className="text-[10px] text-right">
                                {msg.time}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={scrollRef} />
                </div>
              </ScrollArea>

              {/* Input Area */}
              <div className="p-4 border-t border-border bg-card/30 shrink-0">
                <div className="flex items-end gap-2">
                   <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-foreground">
                        <Paperclip className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem><ImageIcon className="mr-2 h-4 w-4" /> Foto</DropdownMenuItem>
                      <DropdownMenuItem><Video className="mr-2 h-4 w-4" /> Vídeo</DropdownMenuItem>
                      <DropdownMenuItem><File className="mr-2 h-4 w-4" /> Documento</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <div className="relative flex-1">
                    <Input 
                      placeholder="Digite sua mensagem..." 
                      className="pr-10 bg-background/50 border-border focus-visible:ring-primary" 
                    />
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="absolute right-0 top-0 text-muted-foreground hover:text-foreground"
                    >
                      <Smile className="h-5 w-5" />
                    </Button>
                  </div>
                  
                  <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-foreground">
                    <Mic className="h-5 w-5" />
                  </Button>

                  <Button size="icon" className="shrink-0 bg-primary hover:bg-primary/90">
                    <Send className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground space-y-4">
              <div className="h-20 w-20 rounded-full bg-accent/30 flex items-center justify-center">
                <MessageSquare className="h-10 w-10 opacity-50" />
              </div>
              <p className="text-lg font-medium">Selecione uma conversa para começar</p>
            </div>
          )}
        </Card>
      </div>
    </MainLayout>
  );
}
