import { Button } from "@/components/ui/button";
import { ServerCrash } from "lucide-react";
import { Link } from "wouter";

export default function Error500() {
  return (
    <div className="flex items-center justify-center min-h-screen p-6 bg-background">
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-6">
          <div className="rounded-full bg-destructive/10 p-6">
            <ServerCrash className="h-16 w-16 text-destructive" data-testid="icon-error-500" />
          </div>
        </div>
        <h1 className="text-6xl font-bold text-foreground mb-4" data-testid="text-error-code-500">
          500
        </h1>
        <h2 className="text-2xl font-semibold text-foreground mb-2" data-testid="text-error-title-500">
          Erro do Servidor
        </h2>
        <p className="text-base text-muted-foreground mb-6" data-testid="text-error-description-500">
          Algo deu errado do nosso lado. Nossa equipe foi notificada e estamos trabalhando para corrigir.
        </p>
        <Button asChild data-testid="button-back-dashboard-500">
          <Link href="/">Ir para o Painel</Link>
        </Button>
      </div>
    </div>
  );
}
