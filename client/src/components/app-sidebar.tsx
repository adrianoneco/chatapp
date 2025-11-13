import { Home, MessageSquare, Users, Settings, LayoutDashboard, UserCog, Calendar } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";

const menuItems = [
  {
    title: "Painel",
    url: "/",
    icon: LayoutDashboard,
    requiresAdmin: false,
  },
  {
    title: "Conversas",
    url: "/conversations",
    icon: MessageSquare,
    requiresAdmin: false,
  },
  {
    title: "Contatos",
    url: "/contacts",
    icon: Users,
    requiresAdmin: false,
  },
  {
    title: "Reuniões",
    url: "/meetings",
    icon: Calendar,
    requiresAdmin: false,
  },
  {
    title: "Atendentes",
    url: "/attendants",
    icon: UserCog,
    requiresAdmin: true,
  },
  {
    title: "Configurações",
    url: "/settings",
    icon: Settings,
    requiresAdmin: false,
  },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4 border-b">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-muted-foreground">Navegação</span>
          <SidebarTrigger data-testid="button-sidebar-toggle" />
        </div>
      </SidebarHeader>
      <SidebarContent className="p-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-sm font-medium text-muted-foreground mb-2">
            Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {menuItems
                .filter((item) => !item.requiresAdmin || isAdmin)
                .map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={location === item.url}
                      className="h-10"
                      data-testid={`link-${item.title.toLowerCase()}`}
                    >
                      <Link href={item.url}>
                        <item.icon className="h-5 w-5" />
                        <span className="text-base">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
