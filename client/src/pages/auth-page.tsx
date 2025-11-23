import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Github, Mail, Lock, User, ArrowRight, Loader2 } from "lucide-react";
import logo from "@assets/generated_images/abstract_chat_bubble_icon_with_gradient.png";
import { useLogin, useRegister, useRecoverPassword } from "@/lib/api";

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
});

const registerSchema = z.object({
  name: z.string().min(2, "Nome muito curto"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

const recoverSchema = z.object({
  email: z.string().email("Email inválido"),
});

export default function AuthPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("login");
  const [showRecover, setShowRecover] = useState(false);

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
  });

  const recoverForm = useForm<z.infer<typeof recoverSchema>>({
    resolver: zodResolver(recoverSchema),
    defaultValues: { email: "" },
  });

  const loginMutation = useLogin();
  const registerMutation = useRegister();
  const recoverMutation = useRecoverPassword();

  const onLogin = async (values: z.infer<typeof loginSchema>) => {
    setIsLoading(true);
    try {
      await loginMutation.mutateAsync(values);
      window.location.href = "/";
    } catch (error: any) {
      loginForm.setError("root", { message: error.message || "Erro ao fazer login" });
    } finally {
      setIsLoading(false);
    }
  };

  const onRegister = async (values: z.infer<typeof registerSchema>) => {
    setIsLoading(true);
    try {
      await registerMutation.mutateAsync({
        email: values.email,
        password: values.password,
        displayName: values.name,
      });
      window.location.href = "/";
    } catch (error: any) {
      registerForm.setError("root", { message: error.message || "Erro ao criar conta" });
    } finally {
      setIsLoading(false);
    }
  };

  const onRecover = async (values: z.infer<typeof recoverSchema>) => {
    setIsLoading(true);
    try {
      await recoverMutation.mutateAsync(values);
      setShowRecover(false);
      setActiveTab("login");
    } catch (error: any) {
      recoverForm.setError("root", { message: error.message || "Erro ao recuperar senha" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 p-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[100px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[100px]" />
      
      <div className="w-full max-w-md z-10">
        <div className="text-center mb-8 space-y-2">
          <div className="mx-auto w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-xl border border-white/20 shadow-2xl mb-6">
            <img src={logo} alt="Logo" className="w-10 h-10 object-contain" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white font-[Outfit]">Bem-vindo ao ChatApp</h1>
          <p className="text-slate-400">Conecte-se com o mundo de forma simples.</p>
        </div>

        <Card className="border-white/10 bg-black/40 backdrop-blur-md shadow-2xl">
          {showRecover ? (
             <div className="animate-in fade-in slide-in-from-right-4 duration-300">
               <CardHeader>
                <CardTitle className="text-xl text-white">Recuperar Senha</CardTitle>
                <CardDescription>Digite seu email para receber um link de redefinição.</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...recoverForm}>
                  <form onSubmit={recoverForm.handleSubmit(onRecover)} className="space-y-4">
                    <FormField
                      control={recoverForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white/80">Email</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                              <Input placeholder="seu@email.com" className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus-visible:ring-purple-500" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white" disabled={isLoading}>
                      {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Enviar Link"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
              <CardFooter className="flex justify-center">
                <Button variant="link" className="text-slate-400 hover:text-white" onClick={() => setShowRecover(false)}>
                  Voltar para o login
                </Button>
              </CardFooter>
             </div>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-white/5 p-1">
                <TabsTrigger value="login" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-slate-400">Login</TabsTrigger>
                <TabsTrigger value="register" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-slate-400">Cadastro</TabsTrigger>
              </TabsList>
              
              <div className="p-6">
                <TabsContent value="login" className="mt-0 animate-in fade-in duration-300">
                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                      <FormField
                        control={loginForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white/80">Email</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                <Input placeholder="seu@email.com" className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus-visible:ring-purple-500" {...field} />
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
                              <Button 
                                type="button" 
                                variant="link" 
                                className="p-0 h-auto text-xs text-purple-400 hover:text-purple-300 font-normal"
                                onClick={() => setShowRecover(true)}
                              >
                                Esqueceu a senha?
                              </Button>
                            </div>
                            <FormControl>
                              <div className="relative">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                <Input type="password" placeholder="••••••••" className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus-visible:ring-purple-500" {...field} />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white" disabled={isLoading}>
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <span className="flex items-center">Entrar <ArrowRight className="ml-2 h-4 w-4" /></span>}
                      </Button>
                    </form>
                  </Form>
                </TabsContent>

                <TabsContent value="register" className="mt-0 animate-in fade-in duration-300">
                  <Form {...registerForm}>
                    <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                      <FormField
                        control={registerForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white/80">Nome</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                <Input placeholder="Seu nome" className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus-visible:ring-purple-500" {...field} />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white/80">Email</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                <Input placeholder="seu@email.com" className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus-visible:ring-purple-500" {...field} />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={registerForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-white/80">Senha</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                  <Input type="password" placeholder="••••••" className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus-visible:ring-purple-500" {...field} />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={registerForm.control}
                          name="confirmPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-white/80">Confirmar</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                  <Input type="password" placeholder="••••••" className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus-visible:ring-purple-500" {...field} />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white" disabled={isLoading}>
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Criar Conta"}
                      </Button>
                    </form>
                  </Form>
                </TabsContent>
              </div>
            </Tabs>
          )}
          
          <div className="px-6 pb-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="bg-white/10" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[#121622] px-2 text-slate-500">Ou continue com</span>
              </div>
            </div>
            
            <div className="mt-4 grid grid-cols-1">
              <Button variant="outline" className="bg-white/5 border-white/10 hover:bg-white/10 hover:text-white text-slate-300">
                <Github className="mr-2 h-4 w-4" /> Github
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
