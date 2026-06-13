import type { ErrorRequestHandler, NextFunction, Request, RequestHandler, Response } from "express";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { logger } from "../lib/logger.js";

/**
 * Throw `new HttpError(404, "Job not found", "JOB_NOT_FOUND")` from any
 * handler — the centralized error middleware below turns it into a JSON
 * response with the right HTTP status and a machine-readable code.
 */
export class HttpError extends Error {
  status: number;
  code: string;
  details?: unknown;
  constructor(status: number, message: string, code = "ERROR", details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

/** 404 catch-all for unknown routes — mount AFTER all real routes. */
export const notFoundHandler: RequestHandler = (_req, _res, next) => {
  next(new HttpError(404, "Not Found", "ROUTE_NOT_FOUND"));
};

/** Centralised error → JSON converter. Keep this LAST in the middleware chain. */
export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  // Zod validation failures from the validate() middleware
  if (err instanceof ZodError) {
    res.status(422).json({
      error: { code: "VALIDATION_ERROR", message: "Invalid request", issues: err.flatten() },
    });
    return;
  }

  // Prisma unique-constraint errors → 409
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      res.status(409).json({
        error: {
          code: "UNIQUE_CONSTRAINT",
          message: "A record with these unique fields already exists",
          target: err.meta?.target ?? null,
        },
      });
      return;
    }
    if (err.code === "P2025") {
      res.status(404).json({ error: { code: "NOT_FOUND", message: "Record not found" } });
      return;
    }
  }

  if (err instanceof HttpError) {
    if (err.status >= 500) {
      logger.error({ err, path: req.path }, "HttpError");
    }
    res.status(err.status).json({
      error: { code: err.code, message: err.message, details: err.details ?? undefined },
    });
    return;
  }

  // Unknown — log full stack but DON'T leak internals to the client.
  logger.error({ err, path: req.path, method: req.method }, "Unhandled error");
  res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Internal server error" } });
};

/** Wraps async route handlers so thrown errors land in errorHandler. */
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
