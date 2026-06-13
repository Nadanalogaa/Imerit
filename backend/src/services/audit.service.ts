import type { Request } from "express";
import { type AuditAction, type UserRole, type Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { logger } from "../lib/logger.js";

/**
 * Best-effort audit-log writer. Used for compliance + the admin "activity"
 * feed. Failures are logged but never thrown — we don't want an audit-DB
 * hiccup to break a real user request.
 *
 * Action enum values live in prisma/schema.prisma → keep them in sync.
 */
export async function recordAudit(args: {
  req?: Request;
  actorId?: string | null;
  actorRole?: UserRole | null;
  action: AuditAction;
  targetType?: string;
  targetId?: string;
  payload?: Prisma.InputJsonValue;
}): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: args.actorId ?? args.req?.user?.sub ?? null,
        actorRole: args.actorRole ?? args.req?.user?.role ?? null,
        action: args.action,
        targetType: args.targetType,
        targetId: args.targetId,
        payload: args.payload,
        ip: args.req?.ip,
        userAgent: args.req?.headers["user-agent"]?.slice(0, 512),
      },
    });
  } catch (err) {
    logger.warn({ err, action: args.action }, "Failed to write audit log");
  }
}
