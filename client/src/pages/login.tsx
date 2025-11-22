import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginUser } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { PiChatTeardropFill } from "react-icons/pi";

export default function Login() {
  const [location, setLocation] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Get redirect URL from query params
  const getRedirectUrl = () => {
    const params = new URLSearchParams(window.location.search);
    return params.get('redirect');
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginUser>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginUser) => {
    setIsLoading(true);
    try {
      await login(data.email, data.password);

      // Wait a bit for auth state to update
      await new Promise(resolve => setTimeout(resolve, 100));

      toast({
        title: "Login realizado com sucesso!",
        description: "Bem-vindo de volta.",
      });

      // Priority: redirect param > lastVisitedPage > dashboard
      const redirectUrl = getRedirectUrl();
      if (redirectUrl && redirectUrl !== '/' && !redirectUrl.startsWith('/login') && !redirectUrl.startsWith('/register')) {
        setLocation(decodeURIComponent(redirectUrl));
      } else {
        const lastPage = localStorage.getItem('lastVisitedPage');
        if (lastPage && lastPage !== '/' && !lastPage.startsWith('/login') && !lastPage.startsWith('/register')) {
          setLocation(lastPage);
        } else {
          setLocation("/contacts");
        }
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao fazer login",
        description: error.message || "Verifique suas credenciais e tente novamente.",
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
          <div className="flex justify-center items-center gap-3">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br bg-gradient-to-br from-purple-950 via-purple-900 to-blue-950 flex items-center justify-center shadow-xl">
              <PiChatTeardropFill className="h-12 w-12 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white">ChatApp</h1>
          </div>
          <div>
            <CardDescription className="text-gray-300">Digite suas credenciais para acessar</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

            <div className="flex justify-end">
              <Link
                href="/forgot-password"
                className="text-sm text-purple-300 hover:text-purple-200 hover:underline"
                data-testid="link-forgot-password"
              >
                Esqueceu sua senha?
              </Link>
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
              disabled={isLoading}
              data-testid="button-login"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Entrar
            </Button>

            <div className="text-center text-sm text-gray-300">
              Não tem uma conta?{" "}
              <Link href="/register" className="text-purple-300 hover:text-purple-200 hover:underline" data-testid="link-register">
                Cadastre-se
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
