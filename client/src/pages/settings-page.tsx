import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bot, Webhook, MessageSquare } from "lucide-react";
import { AIAssistantTab } from "@/components/settings/ai-assistant-tab";
import { WebHooksTab } from "@/components/settings/webhooks-tab";
import { EvolutionAPITab } from "@/components/settings/evolution-api-tab";

export default function SettingsPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Configurações</h1>
        <p className="text-sm text-muted-foreground">
          Gerencie configurações do sistema
        </p>
      </div>

      <Tabs defaultValue="ai" className="w-full" data-testid="settings-tabs">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="ai" data-testid="tab-ai">
            <Bot className="w-4 h-4 mr-2" />
            Assistente IA
          </TabsTrigger>
          <TabsTrigger value="webhooks" data-testid="tab-webhooks">
            <Webhook className="w-4 h-4 mr-2" />
            WebHooks
          </TabsTrigger>
          <TabsTrigger value="evolution" data-testid="tab-evolution">
            <MessageSquare className="w-4 h-4 mr-2" />
            Evolution API
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ai" className="mt-6">
          <AIAssistantTab />
        </TabsContent>

        <TabsContent value="webhooks" className="mt-6">
          <WebHooksTab />
        </TabsContent>

        <TabsContent value="evolution" className="mt-6">
          <EvolutionAPITab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
