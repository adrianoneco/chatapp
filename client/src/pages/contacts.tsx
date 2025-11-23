import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search, UserPlus, MoreHorizontal, Mail, Phone, LayoutGrid, List } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useState } from "react";

const clients = [
  { id: 1, name: "Ana Silva", email: "ana.silva@email.com", phone: "+55 11 99999-9999", status: "Active", lastActive: "Hoje, 10:42" },
  { id: 2, name: "Carlos Oliveira", email: "carlos.o@email.com", phone: "+55 11 98888-8888", status: "Inactive", lastActive: "Ontem" },
  { id: 3, name: "Mariana Costa", email: "mari.costa@email.com", phone: "+55 21 97777-7777", status: "Active", lastActive: "Segunda" },
  { id: 4, name: "Roberto Santos", email: "roberto.s@email.com", phone: "+55 31 96666-6666", status: "Active", lastActive: "Hoje, 09:30" },
  { id: 5, name: "Julia Pereira", email: "julia.p@email.com", phone: "+55 41 95555-5555", status: "Blocked", lastActive: "Semana passada" },
];

export default function Contacts() {
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight font-[Outfit]">Contatos</h2>
            <p className="text-muted-foreground">Gerencie seus clientes e contatos.</p>
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
              <UserPlus className="mr-2 h-4 w-4" /> Novo Contato
            </Button>
          </div>
        </div>

        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle>Todos os Contatos</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar cliente..." className="pl-9 bg-background/50" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {viewMode === "table" ? (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-border">
                    <TableHead className="w-[300px]">Nome</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Última Atividade</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.map((client) => (
                    <TableRow key={client.id} className="hover:bg-muted/50 border-border">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarImage src={`https://i.pravatar.cc/150?u=${client.id}`} />
                            <AvatarFallback>{client.name.substring(0, 2)}</AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="font-medium">{client.name}</span>
                            <span className="text-xs text-muted-foreground">Cliente #{client.id}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1 text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Mail className="h-3 w-3" /> {client.email}
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Phone className="h-3 w-3" /> {client.phone}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="secondary" 
                          className={
                            client.status === "Active" ? "bg-green-500/10 text-green-500 hover:bg-green-500/20" :
                            client.status === "Inactive" ? "bg-slate-500/10 text-slate-500 hover:bg-slate-500/20" :
                            "bg-red-500/10 text-red-500 hover:bg-red-500/20"
                          }
                        >
                          {client.status === "Active" ? "Ativo" : 
                           client.status === "Inactive" ? "Inativo" : "Bloqueado"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {client.lastActive}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>Ver Detalhes</DropdownMenuItem>
                            <DropdownMenuItem>Editar</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">Excluir</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {clients.map((client) => (
                  <div key={client.id} className="p-4 rounded-xl bg-background/50 border border-border hover:bg-accent/20 transition-colors space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={`https://i.pravatar.cc/150?u=${client.id}`} />
                          <AvatarFallback>{client.name.substring(0, 2)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{client.name}</p>
                          <p className="text-xs text-muted-foreground">#{client.id}</p>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 -mt-1 -mr-2">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>Ver Detalhes</DropdownMenuItem>
                          <DropdownMenuItem>Editar</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">Excluir</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground truncate">
                        <Mail className="h-3 w-3 shrink-0" /> {client.email}
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-3 w-3 shrink-0" /> {client.phone}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-border">
                      <Badge 
                        variant="secondary" 
                        className={
                          client.status === "Active" ? "bg-green-500/10 text-green-500" :
                          client.status === "Inactive" ? "bg-slate-500/10 text-slate-500" :
                          "bg-red-500/10 text-red-500"
                        }
                      >
                        {client.status === "Active" ? "Ativo" : 
                         client.status === "Inactive" ? "Inativo" : "Bloqueado"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{client.lastActive}</span>
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
