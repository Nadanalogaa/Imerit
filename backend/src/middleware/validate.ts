import type { RequestHandler } from "express";
import type { ZodSchema } from "zod";

/**
 * Validate a request slice (body | query | params) against a Zod schema.
 * On success, REPLACES the slice with the parsed (coerced + defaulted) value
 * so downstream handlers can trust the types. On failure the ZodError is
 * thrown and handled by the central error handler → 422.
 */
export const validate =
  (schemas: { body?: ZodSchema; query?: ZodSchema; params?: ZodSchema }): RequestHandler =>
  (req, _res, next) => {
    try {
      if (schemas.body) req.body = schemas.body.parse(req.body);
      if (schemas.query) {
        // Express 5's req.query is a getter; replace via Object.assign instead of reassignment.
        const parsed = schemas.query.parse(req.query);
        Object.keys(req.query).forEach((k) => delete (req.query as Record<string, unknown>)[k]);
        Object.assign(req.query, parsed);
      }
      if (schemas.params) req.params = schemas.params.parse(req.params);
      next();
    } catch (err) {
      next(err);
    }
  };
