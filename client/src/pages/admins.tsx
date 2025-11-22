import { UserManagement } from "@/components/user-management";
import { Shield } from "lucide-react";
import { ProtectedRoute } from "@/components/protected-route";

export default function Admins() {
  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <UserManagement
        role="admin"
        title="Administradores"
        description="Gerencie os administradores do sistema"
        emptyTitle="Nenhum administrador cadastrado"
        emptyDescription="Adicione administradores para gerenciar todo o sistema."
        icon={Shield}
      />
    </ProtectedRoute>
  );
}
