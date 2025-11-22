import { Skeleton } from "@/components/ui/skeleton";
import { UserCard } from "./user-card";
import type { SafeUser } from "@shared/schema";

interface CardsManagerProps {
  users: SafeUser[];
  isLoading: boolean;
  onEdit: (user: SafeUser) => void;
  onDelete: (user: SafeUser) => void;
  canEdit?: boolean;
  canDelete?: boolean;
}

export function CardsManager({
  users,
  isLoading,
  onEdit,
  onDelete,
  canEdit = true,
  canDelete = true,
}: CardsManagerProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 2xl:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <Skeleton key={i} className="h-[180px] rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 2xl:grid-cols-4 gap-6">
      {users.map((user) => (
        <UserCard
          key={user.id}
          user={user}
          onEdit={onEdit}
          onDelete={onDelete}
          canEdit={canEdit}
          canDelete={canDelete}
        />
      ))}
    </div>
  );
}
