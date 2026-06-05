import type { Request, Response, NextFunction, RequestHandler } from 'express';

// Express 4 does not forward errors thrown inside async handlers automatically.
// Wrap every async controller with this so unhandled rejections reach the
// global error middleware instead of crashing the process.
//
// Usage:
//   router.post('/login', asyncHandler(controller.login))

type AsyncFn = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

export function asyncHandler(fn: AsyncFn): RequestHandler {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
}
