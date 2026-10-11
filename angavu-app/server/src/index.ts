import dotenv from "dotenv";
import path from "path";

// Load environment variables from parent .env or local .env
dotenv.config({ path: path.resolve(process.cwd(), "../.env") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

import app from "./app";
import { logger } from "./lib/logger";
import { getDb, closeDatabase } from "./db";

const port = Number(process.env.PORT || 5000);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${process.env.PORT}"`);
}

// Ensure database tables exist
try {
  getDb();
  logger.info("SQLite database connected and initialized.");
} catch (err) {
  logger.error({ err }, "Failed to initialize SQLite database.");
}

const server = app.listen(port, () => {
  logger.info({ port }, `Angavu API server listening on http://localhost:${port}`);
});

function handleShutdown(signal: string) {
  logger.info({ signal }, "Shutting down gracefully...");
  server.close(() => {
    closeDatabase();
    logger.info("Database and server closed.");
    process.exit(0);
  });
}

process.on("SIGTERM", () => handleShutdown("SIGTERM"));
process.on("SIGINT", () => handleShutdown("SIGINT"));
