import express, { type Express } from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import pinoHttp from "pino-http";
import { clerkMiddleware } from "@clerk/express";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Standard Clerk middleware using configured keys
if (process.env.CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY) {
  app.use(
    clerkMiddleware({
      publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
      secretKey: process.env.CLERK_SECRET_KEY,
    }),
  );
} else {
  logger.warn(
    "CLERK_PUBLISHABLE_KEY or CLERK_SECRET_KEY missing. Authentication middleware running in permissive mode.",
  );
}

// API Routes
app.use("/api", router);

// In production, serve the built frontend client if present
const clientDistPath = path.resolve(process.cwd(), "../client/dist");
const clientDistAlt = path.resolve(process.cwd(), "dist/public");
const staticDir = fs.existsSync(clientDistPath)
  ? clientDistPath
  : fs.existsSync(clientDistAlt)
    ? clientDistAlt
    : null;

if (staticDir) {
  app.use(express.static(staticDir));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) {
      return next();
    }
    res.sendFile(path.join(staticDir, "index.html"));
  });
}

// Global error handler
app.use(
  (
    err: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    logger.error({ err }, "Unhandled server error");
    const message =
      err instanceof Error ? err.message : "Internal Server Error";
    res.status(500).json({ error: message });
  },
);

export default app;
