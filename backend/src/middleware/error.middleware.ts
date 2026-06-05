import type { Request, Response, NextFunction } from 'express';
import multer from 'multer';

// ─── AppError ──────────────────────────────────────────────────────────────
// Throw this anywhere in the request lifecycle to send a structured response.
// Express's global error handler picks it up via the 4-argument middleware.

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'AppError';
    // Capture a clean stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

// ─── Global error handler ──────────────────────────────────────────────────
// Must be registered LAST in app.ts (after all routes).
// The 4-parameter signature is required for Express to treat this as an error handler.

export function errorMiddleware(
  err: Error,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  // Multer file upload errors
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(422).json({ error: 'File must be under 10 MB.', code: 'FILE_TOO_LARGE' });
    } else {
      res.status(422).json({ error: err.message, code: 'UPLOAD_ERROR' });
    }
    return;
  }

  // Known application error
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.message,
      ...(err.code && { code: err.code }),
    });
    return;
  }

  // Prisma known request error (unique constraint, record-not-found, etc.)
  if (err.constructor.name === 'PrismaClientKnownRequestError') {
    const prismaErr = err as { code: string };
    if (prismaErr.code === 'P2002') {
      res.status(409).json({ error: 'A record with this value already exists.', code: 'DUPLICATE' });
      return;
    }
    if (prismaErr.code === 'P2025') {
      res.status(404).json({ error: 'Record not found.', code: 'NOT_FOUND' });
      return;
    }
  }

  // Prisma validation error
  if (err.constructor.name === 'PrismaClientValidationError') {
    res.status(400).json({ error: 'Invalid database query.', code: 'DB_VALIDATION' });
    return;
  }

  // Unexpected error — log and return a safe generic message
  console.error('[ERROR]', err);
  res.status(500).json({ error: 'Internal server error', code: 'INTERNAL' });
}
