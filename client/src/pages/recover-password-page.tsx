import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "wouter";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, Loader2, CheckCircle2 } from "lucide-react";
import logo from "@assets/generated_images/abstract_chat_bubble_icon_with_gradient.png";
import { useRecoverPassword } from "@/lib/api";

const recoverSchema = z.object({
  email: z.string().email("Email inválido"),
});

export default function RecoverPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const recoverForm = useForm<z.infer<typeof recoverSchema>>({
    resolver: zodResolver(recoverSchema),
    defaultValues: { email: "" },
  });

  const recoverMutation = useRecoverPassword();

  const onRecover = async (values: z.infer<typeof recoverSchema>) => {
    setIsLoading(true);
    setError(null);
    try {
      await recoverMutation.mutateAsync(values);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Erro ao solicitar recuperação de senha");
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
          <h1 className="text-3xl font-bold tracking-tight text-white font-[Outfit]">Recuperar Senha</h1>
          <p className="text-slate-400">Digite seu email para receber instruções</p>
        </div>

        <Card className="border-white/10 bg-black/40 backdrop-blur-md shadow-2xl">
          {success ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300" data-testid="recover-success-message">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 className="h-6 w-6 text-green-400" />
                </div>
                <CardTitle className="text-xl text-white text-center">Email Enviado!</CardTitle>
                <CardDescription className="text-center">
                  Se o email existir em nosso sistema, você receberá instruções para redefinir sua senha.
                </CardDescription>
              </CardHeader>
              <CardFooter className="flex justify-center">
                <Link href="/login">
                  <Button variant="outline" className="bg-white/5 border-white/10 hover:bg-white/10 hover:text-white text-slate-300" data-testid="back-to-login-button">
                    Voltar para o login
                  </Button>
                </Link>
              </CardFooter>
            </div>
          ) : (
            <>
              <CardHeader>
                <CardTitle className="text-xl text-white">Recuperar Senha</CardTitle>
                <CardDescription>
                  Digite seu email para receber um link de redefinição.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {error && (
                  <Alert variant="destructive" className="mb-4" data-testid="recover-error-alert">
                    <AlertDescription data-testid="recover-error-message">{error}</AlertDescription>
                  </Alert>
                )}
                
                <Form {...recoverForm}>
                  <form onSubmit={recoverForm.handleSubmit(onRecover)} className="space-y-4" data-testid="recover-form">
                    <FormField
                      control={recoverForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white/80">Email</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                              <Input data-testid="recover-email-input" placeholder="seu@email.com" className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus-visible:ring-purple-500" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button data-testid="recover-submit-button" type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white" disabled={isLoading}>
                      {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Enviar Link"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
              <CardFooter className="flex justify-center">
                <Link href="/login">
                  <Button variant="link" className="text-slate-400 hover:text-white" data-testid="back-to-login-link">
                    Voltar para o login
                  </Button>
                </Link>
              </CardFooter>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
