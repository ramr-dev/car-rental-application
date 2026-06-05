import { PrismaClient } from '@prisma/client';
import { env } from '../config/env.js';

// Singleton Prisma client — one connection pool for the entire process.
export const prisma = new PrismaClient({
  log:
    env.NODE_ENV === 'development'
      ? ['query', 'error', 'warn']
      : ['error'],
});
