import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { env } from './config/env.js';
import { errorMiddleware } from './middleware/error.middleware.js';

// ── Module routers ─────────────────────────────────────────────────────────
import { authRouter } from './modules/auth/auth.routes.js';
import { vehicleRouter } from './modules/vehicles/vehicle.routes.js';
import { bookingRouter } from './modules/bookings/booking.routes.js';
import { userRouter } from './modules/users/user.routes.js';
import { adminRouter } from './modules/admin/admin.routes.js';
import { paymentRouter } from './modules/payments/payment.routes.js';
import { offerRouter } from './modules/offers/offer.routes.js';
import { reviewRouter } from './modules/reviews/reviews.routes.js';
import { gpsRouter } from './modules/gps/gps.routes.js';
import { razorpayRouter } from './modules/razorpay/razorpay.routes.js';
import { braintreeRouter } from './modules/braintree/braintree.routes.js';
import { hostRouter } from './modules/hosts/host.routes.js';

// ─── App factory ──────────────────────────────────────────────────────────
// Returns a configured Express application.
// Kept as a factory (not a singleton) to make future testing easy.

export function createApp() {
  const app = express();

  // Trust proxy for rate limiting (Render, AWS, Cloudflare, etc.)
  app.set('trust proxy', 1);

  // ── Security headers ────────────────────────────────────────────────────
  app.use(helmet());

  // ── CORS ────────────────────────────────────────────────────────────────
  const corsOrigins = env.CORS_ORIGIN.split(',').map((o) => o.trim());
  app.use(
    cors({
      origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
        // Allow requests with no origin (like mobile apps, curl, postman)
        if (!origin) return callback(null, true);
        if (corsOrigins.indexOf(origin) !== -1 || corsOrigins.includes('*')) {
          return callback(null, true);
        }
        if (env.NODE_ENV === 'development') {
          try {
            const url = new URL(origin);
            if (
              url.hostname === 'localhost' ||
              url.hostname === '127.0.0.1' ||
              url.hostname.startsWith('192.168.') ||
              url.hostname.startsWith('10.') ||
              url.hostname.startsWith('172.')
            ) {
              return callback(null, true);
            }
          } catch (e) {
            // Ignore malformed URL errors
          }
        }
        // Reject the origin cleanly without crashing the server
        return callback(null, false);
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }),
  );

  // ── Rate limiting ────────────────────────────────────────────────────────
  // Applies to all /api/* routes.
  // Auth endpoints get a stricter limit defined in auth.routes.ts.
  app.use(
    '/api',
    rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 200,
      standardHeaders: true,
      legacyHeaders: false,
      message: { error: 'Too many requests, please try again later.' },
    }),
  );

  // ── Body parsing ─────────────────────────────────────────────────────────
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // ── Compression ──────────────────────────────────────────────────────────
  app.use(compression());

  // ── Request logging ──────────────────────────────────────────────────────
  if (env.NODE_ENV !== 'test') {
    app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
  }

  // ── Static file serving (KYC uploads) ───────────────────────────────────
  app.use(
    '/uploads',
    helmet.crossOriginResourcePolicy({ policy: 'cross-origin' }),
    express.static(path.resolve('uploads')),
  );

  // ── Health check ─────────────────────────────────────────────────────────
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      env: env.NODE_ENV,
      timestamp: new Date().toISOString(),
    });
  });

  // ── Public configuration ───────────────────────────────────────────────────
  app.get('/api/config', async (_req, res) => {
    try {
      const { prisma } = await import('./lib/prisma.js');
      const rows = await prisma.appConfig.findMany();
      const config: Record<string, string> = {};
      rows.forEach((r) => {
        config[r.key] = r.value;
      });
      res.json({
        damage_protection_fee: Number(config['damage_protection_fee'] ?? 20),
        security_deposit_percent: Number(config['security_deposit_percent'] ?? 20),
        tax_rate: Number(config['tax_rate'] ?? 0.085),
        service_fee_rate: Number(config['service_fee_rate'] ?? 0.12),
        late_return_fee_per_hour: Number(config['late_return_fee_per_hour'] ?? 25),
        cancellation_fee_percent: Number(config['cancellation_fee_percent'] ?? 10),
        min_rental_days: Number(config['min_rental_days'] ?? 1),
        max_rental_days: Number(config['max_rental_days'] ?? 90),
        active_payment_gateway: config['active_payment_gateway'] ?? 'stripe',
      });
    } catch (e) {
      res.status(500).json({ error: 'Failed to load configuration' });
    }
  });

  // ── API routes ────────────────────────────────────────────────────────────
  app.use('/api/auth', authRouter);
  app.use('/api/vehicles', vehicleRouter);
  app.use('/api/bookings', bookingRouter);
  app.use('/api/users', userRouter);
  app.use('/api/admin', adminRouter);
  app.use('/api/payments', paymentRouter);
  app.use('/api/offers',   offerRouter);
  app.use('/api/reviews',  reviewRouter);
  app.use('/api/gps',      gpsRouter);
  app.use('/api/razorpay', razorpayRouter);
  app.use('/api/braintree', braintreeRouter);
  app.use('/api/hosts', hostRouter);

  // ── 404 handler ──────────────────────────────────────────────────────────
  app.use((_req, res) => {
    res.status(404).json({ error: 'Route not found' });
  });

  // ── Global error handler ─────────────────────────────────────────────────
  // Must be last — Express identifies error handlers by the 4-argument signature.
  app.use(errorMiddleware);

  return app;
}
