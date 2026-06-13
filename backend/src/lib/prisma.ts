import { PrismaClient } from "@prisma/client";
import { env } from "../config/env.js";
import { logger } from "./logger.js";

/**
 * Single Prisma client for the whole process. Reusing one instance keeps the
 * MySQL connection pool sane. In dev with hot-reload we stash it on globalThis
 * so HMR doesn't spawn a new client (and exhaust connections) on every change.
 */
declare global {
  var __prisma: PrismaClient | undefined;
}

export const prisma =
  globalThis.__prisma ??
  new PrismaClient({
    log: env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (env.NODE_ENV === "development") {
  globalThis.__prisma = prisma;
}

// Graceful shutdown so docker/render's SIGTERM doesn't leave hanging connections.
const shutdown = async (signal: string) => {
  logger.info({ signal }, "Shutting down Prisma client");
  await prisma.$disconnect();
  process.exit(0);
};
process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
