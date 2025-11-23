import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search, UserPlus, MoreHorizontal, Shield, Headset, LayoutGrid, List } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useState } from "react";

const attendants = [
  { id: 1, name: "João Suporte", email: "joao@empresa.com", department: "Vendas", role: "Supervisor", status: "Online", activeChats: 3 },
  { id: 2, name: "Maria Atendimento", email: "maria@empresa.com", department: "Suporte", role: "Atendente", status: "Busy", activeChats: 5 },
  { id: 3, name: "Pedro Técnico", email: "pedro@empresa.com", department: "Técnico", role: "Atendente", status: "Offline", activeChats: 0 },
  { id: 4, name: "Lucas Vendas", email: "lucas@empresa.com", department: "Vendas", role: "Atendente", status: "Online", activeChats: 2 },
];

export default function Attendants() {
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight font-[Outfit]">Atendentes</h2>
            <p className="text-muted-foreground">Gerencie a equipe de atendimento.</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-background/50 border border-border rounded-lg p-1 flex items-center gap-1">
              <Button 
                variant={viewMode === "table" ? "secondary" : "ghost"} 
                size="icon" 
                className="h-8 w-8"
                onClick={() => setViewMode("table")}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button 
                variant={viewMode === "grid" ? "secondary" : "ghost"} 
                size="icon" 
                className="h-8 w-8"
                onClick={() => setViewMode("grid")}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>
            <Button className="bg-primary hover:bg-primary/90">
              <UserPlus className="mr-2 h-4 w-4" /> Novo Atendente
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="bg-primary/10 border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Atendentes</CardTitle>
              <Headset className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
            </CardContent>
          </Card>
          <Card className="bg-green-500/10 border-green-500/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-500">Online Agora</CardTitle>
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">8</div>
            </CardContent>
          </Card>
          <Card className="bg-blue-500/10 border-blue-500/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-500">Atendimentos Ativos</CardTitle>
              <Shield className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-500">34</div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle>Equipe</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar atendente..." className="pl-9 bg-background/50" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {viewMode === "table" ? (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-border">
                    <TableHead className="w-[300px]">Nome</TableHead>
                    <TableHead>Departamento</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Chats Ativos</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendants.map((attendant) => (
                    <TableRow key={attendant.id} className="hover:bg-muted/50 border-border">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarImage src={`https://i.pravatar.cc/150?u=${attendant.id + 20}`} />
                            <AvatarFallback>{attendant.name.substring(0, 2)}</AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="font-medium flex items-center gap-2">
                              {attendant.name}
                              {attendant.role === "Supervisor" && (
                                <Shield className="h-3 w-3 text-yellow-500" />
                              )}
                            </span>
                            <span className="text-xs text-muted-foreground">{attendant.email}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-border bg-background/50">
                          {attendant.department}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="secondary" 
                          className={
                            attendant.status === "Online" ? "bg-green-500/10 text-green-500 hover:bg-green-500/20" :
                            attendant.status === "Busy" ? "bg-orange-500/10 text-orange-500 hover:bg-orange-500/20" :
                            "bg-slate-500/10 text-slate-500 hover:bg-slate-500/20"
                          }
                        >
                          {attendant.status === "Online" ? "Disponível" : 
                           attendant.status === "Busy" ? "Ocupado" : "Offline"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium">{attendant.activeChats}</div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>Ver Perfil</DropdownMenuItem>
                            <DropdownMenuItem>Alterar Permissões</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">Remover</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {attendants.map((attendant) => (
                  <div key={attendant.id} className="p-4 rounded-xl bg-background/50 border border-border hover:bg-accent/20 transition-colors space-y-4 relative">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={`https://i.pravatar.cc/150?u=${attendant.id + 20}`} />
                          <AvatarFallback>{attendant.name.substring(0, 2)}</AvatarFallback>
                        </Avatar>
                        <div>
                           <span className="font-medium flex items-center gap-2">
                              {attendant.name}
                              {attendant.role === "Supervisor" && (
                                <Shield className="h-3 w-3 text-yellow-500" />
                              )}
                            </span>
                          <p className="text-xs text-muted-foreground">{attendant.department}</p>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 -mt-1 -mr-2">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>Ver Perfil</DropdownMenuItem>
                          <DropdownMenuItem>Alterar Permissões</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">Remover</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    
                    <div className="flex flex-col gap-2">
                       <div className="flex items-center justify-between text-sm bg-muted/30 p-2 rounded">
                         <span className="text-muted-foreground">Chats Ativos</span>
                         <span className="font-bold">{attendant.activeChats}</span>
                       </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-border">
                       <Badge 
                          variant="secondary" 
                          className={
                            attendant.status === "Online" ? "bg-green-500/10 text-green-500" :
                            attendant.status === "Busy" ? "bg-orange-500/10 text-orange-500" :
                            "bg-slate-500/10 text-slate-500"
                          }
                        >
                          {attendant.status === "Online" ? "Disponível" : 
                           attendant.status === "Busy" ? "Ocupado" : "Offline"}
                        </Badge>
                      <span className="text-xs text-muted-foreground">{attendant.email}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
