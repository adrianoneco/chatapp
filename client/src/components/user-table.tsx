import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "./user-avatar";
import { RoleBadge } from "./role-badge";
import { Edit, Trash2 } from "lucide-react";
import type { SafeUser } from "@shared/schema";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface UserTableProps {
  users: SafeUser[];
  onEdit: (user: SafeUser) => void;
  onDelete: (user: SafeUser) => void;
  canEdit?: boolean;
  canDelete?: boolean;
}

export function UserTable({ users, onEdit, onDelete, canEdit = true, canDelete = true }: UserTableProps) {
  if (users.length === 0) {
    return null;
  }

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[300px]">Usuário</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Função</TableHead>
            <TableHead>Criado em</TableHead>
            <TableHead className="text-right w-[100px]">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id} data-testid={`row-user-${user.id}`}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <UserAvatar name={user.name} image={user.image} className="h-10 w-10" />
                  <span className="font-medium" data-testid={`text-name-${user.id}`}>
                    {user.name}
                  </span>
                </div>
              </TableCell>
              <TableCell data-testid={`text-email-${user.id}`}>{user.email}</TableCell>
              <TableCell>
                <RoleBadge role={user.role as any} />
              </TableCell>
              <TableCell className="text-muted-foreground">
                {format(new Date(user.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
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
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
