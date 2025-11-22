import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Key, Lock, Unlock, Code } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useAuth } from "@/lib/auth-context";
import { Redirect } from "wouter";

interface RouteDoc {
  method: string;
  path: string;
  description: string;
  auth: boolean;
  body?: any;
  queryParams?: any;
  permissions?: string;
  contentType?: string;
  responses: Record<string, any>;
}

interface EndpointGroup {
  group: string;
  routes: RouteDoc[];
}

interface ApiDocs {
  version: string;
  baseUrl: string;
  authentication: any;
  endpoints: EndpointGroup[];
}

export default function ApiDocs() {
  const [apiDocs, setApiDocs] = useState<ApiDocs | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchDocs();
    }
  }, [user]);

  const fetchDocs = async () => {
    setLoading(true);
    setError("");
    
    try {
      const response = await fetch("/api/docs", {
        credentials: "include",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Erro ao buscar documentação");
      }

      const data = await response.json();
      setApiDocs(data);
    } catch (err: any) {
      setError(err.message);
      setApiDocs(null);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado!",
      description: "Código copiado para a área de transferência",
    });
  };

  const generateCurl = (route: RouteDoc, baseUrl: string) => {
    let curl = `curl -X ${route.method} '${baseUrl}${route.path}'`;

    if (route.auth) {
      curl += ` \\\n  -H 'Cookie: token=<seu-jwt-token>'`;
    }

    if (route.contentType === "multipart/form-data") {
      curl += ` \\\n  -F 'file=@/caminho/para/arquivo.jpg'`;
    } else if (route.body) {
      curl += ` \\\n  -H 'Content-Type: application/json'`;
      const exampleBody: any = {};
      Object.keys(route.body).forEach((key) => {
        const value = route.body[key];
        if (value.includes("string")) {
          exampleBody[key] = "exemplo";
        } else {
          exampleBody[key] = "valor";
        }
      });
      curl += ` \\\n  -d '${JSON.stringify(exampleBody, null, 2)}'`;
    }

    return curl;
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case "GET":
        return "bg-blue-500";
      case "POST":
        return "bg-green-500";
      case "PATCH":
        return "bg-yellow-500";
      case "DELETE":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  if (!user) {
    return <Redirect to="/login" />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando documentação...</p>
        </div>
      </div>
    );
  }

  if (error || !apiDocs) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Erro ao Carregar</CardTitle>
            <CardDescription>{error || "Erro desconhecido"}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => fetchDocs()} className="w-full">
              Tentar Novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Documentação da API</h1>
              <p className="text-muted-foreground mt-1">
                Versão {apiDocs.version} • {apiDocs.baseUrl}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {user.role === "admin" ? "Administrador" : user.role === "attendant" ? "Atendente" : "Cliente"}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Autenticação</CardTitle>
              <CardDescription>{apiDocs.authentication.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {apiDocs.authentication.methods.map((method: any, index: number) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                    {method.type === "JWT Cookie" ? (
                      <Lock className="h-5 w-5 text-primary mt-0.5" />
                    ) : (
                      <Key className="h-5 w-5 text-primary mt-0.5" />
                    )}
                    <div className="flex-1">
                      <div className="font-medium">{method.type}</div>
                      <div className="text-sm text-muted-foreground mt-1">{method.description}</div>
                      <code className="text-xs bg-background px-2 py-1 rounded mt-2 inline-block">
                        {method.header}
                      </code>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {apiDocs.endpoints.map((group) => (
            <Card key={group.group}>
              <CardHeader>
                <CardTitle>{group.group}</CardTitle>
                <CardDescription>{group.routes.length} endpoints disponíveis</CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {group.routes.map((route, index) => (
                    <AccordionItem key={index} value={`route-${index}`}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3 flex-1">
                          <Badge className={`${getMethodColor(route.method)} text-white`}>
                            {route.method}
                          </Badge>
                          <code className="text-sm font-mono">{route.path}</code>
                          {route.auth && (
                            <Lock className="h-4 w-4 text-muted-foreground ml-auto" />
                          )}
                          {!route.auth && (
                            <Unlock className="h-4 w-4 text-muted-foreground ml-auto" />
                          )}
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-4 pt-4">
                          <p className="text-sm text-muted-foreground">{route.description}</p>

                          {route.permissions && (
                            <div className="bg-amber-50 dark:bg-amber-950 p-3 rounded-md">
                              <div className="text-sm font-medium text-amber-900 dark:text-amber-100">
                                Permissões
                              </div>
                              <div className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                                {route.permissions}
                              </div>
                            </div>
                          )}

                          <Tabs defaultValue="curl" className="w-full">
                            <TabsList>
                              <TabsTrigger value="curl">
                                <Code className="h-4 w-4 mr-2" />
                                cURL
                              </TabsTrigger>
                              {route.body && <TabsTrigger value="body">Body</TabsTrigger>}
                              {route.queryParams && (
                                <TabsTrigger value="params">Query Params</TabsTrigger>
                              )}
                              <TabsTrigger value="responses">Respostas</TabsTrigger>
                            </TabsList>

                            <TabsContent value="curl">
                              <div className="relative">
                                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                                  <code>{generateCurl(route, apiDocs.baseUrl)}</code>
                                </pre>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="absolute top-2 right-2"
                                  onClick={() =>
                                    copyToClipboard(generateCurl(route, apiDocs.baseUrl))
                                  }
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                              </div>
                            </TabsContent>

                            {route.body && (
                              <TabsContent value="body">
                                <div className="bg-muted p-4 rounded-lg">
                                  <pre className="text-sm">
                                    <code>{JSON.stringify(route.body, null, 2)}</code>
                                  </pre>
                                </div>
                              </TabsContent>
                            )}

                            {route.queryParams && (
                              <TabsContent value="params">
                                <div className="bg-muted p-4 rounded-lg">
                                  <pre className="text-sm">
                                    <code>{JSON.stringify(route.queryParams, null, 2)}</code>
                                  </pre>
                                </div>
                              </TabsContent>
                            )}

                            <TabsContent value="responses">
                              <div className="space-y-3">
                                {Object.entries(route.responses).map(([status, response]) => (
                                  <div key={status} className="bg-muted p-4 rounded-lg">
                                    <div className="flex items-center gap-2 mb-2">
                                      <Badge
                                        variant={
                                          status.startsWith("2")
                                            ? "default"
                                            : status.startsWith("4")
                                            ? "destructive"
                                            : "secondary"
                                        }
                                      >
                                        {status}
                                      </Badge>
                                      {response.description && (
                                        <span className="text-sm text-muted-foreground">
                                          {response.description}
                                        </span>
                                      )}
                                    </div>
                                    {(response.example || response.message) && (
                                      <pre className="text-sm mt-2 overflow-x-auto">
                                        <code>
                                          {JSON.stringify(
                                            response.example || { message: response.message },
                                            null,
                                            2
                                          )}
                                        </code>
                                      </pre>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </TabsContent>
                          </Tabs>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
