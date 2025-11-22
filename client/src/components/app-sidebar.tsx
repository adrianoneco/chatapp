import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import { MessageSquare, Users, Headphones, Shield, LayoutDashboard } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { PiChatTeardropFill } from "react-icons/pi";

const menuItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
    roles: ["admin", "attendant", "client"],
  },
  {
    title: "Conversas",
    url: "/conversations",
    icon: MessageSquare,
    roles: ["admin", "attendant"],
  },
  {
    title: "Contatos",
    url: "/contacts",
    icon: Users,
    roles: ["admin", "attendant"],
  },
  {
    title: "Atendentes",
    url: "/attendants",
    icon: Headphones,
    roles: ["admin"],
  },
  {
    title: "Administradores",
    url: "/admins",
    icon: Shield,
    roles: ["admin"],
  },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { user } = useAuth();
  const { state } = useSidebar();

  const filteredItems = menuItems.filter(
    (item) => !item.roles || (user && item.roles.includes(user.role))
  );

  const isCollapsed = state === "collapsed";

  return (
    <Sidebar>
      <SidebarHeader className="p-6">
        {!isCollapsed && (
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-lg">
              <PiChatTeardropFill className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-base">Sistema</h2>
              <p className="text-xs text-muted-foreground">Atendimento</p>
            </div>
          </div>
        )}
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          {!isCollapsed && <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location === item.url}>
                    <Link href={item.url} data-testid={`link-${item.title.toLowerCase()}`}>
                      <item.icon className="h-4 w-4" />
                      {!isCollapsed && <span>{item.title}</span>}
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
