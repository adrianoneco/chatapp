import { UserManagement } from "@/components/user-management";
import { Users } from "lucide-react";

export default function Contacts() {
  return (
    <UserManagement
      role="client"
      title="Contatos"
      description="Gerencie os clientes e contatos do sistema"
      emptyTitle="Nenhum contato cadastrado"
      emptyDescription="Comece adicionando o primeiro contato ao sistema."
      icon={Users}
    />
  );
}
