import pino from 'pino';
import { createRequire } from 'node:module';
import { env, isProd } from './env.js';

// pino-pretty is a dev dependency; if it is not installed we log JSON rather
// than refusing to start.
let prettyTransport;
if (!isProd) {
  try {
    createRequire(import.meta.url).resolve('pino-pretty');
    prettyTransport = {
      target: 'pino-pretty',
      options: { colorize: true, translateTime: 'HH:MM:ss', ignore: 'pid,hostname' },
    };
  } catch {
    prettyTransport = undefined;
  }
}

export const logger = pino({
  level: env.LOG_LEVEL,
  base: undefined,
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'res.headers["set-cookie"]',
      '*.password',
      '*.passwordHash',
      '*.token',
    ],
    remove: true,
  },
  ...(prettyTransport ? { transport: prettyTransport } : {}),
});
