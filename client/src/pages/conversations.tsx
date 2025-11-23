import { MainLayout } from "@/components/layout/main-layout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Search, Send, Phone, Video, MoreVertical, Smile, Paperclip, ArrowLeft, MessageSquare, CornerDownRight, Quote, Reply } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useLocation, useRoute } from "wouter";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { useRef, useEffect } from "react";

const contacts = [
  { id: 1, name: "Ana Silva", status: "Online", lastMessage: "Combinado! Até logo.", time: "10:42", unread: 2, avatar: "https://i.pravatar.cc/150?u=1" },
  { id: 2, name: "Carlos Oliveira", status: "Offline", lastMessage: "Você viu o novo layout?", time: "Ontem", unread: 0, avatar: "https://i.pravatar.cc/150?u=2" },
  { id: 3, name: "Equipe de Design", status: "Online", lastMessage: "João: Precisamos aprovar o...", time: "Segunda", unread: 5, avatar: "https://i.pravatar.cc/150?u=3" },
  { id: 4, name: "Mariana Costa", status: "Online", lastMessage: "Te envio o arquivo já.", time: "10:05", unread: 0, avatar: "https://i.pravatar.cc/150?u=4" },
  { id: 5, name: "Roberto Santos", status: "Ausente", lastMessage: "Ok.", time: "09:30", unread: 0, avatar: "https://i.pravatar.cc/150?u=5" },
  { id: 6, name: "Julia Pereira", status: "Online", lastMessage: "Vamos almoçar?", time: "09:15", unread: 1, avatar: "https://i.pravatar.cc/150?u=6" },
];

const allMessages = [
  { id: 1, conversationId: 1, sender: "me", content: "Oi Ana, tudo bem?", time: "10:30" },
  { id: 2, conversationId: 1, sender: "other", content: "Oii! Tudo ótimo por aqui e com você?", time: "10:32" },
  { id: 3, conversationId: 1, sender: "me", content: "Tudo certo. Viu o projeto novo?", time: "10:33" },
  { id: 4, conversationId: 1, sender: "other", content: "Sim! Ficou incrível o design.", time: "10:35" },
  { id: 5, conversationId: 1, sender: "other", content: "Acho que só precisamos ajustar aquele detalhe no header.", time: "10:35", replyTo: 3 },
  { id: 6, conversationId: 1, sender: "me", content: "Verdade. Vou mexer nisso agora.", time: "10:40", replyTo: 5 },
  { id: 7, conversationId: 1, sender: "other", content: "Combinado! Até logo.", time: "10:42" },
  { id: 8, conversationId: 1, sender: "other", content: "Encaminhando o orçamento que você pediu.", time: "10:45", forwarded: true },
  
  { id: 101, conversationId: 2, sender: "other", content: "Você viu o novo layout?", time: "Ontem" },
  { id: 102, conversationId: 2, sender: "me", content: "Ainda não, vou olhar agora!", time: "Ontem" },
];

export default function Conversations() {
  const [location, setLocation] = useLocation();
  const [match, params] = useRoute("/conversations/webchat/:id");
  const isChatOpen = !!match;
  const conversationId = Number(params?.id);
  const currentContact = contacts.find(c => c.id === conversationId) || contacts[0];
  
  const scrollRef = useRef<HTMLDivElement>(null);

  // Filter messages for current conversation
  // In a real app this would be fetched from an API
  const messages = allMessages.filter(m => m.conversationId === (conversationId || 1));

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, conversationId]);

  const scrollToMessage = (messageId: number) => {
    const element = document.getElementById(`message-${messageId}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      element.classList.add("bg-accent/50");
      setTimeout(() => element.classList.remove("bg-accent/50"), 1000);
    }
  };

  const getReplyMessage = (replyId: number) => {
    return allMessages.find(m => m.id === replyId);
  };

  return (
    <MainLayout>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 h-[calc(100vh-8rem)]">
        {/* Contacts List - Hidden on mobile if chat is open */}
        <Card className={cn(
          "md:col-span-1 flex flex-col h-full border-border/50 bg-card/50 backdrop-blur",
          isChatOpen ? "hidden md:flex" : "flex"
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
                    <div className="relative">
                      <Avatar>
                        <AvatarImage src={contact.avatar} />
                        <AvatarFallback>{contact.name.substring(0, 2)}</AvatarFallback>
                      </Avatar>
                      {contact.status === "Online" && (
                        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-card" />
                      )}
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium truncate">{contact.name}</span>
                        <span className="text-xs text-muted-foreground">{contact.time}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground truncate max-w-[85%] group-hover:text-foreground transition-colors">
                          {contact.lastMessage}
                        </span>
                        {contact.unread > 0 && (
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground font-bold">
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
          "md:col-span-2 lg:col-span-3 flex flex-col h-full border-border/50 bg-card/50 backdrop-blur overflow-hidden",
          !isChatOpen ? "hidden md:flex" : "flex"
        )}>
          {isChatOpen ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-border flex items-center justify-between bg-card/30">
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
                  {messages.map((msg, index) => {
                    const replyMsg = msg.replyTo ? getReplyMessage(msg.replyTo) : null;
                    const isLast = index === messages.length - 1;
                    
                    return (
                      <div
                        key={msg.id}
                        id={`message-${msg.id}`}
                        className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"} transition-colors duration-500 rounded-lg p-1`}
                      >
                        <div className="flex flex-col max-w-[70%]">
                          {/* Forwarded Label */}
                          {msg.forwarded && (
                            <div className="flex items-center text-xs text-muted-foreground mb-1 italic">
                              <CornerDownRight className="h-3 w-3 mr-1" />
                              Encaminhada
                            </div>
                          )}

                          <div
                            className={cn(
                              "relative rounded-2xl px-4 py-2.5 shadow-sm",
                              msg.sender === "me"
                                ? "bg-primary text-primary-foreground rounded-br-none"
                                : "bg-secondary text-secondary-foreground rounded-bl-none"
                            )}
                          >
                            {/* Reply Preview */}
                            {replyMsg && (
                              <div 
                                className={cn(
                                  "mb-2 p-2 rounded text-xs cursor-pointer border-l-4 relative overflow-hidden group",
                                  msg.sender === "me" 
                                    ? "bg-primary-foreground/10 border-primary-foreground/50 hover:bg-primary-foreground/20" 
                                    : "bg-background/10 border-foreground/20 hover:bg-background/20"
                                )}
                                onClick={() => scrollToMessage(replyMsg.id)}
                              >
                                <div className="font-semibold mb-0.5 flex items-center gap-1">
                                  <Quote className="h-3 w-3" />
                                  {replyMsg.sender === "me" ? "Você" : currentContact.name}
                                </div>
                                <p className="truncate opacity-90">{replyMsg.content}</p>
                              </div>
                            )}

                            {/* Message Content */}
                            <p className="text-sm leading-relaxed">{msg.content}</p>
                            
                            {/* Timestamp */}
                            <p className={`text-[10px] mt-1 text-right ${msg.sender === "me" ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                              {msg.time}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={scrollRef} />
                </div>
              </ScrollArea>

              {/* Input Area */}
              <div className="p-4 border-t border-border bg-card/30">
                <div className="flex items-end gap-2">
                  <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-foreground">
                    <Paperclip className="h-5 w-5" />
                  </Button>
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
