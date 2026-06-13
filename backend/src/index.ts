import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import pinoHttp from "pino-http";

import { env } from "./config/env.js";
import { logger } from "./lib/logger.js";
import { errorHandler, notFoundHandler } from "./middleware/error.js";
import healthRouter from "./routes/health.js";
import authRouter from "./routes/auth.routes.js";

const app = express();

// Behind a reverse proxy (Render, AWS ALB) — trust the X-Forwarded-* headers
// so req.ip and req.protocol reflect the real client, not the proxy.
app.set("trust proxy", 1);

// Security headers
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));

// CORS — credentials true so the frontend can send the httpOnly auth cookie
app.use(
  cors({
    origin: env.CORS_ORIGINS,
    credentials: true,
  }),
);

app.use(cookieParser());
app.use(express.json({ limit: "5mb" })); // large enough for embedded base64 photos during dev
app.use(express.urlencoded({ extended: true }));

// Per-request structured logger. The cast works around pino-http's overly
// strict generic on `logger`; runtime behaviour is identical.
app.use(
  pinoHttp({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    logger: logger as any,
    customLogLevel: (_req, res, err) => {
      if (err || res.statusCode >= 500) return "error";
      if (res.statusCode >= 400) return "warn";
      return "info";
    },
  }),
);

// Default rate limit: 300 req / 15 min / IP. Per-route limits can be tighter
// (e.g. login + OTP request will need their own much-lower limits).
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: "draft-7",
    legacyHeaders: false,
  }),
);

// Routes
app.use(healthRouter);
app.use(authRouter);
app.get("/", (_req, res) => {
  res.json({ name: "itamil-recruit-backend", version: "0.1.0", env: env.NODE_ENV });
});

// Error handling — MUST stay last in the chain
app.use(notFoundHandler);
app.use(errorHandler);

const server = app.listen(env.PORT, () => {
  logger.info({ port: env.PORT, env: env.NODE_ENV }, "i-Tamil Recruit backend listening");
});

// Graceful shutdown — match Prisma's signal handlers
const shutdown = (signal: string) => {
  logger.info({ signal }, "HTTP server closing");
  server.close(() => process.exit(0));
};
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
