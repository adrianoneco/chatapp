import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "./user-avatar";
import { RoleBadge } from "./role-badge";
import { Edit, Trash2 } from "lucide-react";
import type { SafeUser } from "@shared/schema";
import { getDate } from "@/lib/date-utils";

interface UserCardProps {
  user: SafeUser;
  onEdit: (user: SafeUser) => void;
  onDelete: (user: SafeUser) => void;
  canEdit?: boolean;
  canDelete?: boolean;
}

export function UserCard({ user, onEdit, onDelete, canEdit = true, canDelete = true }: UserCardProps) {
  return (
    <Card className="hover-elevate" data-testid={`card-user-${user.id}`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4 flex-1 min-w-0">
            <UserAvatar name={user.name} image={user.image} className="h-16 w-16" />
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base mb-1 truncate" data-testid={`text-name-${user.id}`}>
                {user.name}
              </h3>
              <p className="text-sm text-muted-foreground mb-2 truncate" data-testid={`text-email-${user.id}`}>
                {user.email}
              </p>
              <RoleBadge role={user.role as any} />
            </div>
          </div>
          <div className="flex gap-2">
            {canEdit && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(user)}
                data-testid={`button-edit-${user.id}`}
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
            {canDelete && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(user)}
                data-testid={`button-delete-${user.id}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        <div className="mt-4 text-xs text-muted-foreground">
          Criado em {getDate(user.createdAt)}
        </div>
      </CardContent>
    </Card>
  );
}
