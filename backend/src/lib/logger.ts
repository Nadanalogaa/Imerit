import pino from "pino";
import { env } from "../config/env.js";

/**
 * Pretty colored logs in dev, structured JSON in prod (so log aggregators
 * like CloudWatch / Logtail can index them).
 */
export const logger = pino(
  env.NODE_ENV === "development"
    ? {
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:HH:MM:ss.l",
            ignore: "pid,hostname",
          },
        },
        level: "debug",
      }
    : {
        level: "info",
        // Redact common sensitive headers so they never end up in logs.
        redact: ["req.headers.authorization", "req.headers.cookie", "*.password", "*.passwordHash"],
      },
);
