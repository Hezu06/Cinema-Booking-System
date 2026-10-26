import type { Request, Response, NextFunction } from "express";

export type AsyncRequestHandler<Req extends Request = Request> = (
  req: Req,
  res: Response,
  next: NextFunction,
) => Promise<unknown>;

/**
 * Wraps an async route handler so any rejected promise is automatically passed to next(error),
 * eliminating the need for repetitive try/catch blocks in controllers.
 */
export function asyncHandler<Req extends Request = Request>(fn: AsyncRequestHandler<Req>) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req as Req, res, next)).catch(next);
  };
}
