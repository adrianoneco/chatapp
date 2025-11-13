import type { Request, Response, NextFunction } from "express";

function isValidGlobalApiKey(apiKey: string | undefined): boolean {
  if (!apiKey || !process.env.GLOBAL_API_KEY) {
    return false;
  }
  return apiKey === process.env.GLOBAL_API_KEY;
}

function extractApiKeyFromRequest(req: Request): string | undefined {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }
  return req.query.api_key as string | undefined;
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const apiKey = extractApiKeyFromRequest(req);
  
  if (isValidGlobalApiKey(apiKey)) {
    return next();
  }
  
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Autenticação necessária" });
  }
  next();
}

const API_KEY_CAPABILITIES = {
  allowedRoles: ["admin", "attendant", "client"] as const,
};

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const apiKey = extractApiKeyFromRequest(req);
    
    if (isValidGlobalApiKey(apiKey)) {
      const hasCapability = roles.some(role => 
        API_KEY_CAPABILITIES.allowedRoles.includes(role as any)
      );
      
      if (!hasCapability) {
        console.warn(`[SECURITY] GLOBAL_API_KEY attempted unauthorized role: ${roles.join(", ")}`);
        return res.status(403).json({ message: "API key não tem permissão para este recurso" });
      }
      
      console.log(`[API_KEY] Authorized request to ${req.method} ${req.path}`);
      return next();
    }
    
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Autenticação necessária" });
    }

    const userRole = (req.user as any)?.role;
    if (!roles.includes(userRole)) {
      return res.status(403).json({ message: "Acesso negado" });
    }

    next();
  };
}

export { isValidGlobalApiKey };
