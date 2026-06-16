import { createApp } from './app.js';
import { env } from './config/env.js';
import { prisma } from './lib/prisma.js';

async function main() {
  // Verify database connectivity before accepting requests
  await prisma.$connect();
  console.log('✅  Database connected');

  const app = createApp();

  const server = app.listen(env.PORT, () => {
    console.log(`🚀  DriveLux API running on port ${env.PORT}  [${env.NODE_ENV}]`);
    console.log(`   Health: http://localhost:${env.PORT}/api/health`);
  });

  // ── Graceful shutdown ───────────────────────────────────────────────────
  const shutdown = async (signal: string) => {
    console.log(`\n${signal} received — shutting down gracefully...`);
    server.close(async () => {
      await prisma.$disconnect();
      console.log('Server closed. Bye.');
      process.exit(0);
    });
    // Force exit if server hasn't closed within 10 s
    setTimeout(() => {
      console.error('Forced exit after timeout');
      process.exit(1);
    }, 10_000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // Log unhandled rejections instead of silently crashing
  process.on('unhandledRejection', (reason) => {
    console.error('Unhandled rejection:', reason);
  });
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
