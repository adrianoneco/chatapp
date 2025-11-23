import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Search, Send, Phone, Video, MoreVertical, Smile, Paperclip } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function Home() {
  const contacts = [
    { id: 1, name: "Ana Silva", status: "Online", lastMessage: "Combinado! Até logo.", time: "10:42", unread: 2, avatar: "https://i.pravatar.cc/150?u=1" },
    { id: 2, name: "Carlos Oliveira", status: "Offline", lastMessage: "Você viu o novo layout?", time: "Ontem", unread: 0, avatar: "https://i.pravatar.cc/150?u=2" },
    { id: 3, name: "Equipe de Design", status: "Online", lastMessage: "João: Precisamos aprovar o...", time: "Segunda", unread: 5, avatar: "https://i.pravatar.cc/150?u=3" },
    { id: 4, name: "Mariana Costa", status: "Online", lastMessage: "Te envio o arquivo já.", time: "10:05", unread: 0, avatar: "https://i.pravatar.cc/150?u=4" },
    { id: 5, name: "Roberto Santos", status: "Ausente", lastMessage: "Ok.", time: "09:30", unread: 0, avatar: "https://i.pravatar.cc/150?u=5" },
    { id: 6, name: "Julia Pereira", status: "Online", lastMessage: "Vamos almoçar?", time: "09:15", unread: 1, avatar: "https://i.pravatar.cc/150?u=6" },
  ];

  const messages = [
    { id: 1, sender: "me", content: "Oi Ana, tudo bem?", time: "10:30" },
    { id: 2, sender: "other", content: "Oii! Tudo ótimo por aqui e com você?", time: "10:32" },
    { id: 3, sender: "me", content: "Tudo certo. Viu o projeto novo?", time: "10:33" },
    { id: 4, sender: "other", content: "Sim! Ficou incrível o design.", time: "10:35" },
    { id: 5, sender: "other", content: "Acho que só precisamos ajustar aquele detalhe no header.", time: "10:35" },
    { id: 6, sender: "me", content: "Verdade. Vou mexer nisso agora.", time: "10:40" },
    { id: 7, sender: "other", content: "Combinado! Até logo.", time: "10:42" },
  ];

  return (
    <MainLayout>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 h-[calc(100vh-8rem)]">
        {/* Contacts List */}
        <Card className="md:col-span-1 flex flex-col h-full border-border/50 bg-card/50 backdrop-blur">
          <div className="p-4 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar conversas..." className="pl-9 bg-background/50" />
            </div>
          </div>
          <ScrollArea className="flex-1">
            <div className="space-y-1 p-2">
              {contacts.map((contact) => (
                <button
                  key={contact.id}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors text-left group"
                >
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
                </button>
              ))}
            </div>
          </ScrollArea>
        </Card>

        {/* Chat Area */}
        <Card className="md:col-span-2 lg:col-span-3 flex flex-col h-full border-border/50 bg-card/50 backdrop-blur overflow-hidden">
          {/* Chat Header */}
          <div className="p-4 border-b border-border flex items-center justify-between bg-card/30">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src="https://i.pravatar.cc/150?u=1" />
                <AvatarFallback>AS</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold">Ana Silva</h3>
                <p className="text-xs text-green-500 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500" /> Online
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
            <div className="space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[70%] rounded-2xl px-4 py-2.5 shadow-sm ${
                      msg.sender === "me"
                        ? "bg-primary text-primary-foreground rounded-br-none"
                        : "bg-secondary text-secondary-foreground rounded-bl-none"
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{msg.content}</p>
                    <p className={`text-[10px] mt-1 text-right ${msg.sender === "me" ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                      {msg.time}
                    </p>
                  </div>
                </div>
              ))}
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
        </Card>
      </div>
    </MainLayout>
  );
}
