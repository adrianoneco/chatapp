import { ReactNode } from "react";
import { Header } from "./header";
import { AppSidebar } from "./sidebar";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <AppSidebar />
        <main className="flex-1 overflow-y-auto px-3 py-6 bg-background/50">
          {children}
        </main>
      </div>
    </div>
  );
}
