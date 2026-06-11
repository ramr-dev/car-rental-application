import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema, ZodError } from 'zod';

type Target = 'body' | 'query' | 'params';

// ─── validate() ───────────────────────────────────────────────────────────
// Middleware factory that validates req[target] against a Zod schema.
// On success, replaces the raw input with the parsed (and coerced) value.
// On failure, returns 422 with a structured error array.
//
// Usage:
//   router.post('/login', validate(loginSchema), controller.login)
//   router.get('/:id', validate(idParamSchema, 'params'), controller.getById)

export function validate(schema: ZodSchema, target: Target = 'body') {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[target]);

    if (!result.success) {
      const zodErr = result.error as ZodError;
      res.status(422).json({
        error: 'Validation failed',
        details: zodErr.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        })),
      });
      return;
    }

    console.log("check validation" , result.data);

    // Replace raw input with validated + coerced output
    (req as any)[target] = result.data;
    next();
  };
}
