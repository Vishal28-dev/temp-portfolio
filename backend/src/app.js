import express from 'express';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import pinoHttp from 'pino-http';
import path from 'node:path';

import { env, isDev } from './config/env.js';
import { logger } from './config/logger.js';
import { helmetMiddleware, corsMiddleware } from './middleware/security.js';
import { sanitize } from './middleware/sanitize.js';
import { apiLimiter } from './middleware/rateLimit.js';
import { notFound, errorHandler } from './middleware/error.js';
import routes from './routes/index.js';

export function createApp() {
  const app = express();

  // Behind nginx / Render — needed for correct client IPs in rate limiting.
  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  app.use(
    pinoHttp({
      logger,
      autoLogging: { ignore: (req) => req.url === `${env.API_PREFIX}/health` },
      customLogLevel: (_req, res, err) => {
        if (err || res.statusCode >= 500) return 'error';
        if (res.statusCode >= 400) return 'warn';
        return 'debug';
      },
    })
  );

  app.use(helmetMiddleware);
  app.use(corsMiddleware);
  app.use(compression());
  app.use(express.json({ limit: '256kb' }));
  app.use(express.urlencoded({ extended: true, limit: '256kb' }));
  app.use(cookieParser());
  app.use(sanitize);

  // Uploaded media (admin panel writes here).
  app.use(
    '/uploads',
    express.static(path.resolve(env.UPLOAD_DIR), {
      maxAge: isDev ? 0 : '30d',
      index: false,
      dotfiles: 'ignore',
    })
  );

  app.use(env.API_PREFIX, apiLimiter, routes);

  // Friendly root so hitting the bare host is not a 404.
  app.get('/', (_req, res) =>
    res.json({ ok: true, data: { service: 'portfolio-api', docs: `${env.API_PREFIX}/health` } })
  );

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
