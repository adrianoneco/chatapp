import { useState } from "react";
import { Sidebar, Menu, Home, MessageSquare, Settings, ChevronLeft, ChevronRight, Users, Bell, Headset } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Link, useLocation } from "wouter";

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [location] = useLocation();

  const navItems = [
    { icon: Home, label: "Início", href: "/" },
    { icon: MessageSquare, label: "Conversas", href: "/conversations" },
    { icon: Users, label: "Contatos", href: "/contacts" },
    { icon: Headset, label: "Atendentes", href: "/attendants" },
    { icon: Bell, label: "Notificações", href: "/notifications" },
    { icon: Settings, label: "Configurações", href: "/settings" },
  ];

  // Check if current path starts with item.href (for highlighting /conversations when in /conversations/webchat/1)
  const isActive = (href: string) => {
    if (href === "/") return location === "/";
    return location.startsWith(href);
  };

  return (
    <aside 
      className={cn(
        "relative h-[calc(100vh-4rem)] bg-card/50 backdrop-blur border-r border-white/10 transition-all duration-300 ease-in-out",
        collapsed ? "w-16" : "w-50"
      )}
    >
      {/* Toggle Button */}
      <Button
        variant="secondary"
        size="icon"
        className="absolute -right-3 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full shadow-md z-50 bg-sidebar border border-sidebar-border hover:bg-sidebar-accent"
        onClick={() => setCollapsed(!collapsed)}
      >
        {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </Button>

      <div className="flex flex-col h-full py-4">
        <nav className="space-y-2 px-2">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <div className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors group cursor-pointer",
                isActive(item.href) && "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
              )}>
                <item.icon className={cn("h-5 w-5 shrink-0", collapsed ? "mx-auto" : "")} />
                {!collapsed && (
                  <span className="truncate animate-in fade-in slide-in-from-left-2 duration-200">
                    {item.label}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </nav>

        <div className="mt-auto px-2">
          <div className={cn(
            "p-3 rounded-lg bg-sidebar-accent/50 border border-sidebar-border",
            collapsed ? "hidden" : "block animate-in fade-in zoom-in duration-300"
          )}>
            <p className="text-xs text-sidebar-foreground/60 mb-2">Armazenamento</p>
            <div className="h-1.5 w-full bg-sidebar-border rounded-full overflow-hidden">
              <div className="h-full bg-primary w-[75%] rounded-full" />
            </div>
            <p className="text-xs text-right mt-1 text-sidebar-foreground/60">75% usado</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
