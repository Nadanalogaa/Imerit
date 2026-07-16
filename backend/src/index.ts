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
import profileRouter from "./routes/profile.routes.js";
import adminRouter from "./routes/admin.routes.js";
import plansRouter from "./routes/plans.routes.js";
import jobsRouter from "./routes/jobs.routes.js";
import staffRouter from "./routes/staff.routes.js";
import { ensureAdminUsers } from "./services/seed.service.js";
import { ensureDefaultPlans } from "./services/plans.service.js";
import { ensureDemoJobs } from "./services/jobs-seed.service.js";

const app = express();

// Behind a reverse proxy (Render, AWS ALB) — trust the X-Forwarded-* headers
// so req.ip and req.protocol reflect the real client, not the proxy.
app.set("trust proxy", 1);

// Security headers
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));

// CORS — credentials true so the frontend can send the httpOnly auth cookie.
// Allow any origin in the explicit env list PLUS any *.vercel.app subdomain
// (so Vercel preview deploys + branch deploys don't need a config push every
// time). Requests with no Origin (server-to-server, curl, healthchecks) are
// allowed through unchanged.
const VERCEL_ANY = /^https:\/\/[a-z0-9-]+\.vercel\.app$/i;
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (env.CORS_ORIGINS.includes(origin)) return callback(null, true);
      if (VERCEL_ANY.test(origin)) return callback(null, true);
      // Don't throw — cors lib will then omit the allow-origin header, so the
      // browser blocks the actual request without producing a 500.
      callback(null, false);
    },
    credentials: true,
  }),
);

app.use(cookieParser());
// 8MB ceiling — a base64-encoded 4MB photo is ~5.4MB, plus a little room for
// the other profile fields when the frontend PATCHes the whole step at once.
app.use(express.json({ limit: "8mb" }));
app.use(express.urlencoded({ extended: true, limit: "8mb" }));

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
app.use(profileRouter);
app.use(adminRouter);
app.use(plansRouter);
app.use(jobsRouter);
app.use(staffRouter);
app.get("/", (_req, res) => {
  res.json({ name: "itamil-recruit-backend", version: "0.1.0", env: env.NODE_ENV });
});

// Error handling — MUST stay last in the chain
app.use(notFoundHandler);
app.use(errorHandler);

const server = app.listen(env.PORT, () => {
  logger.info({ port: env.PORT, env: env.NODE_ENV }, "i-Tamil Recruit backend listening");
  // Best-effort seed at boot — never block the listen handshake on it.
  ensureAdminUsers().catch((err) => {
    logger.error({ err }, "Admin seeding failed");
  });
  ensureDefaultPlans().catch((err) => {
    logger.error({ err }, "Default plans seeding failed");
  });
  ensureDemoJobs().catch((err) => {
    logger.error({ err }, "Demo jobs seeding failed");
  });
});

// Graceful shutdown — match Prisma's signal handlers
const shutdown = (signal: string) => {
  logger.info({ signal }, "HTTP server closing");
  server.close(() => process.exit(0));
};
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
