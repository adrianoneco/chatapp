import { SidebarTrigger } from "@/components/ui/sidebar";
import { UserAvatar } from "./user-avatar";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, Settings, User } from "lucide-react";
import { Link } from "wouter";
import { PiChatTeardropFill } from "react-icons/pi";

export function AppHeader() {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <header className="flex items-center justify-between gap-4 px-6 py-3 border-b bg-gradient-to-br from-purple-950 via-purple-900 to-blue-950 text-white sticky top-0 z-50 w-full">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="text-white hover:bg-white/10" data-testid="button-sidebar-toggle" />
        <div className="flex justify-center items-center gap-3">
          <div className="h-12 w-12 border rounded-2xl bg-gradient-to-br bg-gradient-to-br from-purple-950 via-purple-900 to-blue-950 flex items-center justify-center shadow-xl">
            <PiChatTeardropFill className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">ChatApp</h1>
        </div>
      </div>

      {user && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-3 hover:bg-white/10" data-testid="button-user-menu">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-xs text-white/70">{user.email}</p>
              </div>
              <UserAvatar name={user.name} image={user.image} className="h-9 w-9" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/profile">
                <User className="mr-2 h-4 w-4" />
                <span>Perfil</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a href="/settings">
                <Settings className="mr-2 h-4 w-4" />
                <span>Configurações</span>
              </a>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} data-testid="button-logout">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sair</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </header>
  );
}
