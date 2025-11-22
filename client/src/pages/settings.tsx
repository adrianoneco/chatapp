import { Route, useLocation, Link } from "wouter";
import { Settings as SettingsIcon, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import Channels from "./settings/channels";

export default function Settings() {
  const [location] = useLocation();

  const settingsMenu = [
    {
      title: "Canais",
      url: "/dashboard/settings/channels",
      icon: MessageSquare,
    },
  ];

  return (
    <div className="flex gap-6 h-full">
      <div className="w-64 space-y-2">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold flex items-center gap-3">
            <SettingsIcon className="h-6 w-6" />
            Configurações
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie as configurações do sistema
          </p>
        </div>
        
        <nav className="space-y-1">
          {settingsMenu.map((item) => (
            <Link key={item.url} href={item.url}>
              <a
                className={cn(
                  "flex items-center gap-3 px-4 py-2 rounded-lg transition-colors",
                  location === item.url
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-accent"
                )}
              >
                <item.icon className="h-4 w-4" />
                <span className="font-medium">{item.title}</span>
              </a>
            </Link>
          ))}
        </nav>
      </div>

      <div className="flex-1 bg-card border rounded-lg p-6">
        <Route path="/dashboard/settings/channels" component={Channels} />
        <Route path="/dashboard/settings">
          {() => (
            <div className="text-center py-12">
              <SettingsIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Selecione uma opção no menu
              </p>
            </div>
          )}
        </Route>
      </div>
    </div>
  );
}
