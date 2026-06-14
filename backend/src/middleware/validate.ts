import type { RequestHandler } from "express";
import type { ZodSchema } from "zod";

/**
 * Validate a request slice (body | query | params) against a Zod schema.
 * On success, REPLACES the slice with the parsed (coerced + defaulted) value
 * so downstream handlers can trust the types. On failure the ZodError is
 * thrown and handled by the central error handler → 422.
 *
 * Note on `req.query`: Express 5 made it a getter that re-parses the URL on
 * every access, so naive mutation (Object.assign / delete) is silently
 * discarded — the handler keeps seeing the original string-only values.
 * We override the getter with a plain data property so the parsed +
 * coerced object becomes the canonical `req.query`.
 */
export const validate =
  (schemas: { body?: ZodSchema; query?: ZodSchema; params?: ZodSchema }): RequestHandler =>
  (req, _res, next) => {
    try {
      if (schemas.body) req.body = schemas.body.parse(req.body);
      if (schemas.query) {
        const parsed = schemas.query.parse(req.query);
        Object.defineProperty(req, "query", {
          value: parsed,
          configurable: true,
          enumerable: true,
          writable: true,
        });
      }
      if (schemas.params) {
        const parsed = schemas.params.parse(req.params);
        Object.defineProperty(req, "params", {
          value: parsed,
          configurable: true,
          enumerable: true,
          writable: true,
        });
      }
      next();
    } catch (err) {
      next(err);
    }
  };
