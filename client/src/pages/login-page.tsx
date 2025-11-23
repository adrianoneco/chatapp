import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "wouter";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, Lock, ArrowRight, Loader2 } from "lucide-react";
import logo from "@assets/generated_images/abstract_chat_bubble_icon_with_gradient.png";
import { useLogin } from "@/lib/api";

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
});

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const loginMutation = useLogin();

  const onLogin = async (values: z.infer<typeof loginSchema>) => {
    setIsLoading(true);
    setError(null);
    try {
      await loginMutation.mutateAsync(values);
      window.location.href = "/";
    } catch (err: any) {
      setError(err.message || "Erro ao fazer login");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 p-4 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[100px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[100px]" />
      
      <div className="w-full max-w-md z-10">
        <div className="text-center mb-8 space-y-2">
          <div className="mx-auto w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-xl border border-white/20 shadow-2xl mb-6">
            <img src={logo} alt="Logo" className="w-10 h-10 object-contain" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white font-[Outfit]">Bem-vindo de volta</h1>
          <p className="text-slate-400">Faça login para continuar no ChatApp</p>
        </div>

        <Card className="border-white/10 bg-black/40 backdrop-blur-md shadow-2xl">
          <CardHeader>
            <CardTitle className="text-xl text-white">Login</CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4" data-testid="login-error-alert">
                <AlertDescription data-testid="login-error-message">{error}</AlertDescription>
              </Alert>
            )}
            
            <Form {...loginForm}>
              <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4" data-testid="login-form">
                <FormField
                  control={loginForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/80">Email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                          <Input data-testid="login-email-input" placeholder="seu@email.com" className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus-visible:ring-purple-500" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={loginForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel className="text-white/80">Senha</FormLabel>
                        <Link href="/recover">
                          <Button 
                            type="button" 
                            variant="link" 
                            className="p-0 h-auto text-xs text-purple-400 hover:text-purple-300 font-normal"
                            data-testid="forgot-password-link"
                          >
                            Esqueceu a senha?
                          </Button>
                        </Link>
                      </div>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                          <Input data-testid="login-password-input" type="password" placeholder="••••••••" className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus-visible:ring-purple-500" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button data-testid="login-submit-button" type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white" disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <span className="flex items-center">Entrar <ArrowRight className="ml-2 h-4 w-4" /></span>}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="text-center text-sm text-slate-400">
              Não tem uma conta?{" "}
              <Link href="/register">
                <Button variant="link" className="p-0 h-auto text-purple-400 hover:text-purple-300 font-normal" data-testid="register-link">
                  Cadastre-se
                </Button>
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
