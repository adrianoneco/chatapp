import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { UserAvatar } from "./user-avatar";
import { Camera, Loader2 } from "lucide-react";
import type { SafeUser } from "@shared/schema";
import { useState } from "react";

const userFormSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  role: z.enum(["client", "attendant", "admin"]),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres").optional().or(z.literal("")),
});

type UserFormData = z.infer<typeof userFormSchema>;

interface UserFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: UserFormData & { image?: string }) => Promise<void>;
  user?: SafeUser | null;
  isPending?: boolean;
}

export function UserFormModal({ open, onOpenChange, onSubmit, user, isPending }: UserFormModalProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(user?.image || null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues: user
      ? {
          name: user.name,
          email: user.email,
          role: user.role as any,
          password: "",
        }
      : {
          name: "",
          email: "",
          role: "client",
          password: "",
        },
  });

  const role = watch("role");

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Erro ao fazer upload");

      const { url } = await response.json();
      setImagePreview(url);
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
    } finally {
      setUploadingImage(false);
    }
  };

  const onFormSubmit = async (data: UserFormData) => {
    await onSubmit({
      ...data,
      image: imagePreview || undefined,
      password: data.password || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]" data-testid="modal-user-form">
        <DialogHeader>
          <DialogTitle>{user ? "Editar Usuário" : "Novo Usuário"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
          <div className="flex flex-col items-center gap-4">
            <div className="relative group">
              <UserAvatar
                name={watch("name") || "U"}
                image={imagePreview}
                className="h-24 w-24"
              />
              <label
                htmlFor="image-upload"
                className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                {uploadingImage ? (
                  <Loader2 className="h-6 w-6 text-white animate-spin" />
                ) : (
                  <Camera className="h-6 w-6 text-white" />
                )}
              </label>
              <input
                id="image-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
                disabled={uploadingImage}
                data-testid="input-image-upload"
              />
            </div>
            <p className="text-xs text-muted-foreground">Clique na imagem para alterar</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                {...register("name")}
                placeholder="Digite o nome completo"
                data-testid="input-name"
              />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...register("email")}
                placeholder="email@exemplo.com"
                data-testid="input-email"
              />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Função</Label>
              <Select value={role} onValueChange={(value) => setValue("role", value as any)}>
                <SelectTrigger data-testid="select-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="client">Cliente</SelectItem>
                  <SelectItem value="attendant">Atendente</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
              {errors.role && <p className="text-sm text-destructive">{errors.role.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">
                {user ? "Nova Senha (deixe em branco para manter)" : "Senha"}
              </Label>
              <Input
                id="password"
                type="password"
                {...register("password")}
                placeholder={user ? "••••••••" : "Digite a senha"}
                data-testid="input-password"
              />
              {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
              data-testid="button-cancel"
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending} data-testid="button-submit">
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {user ? "Salvar Alterações" : "Criar Usuário"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
