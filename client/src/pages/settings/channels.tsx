import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageSquare, Settings } from "lucide-react";

export default function Channels() {
  const channels = [
    {
      id: "webchat",
      name: "WebChat",
      description: "Canal de chat integrado ao site",
      active: true,
      default: true,
      icon: MessageSquare,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-1">Canais de Atendimento</h3>
        <p className="text-sm text-muted-foreground">
          Gerencie os canais de comunicação com seus clientes
        </p>
      </div>

      <div className="grid gap-4">
        {channels.map((channel) => (
          <Card key={channel.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <channel.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">{channel.name}</h4>
                      {channel.default && (
                        <Badge variant="secondary" className="text-xs">
                          Padrão
                        </Badge>
                      )}
                      {channel.active && (
                        <Badge variant="default" className="text-xs bg-green-500">
                          Ativo
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {channel.description}
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Configurar
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
