import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Bell, MessageSquare, Info, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const notifications = [
  { id: 1, title: "Nova mensagem de Ana Silva", description: "Ana enviou um arquivo para revisão.", time: "2 min atrás", type: "message", read: false },
  { id: 2, title: "Backup concluído", description: "O backup diário do sistema foi finalizado com sucesso.", time: "1 hora atrás", type: "success", read: false },
  { id: 3, title: "Novo cliente cadastrado", description: "Ricardo Mendes se cadastrou na plataforma.", time: "3 horas atrás", type: "info", read: true },
  { id: 4, title: "Alerta de sistema", description: "Uso de CPU acima de 80% no servidor principal.", time: "5 horas atrás", type: "warning", read: true },
  { id: 5, title: "Mensagem de Suporte", description: "Ticket #1234 foi atualizado.", time: "Ontem", type: "message", read: true },
];

export default function Notifications() {
  return (
    <MainLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight font-[Outfit]">Notificações</h2>
            <p className="text-muted-foreground">Fique por dentro das últimas atualizações.</p>
          </div>
          <Button variant="outline">
            Marcar todas como lidas
          </Button>
        </div>

        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle>Recentes</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[calc(100vh-16rem)]">
              <div className="divide-y divide-border">
                {notifications.map((notification) => (
                  <div 
                    key={notification.id} 
                    className={cn(
                      "flex items-start gap-4 p-4 hover:bg-accent/30 transition-colors",
                      !notification.read && "bg-accent/10"
                    )}
                  >
                    <div className={cn(
                      "h-10 w-10 rounded-full flex items-center justify-center shrink-0",
                      notification.type === "message" && "bg-blue-500/10 text-blue-500",
                      notification.type === "success" && "bg-green-500/10 text-green-500",
                      notification.type === "info" && "bg-purple-500/10 text-purple-500",
                      notification.type === "warning" && "bg-orange-500/10 text-orange-500",
                    )}>
                      {notification.type === "message" && <MessageSquare className="h-5 w-5" />}
                      {notification.type === "success" && <CheckCircle className="h-5 w-5" />}
                      {notification.type === "info" && <Info className="h-5 w-5" />}
                      {notification.type === "warning" && <AlertTriangle className="h-5 w-5" />}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className={cn("text-sm font-medium leading-none", !notification.read && "font-bold")}>
                          {notification.title}
                        </p>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {notification.time}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {notification.description}
                      </p>
                    </div>
                    {!notification.read && (
                      <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-2" />
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
