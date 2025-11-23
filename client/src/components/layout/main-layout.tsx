import { ReactNode } from "react";
import { Header } from "./header";
import { AppSidebar } from "./sidebar";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 flex flex-col relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[100px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[100px]" />
      <Header />
      <div className="flex flex-1 overflow-hidden relative z-10">
        <AppSidebar />
        <main className="flex-1 overflow-y-auto px-3 py-3">
          {children}
        </main>
      </div>
    </div>
  );
}
