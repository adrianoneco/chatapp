import { UserManagement } from "@/components/user-management";
import { Headphones } from "lucide-react";
import { ProtectedRoute } from "@/components/protected-route";

export default function Attendants() {
  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <UserManagement
        role="attendant"
        title="Atendentes"
        description="Gerencie os atendentes da plataforma"
        emptyTitle="Nenhum atendente cadastrado"
        emptyDescription="Adicione atendentes para começar a gerenciar o suporte."
        icon={Headphones}
      />
    </ProtectedRoute>
  );
}
