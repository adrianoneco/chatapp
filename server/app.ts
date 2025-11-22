import { type Server } from "node:http";
import path from "node:path";
import fs from "node:fs";

import express, {
  type Express,
  type Request,
  Response,
  NextFunction,
} from "express";

import cookieParser from "cookie-parser";
import { registerRoutes } from "./routes";
import { initializeDatabase } from "./database";

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export const app = express();

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Create data directory structure if it doesn't exist
const dataDir = path.join(process.cwd(), "data");
const dataUploadsDir = path.join(dataDir, "uploads");
const profilesDir = path.join(dataUploadsDir, "profiles");
const messagesDir = path.join(dataUploadsDir, "messages");
const attachmentsDir = path.join(dataUploadsDir, "attachments");
[dataDir, dataUploadsDir, profilesDir, messagesDir, attachmentsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown
  }
}

app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Enable CORS with credentials so cookies (HttpOnly session token) are allowed
// When behind a proxy or using a separate client origin, browsers will only
// include cookies if Access-Control-Allow-Credentials is true and the
// Access-Control-Allow-Origin is not '*'. We reflect the incoming origin
// to allow same-site and cross-site dev setups. For production consider
// setting a specific `CLIENT_ORIGIN` env var instead of reflecting origin.
import cors from "cors";

// Configure CORS to allow requests from the Replit environment
// In development, Vite serves the frontend on the same origin
// In production, we serve both from the same server
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (same-origin, curl, server-to-server)
      if (!origin) return callback(null, true);
      
      // Allow Replit dev/production URLs
      if (origin.includes('.replit.dev') || origin.includes('.repl.co') || origin.includes('.replit.app')) {
        return callback(null, true);
      }
      
      // Allow localhost for local development
      if (origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) {
        return callback(null, true);
      }
      
      // Allow custom CLIENT_ORIGIN if set
      if (process.env.CLIENT_ORIGIN && origin === process.env.CLIENT_ORIGIN) {
        return callback(null, true);
      }
      
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  }),
);

// Serve uploaded files (legacy)
app.use("/uploads", express.static(uploadsDir));

// Serve data files
app.use("/data", express.static(dataDir));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

export default async function runApp(
  setup: (app: Express, server: Server) => Promise<void>,
) {
  // Initialize database tables
  try {
    await initializeDatabase();
  } catch (error) {
    console.error("Failed to initialize database:", error);
    process.exit(1);
  }

  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly run the final setup after setting up all the other routes so
  // the catch-all route doesn't interfere with the other routes
  await setup(app, server);

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
}
