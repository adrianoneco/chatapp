import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Globe, Lock, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import type { Meeting } from "@shared/schema";

export default function MeetingViewPage() {
  const [, params] = useRoute("/m/:linkId");
  const linkId = params?.linkId || "";

  const { data: meeting, isLoading, error } = useQuery<Meeting>({
    queryKey: [`/api/m/${linkId}`],
    enabled: !!linkId,
  });

  const formatDateTime = (dateStr: string | Date) => {
    const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
    return date.toLocaleString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="w-full max-w-2xl">
          <CardContent className="py-12 text-center">
            <Calendar className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-muted-foreground" data-testid="text-loading">Carregando reunião...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    const errorMessage = (error as any)?.message || "Erro ao carregar reunião";
    const is401 = errorMessage.includes("Autenticação") || errorMessage.includes("401");
    
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="text-center text-destructive">
              {is401 ? "Acesso Restrito" : "Reunião Não Encontrada"}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="flex justify-center">
              {is401 ? (
                <Lock className="h-16 w-16 text-destructive" />
              ) : (
                <Calendar className="h-16 w-16 text-muted-foreground" />
              )}
            </div>
            <p className="text-muted-foreground" data-testid="text-error">
              {is401 
                ? "Esta reunião é privada. Por favor, faça login para acessar."
                : "A reunião que você está procurando não foi encontrada ou o link expirou."}
            </p>
            {is401 ? (
              <Link href="/auth">
                <Button data-testid="button-login">Fazer Login</Button>
              </Link>
            ) : (
              <Link href="/">
                <Button variant="outline" data-testid="button-home">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar para o Início
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!meeting) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-background to-muted">
      <Card className="w-full max-w-3xl" data-testid="card-meeting-view">
        <CardHeader className="space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <CardTitle className="text-3xl" data-testid="text-meeting-title">
              {meeting.title}
            </CardTitle>
            {meeting.isPublic ? (
              <span className="flex items-center gap-2 px-3 py-1 rounded-md bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100" data-testid="badge-public">
                <Globe className="h-4 w-4" />
                Público
              </span>
            ) : (
              <span className="flex items-center gap-2 px-3 py-1 rounded-md bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-100" data-testid="badge-private">
                <Lock className="h-4 w-4" />
                Privado
              </span>
            )}
          </div>
          <CardDescription className="text-lg">
            Link compartilhável para reunião
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="flex items-start gap-4 p-6 rounded-lg bg-muted/50">
            <Calendar className="h-6 w-6 text-primary mt-1" />
            <div className="flex-1">
              <h3 className="font-medium mb-1">Data e Hora</h3>
              <p className="text-lg" data-testid="text-scheduled-at">
                {formatDateTime(meeting.scheduledAt)}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-6 rounded-lg bg-muted/50">
            <Clock className="h-6 w-6 text-primary mt-1" />
            <div className="flex-1">
              <h3 className="font-medium mb-1">Informações</h3>
              <p className="text-muted-foreground">
                Esta reunião foi compartilhada via link {meeting.isPublic ? "público" : "privado"}.
                {!meeting.isPublic && " Apenas usuários autenticados podem acessar."}
              </p>
            </div>
          </div>

          <div className="flex gap-3 flex-wrap">
            <Link href="/meetings">
              <Button variant="outline" data-testid="button-my-meetings">
                <Calendar className="mr-2 h-4 w-4" />
                Minhas Reuniões
              </Button>
            </Link>
            <Link href="/">
              <Button data-testid="button-dashboard">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Ir para o Painel
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
