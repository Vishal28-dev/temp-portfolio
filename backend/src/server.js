import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { connectDb, disconnectDb } from './config/db.js';

const app = createApp();
let server;

async function start() {
  await connectDb();

  server = app.listen(env.PORT, '0.0.0.0', () => {
    logger.info(
      { port: env.PORT, env: env.NODE_ENV, prefix: env.API_PREFIX },
      'portfolio api listening'
    );
  });
}

async function shutdown(signal) {
  logger.info({ signal }, 'shutting down');

  const force = setTimeout(() => {
    logger.error('forced exit after 10s');
    process.exit(1);
  }, 10_000).unref();

  try {
    await new Promise((resolve) => (server ? server.close(resolve) : resolve()));
    await disconnectDb();
    clearTimeout(force);
    process.exit(0);
  } catch (err) {
    logger.error({ err }, 'shutdown failed');
    process.exit(1);
  }
}

['SIGTERM', 'SIGINT'].forEach((sig) => process.on(sig, () => shutdown(sig)));

process.on('unhandledRejection', (err) => {
  logger.error({ err }, 'unhandled rejection');
  shutdown('unhandledRejection');
});
process.on('uncaughtException', (err) => {
  logger.fatal({ err }, 'uncaught exception');
  process.exit(1);
});

start().catch((err) => {
  logger.fatal({ err }, 'failed to start');
  process.exit(1);
});
