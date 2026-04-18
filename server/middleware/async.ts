import { Request, Response, NextFunction, RequestHandler } from "express";

/**
 * Type-safe asyncHandler to wrap asynchronous Express routes.
 * Ensures any thrown errors or rejected promises are caught and passed to next().
 */
type AsyncHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<any>;

export const asyncHandler = (fn: AsyncHandler): RequestHandler => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
