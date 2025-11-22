import { UserTable } from "./user-table";
import type { SafeUser } from "@shared/schema";

interface TableManagerProps {
  users: SafeUser[];
  onEdit: (user: SafeUser) => void;
  onDelete: (user: SafeUser) => void;
  canEdit?: boolean;
  canDelete?: boolean;
}

export function TableManager({
  users,
  onEdit,
  onDelete,
  canEdit = true,
  canDelete = true,
}: TableManagerProps) {
  return (
    <UserTable
      users={users}
      onEdit={onEdit}
      onDelete={onDelete}
      canEdit={canEdit}
      canDelete={canDelete}
    />
  );
}
