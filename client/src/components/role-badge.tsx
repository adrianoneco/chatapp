import { Badge } from "@/components/ui/badge";

interface RoleBadgeProps {
  role: "client" | "attendant" | "admin";
  className?: string;
}

const roleConfig = {
  client: {
    label: "Cliente",
    variant: "secondary" as const,
  },
  attendant: {
    label: "Atendente",
    variant: "default" as const,
  },
  admin: {
    label: "Administrador",
    variant: "destructive" as const,
  },
};

export function RoleBadge({ role, className }: RoleBadgeProps) {
  const config = roleConfig[role] || roleConfig.client;

  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  );
}
