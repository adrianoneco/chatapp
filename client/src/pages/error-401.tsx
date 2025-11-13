import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";
import { Link } from "wouter";

export default function Error401() {
  return (
    <div className="flex items-center justify-center min-h-screen p-6 bg-background">
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-6">
          <div className="rounded-full bg-destructive/10 p-6">
            <Lock className="h-16 w-16 text-destructive" data-testid="icon-error-401" />
          </div>
        </div>
        <h1 className="text-6xl font-bold text-foreground mb-4" data-testid="text-error-code-401">
          401
        </h1>
        <h2 className="text-2xl font-semibold text-foreground mb-2" data-testid="text-error-title-401">
          Unauthorized
        </h2>
        <p className="text-base text-muted-foreground mb-6" data-testid="text-error-description-401">
          You need to be authenticated to access this resource. Please log in to continue.
        </p>
        <Button asChild data-testid="button-back-login-401">
          <Link href="/auth">Back to Login</Link>
        </Button>
      </div>
    </div>
  );
}
