import { Button } from "@/components/ui/button";
import { SearchX } from "lucide-react";
import { Link } from "wouter";

export default function Error404() {
  return (
    <div className="flex items-center justify-center min-h-screen p-6 bg-background">
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-6">
          <div className="rounded-full bg-muted p-6">
            <SearchX className="h-16 w-16 text-muted-foreground" data-testid="icon-error-404" />
          </div>
        </div>
        <h1 className="text-6xl font-bold text-foreground mb-4" data-testid="text-error-code-404">
          404
        </h1>
        <h2 className="text-2xl font-semibold text-foreground mb-2" data-testid="text-error-title-404">
          Página Não Encontrada
        </h2>
        <p className="text-base text-muted-foreground mb-6" data-testid="text-error-description-404">
          A página que você está procurando não existe ou foi movida. Vamos te colocar de volta no caminho certo.
        </p>
        <Button asChild data-testid="button-back-dashboard-404">
          <Link href="/">Ir para o Painel</Link>
        </Button>
      </div>
    </div>
  );
}
