import { useEffect, useRef, useCallback } from "react";
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
import { MessageSquare, Users, Headphones, Shield, LayoutDashboard, Settings, BookOpen } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { PiChatTeardropFill } from "react-icons/pi";
import { useMutation, useQueryClient } from "@tanstack/react-query";

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
  {
    title: "Configurações",
    url: "/dashboard/settings",
    icon: Settings,
    roles: ["admin", "attendant"],
  },
  {
    title: "Documentação API",
    url: "/docs",
    icon: BookOpen,
    roles: ["admin"],
  },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { user } = useAuth();
  const { state, setOpen } = useSidebar();
  const queryClient = useQueryClient();
  const initializedRef = useRef(false);
  const lastSavedStateRef = useRef<boolean | undefined>(undefined);
  const isMutatingRef = useRef(false);

  const filteredItems = menuItems.filter(
    (item) => !item.roles || (user && item.roles.includes(user.role))
  );

  const isRouteActive = (itemUrl: string, currentLocation: string) => {
    if (itemUrl === currentLocation) return true;
    if (currentLocation.startsWith(itemUrl) && itemUrl !== "/") return true;
    return false;
  };

  const isCollapsed = state === "collapsed";

  const { mutate } = useMutation({
    mutationFn: async (preferences: { sidebarCollapsed?: boolean }) => {
      const response = await fetch("/api/users/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(preferences),
      });

      if (!response.ok) {
        throw new Error("Erro ao atualizar preferências");
      }

      return response.json();
    },
    onMutate: async (preferences) => {
      isMutatingRef.current = true;
      const previousState = lastSavedStateRef.current;
      lastSavedStateRef.current = preferences.sidebarCollapsed;
      return { previousState };
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/auth/me"], data);
      lastSavedStateRef.current = data.preferences?.sidebarCollapsed;
    },
    onError: (_, __, context) => {
      if (context?.previousState !== undefined) {
        lastSavedStateRef.current = context.previousState;
      }
    },
    onSettled: () => {
      isMutatingRef.current = false;
    },
  });

  useEffect(() => {
    if (!initializedRef.current && user?.preferences?.sidebarCollapsed !== undefined) {
      setOpen(!user.preferences.sidebarCollapsed);
      lastSavedStateRef.current = user.preferences.sidebarCollapsed;
      initializedRef.current = true;
    }
  }, [user?.preferences?.sidebarCollapsed, setOpen]);

  useEffect(() => {
    if (user?.preferences?.sidebarCollapsed !== undefined) {
      lastSavedStateRef.current = user.preferences.sidebarCollapsed;
    }
  }, [user?.preferences?.sidebarCollapsed]);

  useEffect(() => {
    if (
      user &&
      initializedRef.current &&
      lastSavedStateRef.current !== isCollapsed &&
      !isMutatingRef.current
    ) {
      mutate({ sidebarCollapsed: isCollapsed });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCollapsed]);

  return (
    <Sidebar>
      <SidebarHeader className="p-6">
        {!isCollapsed && (
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-slate-800 via-slate-900 to-black flex items-center justify-center shadow-lg border border-slate-700/50">
              <PiChatTeardropFill className="h-6 w-6 text-purple-400" />
            </div>
            <div>
              <h2 className="font-bold text-base" style={{ fontFamily: "'Poppins', sans-serif" }}>Evolution</h2>
              <p className="text-xs text-muted-foreground">Chat Platform</p>
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
                  <SidebarMenuButton asChild isActive={isRouteActive(item.url, location)}>
                    <Link href={item.url} data-testid={`link-${item.title.toLowerCase()}`}>
                      <div className="flex items-center gap-2 flex-1">
                        {isRouteActive(item.url, location) && (
                          <div className="absolute left-0 w-1 h-8 bg-primary rounded-r-full" />
                        )}
                        <item.icon className="h-4 w-4" />
                        {!isCollapsed && <span>{item.title}</span>}
                      </div>
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
