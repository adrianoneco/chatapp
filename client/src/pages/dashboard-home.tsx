import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Users, Clock, CheckCircle2 } from "lucide-react";

export default function DashboardHome() {
  const { user } = useAuth();

  const stats = [
    {
      title: "Conversas Ativas",
      value: "0",
      description: "Em atendimento",
      icon: MessageSquare,
    },
    {
      title: "Pendentes",
      value: "0",
      description: "Aguardando atendimento",
      icon: Clock,
    },
    {
      title: "Encerradas Hoje",
      value: "0",
      description: "Finalizadas hoje",
      icon: CheckCircle2,
    },
    {
      title: "Total de Contatos",
      value: "0",
      description: "Clientes cadastrados",
      icon: Users,
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-muted-foreground">
          Bem-vindo, {user?.name}!
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} data-testid={`card-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid={`text-${stat.title.toLowerCase().replace(/\s+/g, '-')}-value`}>
                {stat.value}
              </div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Visão Geral</CardTitle>
          <CardDescription>
            Acompanhe suas atividades e métricas de atendimento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Sistema de atendimento ao cliente. Use o menu lateral para navegar entre as seções.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
