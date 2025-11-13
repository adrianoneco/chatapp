import { Button } from "@/components/ui/button";
import { ShieldAlert } from "lucide-react";
import { Link } from "wouter";

export default function Error403() {
  return (
    <div className="flex items-center justify-center min-h-screen p-6 bg-background">
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-6">
          <div className="rounded-full bg-destructive/10 p-6">
            <ShieldAlert className="h-16 w-16 text-destructive" data-testid="icon-error-403" />
          </div>
        </div>
        <h1 className="text-6xl font-bold text-foreground mb-4" data-testid="text-error-code-403">
          403
        </h1>
        <h2 className="text-2xl font-semibold text-foreground mb-2" data-testid="text-error-title-403">
          Forbidden
        </h2>
        <p className="text-base text-muted-foreground mb-6" data-testid="text-error-description-403">
          You don't have permission to access this resource. Contact your administrator if you believe this is an error.
        </p>
        <Button asChild data-testid="button-back-dashboard-403">
          <Link href="/">Go to Dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
