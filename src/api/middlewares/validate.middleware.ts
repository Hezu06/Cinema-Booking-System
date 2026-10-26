import type { NextFunction, Request, Response } from "express";
import { ZodError, type ZodTypeAny } from "zod";
import { ValidationError } from "../../shared/errors/index.js";

export interface RequestValidationSchemas {
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  params?: ZodTypeAny;
}

/**
 * Pipes and Filters pattern: Reusable request validation middleware.
 * Intercepts incoming requests and validates params, query, and body using Zod schemas.
 * Replaces request attributes with transformed/sanitized values upon success.
 * Throws ValidationError immediately upon failure, halting request execution before controllers run.
 */
export function validateRequest(schemas: RequestValidationSchemas) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (schemas.params) {
        req.params = (await schemas.params.parseAsync(req.params)) as typeof req.params;
      }
      if (schemas.query) {
        const parsedQuery = (await schemas.query.parseAsync(req.query)) as typeof req.query;
        Object.defineProperty(req, "query", {
          value: parsedQuery,
          writable: true,
          enumerable: true,
          configurable: true,
        });
      }
      if (schemas.body) {
        req.body = await schemas.body.parseAsync(req.body);
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(new ValidationError("Dữ liệu yêu cầu không hợp lệ", error.issues));
        return;
      }
      next(error);
    }
  };
}

export const validateBody = (schema: ZodTypeAny) => validateRequest({ body: schema });
export const validateQuery = (schema: ZodTypeAny) => validateRequest({ query: schema });
export const validateParams = (schema: ZodTypeAny) => validateRequest({ params: schema });
