import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import type { SafeUser } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { UserCard } from "./user-card";
import { UserTable } from "./user-table";
import { UserFilters } from "./user-filters";
import { UserFormModal } from "./user-form-modal";
import { DeleteConfirmDialog } from "./delete-confirm-dialog";
import { EmptyState } from "./empty-state";
import { LayoutGrid, List, Plus } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

interface UserManagementProps {
  role: "client" | "attendant" | "admin";
  title: string;
  description: string;
  emptyTitle: string;
  emptyDescription: string;
  icon: React.ComponentType<{ className?: string }>;
}

export function UserManagement({
  role,
  title,
  description,
  emptyTitle,
  emptyDescription,
  icon: Icon,
}: UserManagementProps) {
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [showDeleted, setShowDeleted] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<SafeUser | null>(null);

  const { data: users = [], isLoading } = useQuery<SafeUser[]>({
    queryKey: [`/api/users?role=${role}`],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/users", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setIsFormOpen(false);
      toast({
        title: "Usuário criado!",
        description: "O usuário foi criado com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erro ao criar usuário",
        description: error.message || "Tente novamente.",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return await apiRequest("PATCH", `/api/users/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setIsFormOpen(false);
      setSelectedUser(null);
      toast({
        title: "Usuário atualizado!",
        description: "As alterações foram salvas.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erro ao atualizar usuário",
        description: error.message || "Tente novamente.",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/users/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setIsDeleteDialogOpen(false);
      setSelectedUser(null);
      toast({
        title: "Usuário excluído!",
        description: "O usuário foi removido com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erro ao excluir usuário",
        description: error.message || "Tente novamente.",
      });
    },
  });

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        user.name.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase());
      const matchesRole = roleFilter === "all" || user.role === roleFilter;
      const matchesDeleted = showDeleted || !user.deleted;
      return matchesSearch && matchesRole && matchesDeleted;
    });
  }, [users, search, roleFilter, showDeleted]);

  const handleEdit = (user: SafeUser) => {
    setSelectedUser(user);
    setIsFormOpen(true);
  };

  const handleDelete = (user: SafeUser) => {
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };

  const handleFormSubmit = async (data: any) => {
    if (selectedUser) {
      await updateMutation.mutateAsync({ id: selectedUser.id, data });
    } else {
      await createMutation.mutateAsync({ ...data, role });
    }
  };

  const handleDeleteConfirm = async () => {
    if (selectedUser) {
      await deleteMutation.mutateAsync(selectedUser.id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-3">
            <Icon className="h-6 w-6" />
            {title}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        </div>
        <Button onClick={() => setIsFormOpen(true)} data-testid="button-add-user">
          <Plus className="h-4 w-4 mr-2" />
          Adicionar
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1">
          <UserFilters
            search={search}
            onSearchChange={setSearch}
            roleFilter={roleFilter}
            onRoleFilterChange={setRoleFilter}
            showDeleted={showDeleted}
            onShowDeletedChange={setShowDeleted}
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={viewMode === "grid" ? "default" : "outline"}
            size="icon"
            onClick={() => setViewMode("grid")}
            data-testid="button-view-grid"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "table" ? "default" : "outline"}
            size="icon"
            onClick={() => setViewMode("table")}
            data-testid="button-view-table"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-[180px] rounded-lg" />
          ))}
        </div>
      ) : filteredUsers.length === 0 ? (
        <EmptyState
          icon={Icon}
          title={emptyTitle}
          description={emptyDescription}
          actionLabel="Adicionar primeiro usuário"
          onAction={() => setIsFormOpen(true)}
        />
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.map((user) => (
            <UserCard
              key={user.id}
              user={user}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        <UserTable
          users={filteredUsers}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      <UserFormModal
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) setSelectedUser(null);
        }}
        onSubmit={handleFormSubmit}
        user={selectedUser}
        isPending={createMutation.isPending || updateMutation.isPending}
      />

      <DeleteConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        title="Excluir usuário?"
        description={`Tem certeza que deseja excluir ${selectedUser?.name}? Esta ação não pode ser desfeita.`}
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}
