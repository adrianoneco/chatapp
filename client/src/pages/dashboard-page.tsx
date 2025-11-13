import { MessageSquare } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] p-6">
      <div className="text-center">
        <div className="flex justify-center mb-6">
          <div className="rounded-full bg-primary/10 p-6">
            <MessageSquare className="h-16 w-16 text-primary" data-testid="icon-dashboard" />
          </div>
        </div>
        <h1 className="text-2xl font-semibold text-foreground mb-2" data-testid="text-dashboard-title">
          Bem-vindo ao ChatApp
        </h1>
        <p className="text-base text-muted-foreground max-w-md mx-auto" data-testid="text-dashboard-description">
          Sua plataforma de mensagens está pronta. Inicie uma conversa ou explore seus contatos para se conectar.
        </p>
      </div>
    </div>
  );
}
