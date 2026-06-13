import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../middleware/error.js";

const router = Router();

/** Liveness probe — process is up. Used by Render/Docker. */
router.get("/healthz", (_req, res) => {
  res.json({ ok: true, uptimeSeconds: Math.round(process.uptime()) });
});

/** Readiness probe — DB reachable + can execute a trivial query. */
router.get(
  "/readyz",
  asyncHandler(async (_req, res) => {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ok: true, db: "ready" });
  }),
);

export default router;
