import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, MessageSquare, Activity, TrendingUp } from "lucide-react";

export default function Dashboard() {
  const stats = [
    {
      title: "Total de Conversas",
      value: "1,234",
      change: "+12%",
      icon: MessageSquare,
      color: "text-purple-500",
    },
    {
      title: "Usuários Ativos",
      value: "843",
      change: "+5%",
      icon: Users,
      color: "text-blue-500",
    },
    {
      title: "Atendimentos Hoje",
      value: "142",
      change: "+18%",
      icon: Activity,
      color: "text-green-500",
    },
    {
      title: "Taxa de Resposta",
      value: "98%",
      change: "+2%",
      icon: TrendingUp,
      color: "text-orange-500",
    },
  ];

  return (
    <MainLayout>
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight font-[Outfit]">Dashboard</h2>
          <div className="text-sm text-muted-foreground">
            Última atualização: Hoje, 14:30
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <Card key={index} className="border-border/50 bg-card/50 backdrop-blur hover:bg-card/80 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-500 font-medium">{stat.change}</span> em relação ao mês passado
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4 border-border/50 bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle>Visão Geral</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
              <div className="h-[200px] w-full flex items-center justify-center text-muted-foreground bg-background/20 rounded-md border border-dashed border-border">
                Gráfico de Atividades (Placeholder)
              </div>
            </CardContent>
          </Card>
          <Card className="col-span-3 border-border/50 bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle>Atividades Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center">
                      <Activity className="h-4 w-4 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">Nova conversa iniciada</p>
                      <p className="text-xs text-muted-foreground">Há 2 minutos</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
