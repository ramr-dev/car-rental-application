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

  // ── Security headers ────────────────────────────────────────────────────
  app.use(helmet());

  // ── CORS ────────────────────────────────────────────────────────────────
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
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
