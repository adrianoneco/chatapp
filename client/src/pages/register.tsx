import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerUserSchema, type RegisterUser } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, MessageSquare } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function Register() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterUser>({
    resolver: zodResolver(registerUserSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: "client",
    },
  });

  const onSubmit = async (data: RegisterUser) => {
    setIsLoading(true);
    try {
      await apiRequest("POST", "/api/auth/register", data);
      toast({
        title: "Cadastro realizado com sucesso!",
        description: "Você já pode fazer login com suas credenciais.",
      });
      setLocation("/login");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao cadastrar",
        description: error.message || "Tente novamente mais tarde.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-gradient-to-br from-purple-950 via-purple-900 to-blue-950">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-blue-900/20" />
      <Card className="w-full max-w-md relative z-10 border-white/10 bg-black/40 backdrop-blur-xl">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-xl shadow-purple-500/50">
              <img 
                src="/logo.svg" 
                alt="Logo" 
                className="h-10 w-10"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
              <MessageSquare className="hidden h-8 w-8 text-white" />
            </div>
          </div>
          <div>
            <CardTitle className="text-2xl text-white">Criar Conta</CardTitle>
            <CardDescription className="text-gray-300">Preencha os dados para se cadastrar</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-white">Nome Completo</Label>
              <Input
                id="name"
                placeholder="João Silva"
                {...register("name")}
                data-testid="input-name"
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:bg-white/15"
              />
              {errors.name && <p className="text-sm text-red-400">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-white">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                {...register("email")}
                data-testid="input-email"
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:bg-white/15"
              />
              {errors.email && <p className="text-sm text-red-400">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-white">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                {...register("password")}
                data-testid="input-password"
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:bg-white/15"
              />
              {errors.password && <p className="text-sm text-red-400">{errors.password.message}</p>}
            </div>

            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white" 
              disabled={isLoading} 
              data-testid="button-register"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Criar Conta
            </Button>

            <div className="text-center text-sm text-gray-300">
              Já tem uma conta?{" "}
              <Link href="/login" className="text-purple-300 hover:text-purple-200 hover:underline" data-testid="link-login">
                Faça login
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
