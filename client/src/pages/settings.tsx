import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bell, User, Monitor, Shield, Moon, Laptop, Globe } from "lucide-react";

export default function Settings() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight font-[Outfit]">Configurações</h2>
          <p className="text-muted-foreground">Gerencie suas preferências e conta.</p>
        </div>

        <Tabs defaultValue="profile" className="space-y-4">
          <TabsList>
            <TabsTrigger value="profile">Perfil</TabsTrigger>
            <TabsTrigger value="notifications">Notificações</TabsTrigger>
            <TabsTrigger value="appearance">Aparência</TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile" className="space-y-4">
            <Card className="border-border/50 bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle>Informações do Perfil</CardTitle>
                <CardDescription>Atualize sua foto e dados pessoais.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src="https://github.com/shadcn.png" />
                    <AvatarFallback>UR</AvatarFallback>
                  </Avatar>
                  <Button variant="outline">Alterar Foto</Button>
                </div>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Nome Completo</Label>
                    <Input defaultValue="Usuario Demo" />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input defaultValue="usuario@demo.com" />
                  </div>
                  <div className="space-y-2">
                    <Label>Cargo</Label>
                    <Input defaultValue="Administrador" disabled />
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button>Salvar Alterações</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="notifications" className="space-y-4">
            <Card className="border-border/50 bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle>Preferências de Notificação</CardTitle>
                <CardDescription>Escolha como você quer ser notificado.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div className="space-y-0.5">
                    <Label className="text-base">Notificações de Desktop</Label>
                    <p className="text-sm text-muted-foreground">Receba popups no seu computador.</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div className="space-y-0.5">
                    <Label className="text-base">Sons de Mensagem</Label>
                    <p className="text-sm text-muted-foreground">Tocar som ao receber mensagem.</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div className="space-y-0.5">
                    <Label className="text-base">Emails de Resumo</Label>
                    <p className="text-sm text-muted-foreground">Receba um resumo diário por email.</p>
                  </div>
                  <Switch />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="appearance" className="space-y-4">
             <Card className="border-border/50 bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle>Tema</CardTitle>
                <CardDescription>Personalize a aparência do app.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-3 gap-4">
                <div className="cursor-pointer space-y-2">
                  <div className="p-4 border-2 border-primary rounded-lg bg-background hover:bg-accent transition-colors">
                    <div className="space-y-2">
                      <div className="h-2 w-[80%] bg-foreground/20 rounded" />
                      <div className="h-2 w-[60%] bg-foreground/20 rounded" />
                    </div>
                  </div>
                  <div className="text-center text-sm font-medium text-primary">Escuro (Padrão)</div>
                </div>
                <div className="cursor-pointer space-y-2 opacity-50">
                  <div className="p-4 border-2 border-transparent rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors">
                    <div className="space-y-2">
                      <div className="h-2 w-[80%] bg-slate-400 rounded" />
                      <div className="h-2 w-[60%] bg-slate-400 rounded" />
                    </div>
                  </div>
                  <div className="text-center text-sm font-medium">Claro</div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
