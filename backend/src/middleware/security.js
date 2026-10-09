import helmet from 'helmet';
import cors from 'cors';
import { env, isProd } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

export const helmetMiddleware = helmet({
  // The API serves JSON and uploaded media only; the SPA is served by nginx.
  contentSecurityPolicy: isProd
    ? { directives: { defaultSrc: ["'none'"], imgSrc: ["'self'", 'data:'], frameAncestors: ["'none'"] } }
    : false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  referrerPolicy: { policy: 'no-referrer' },
});

export const corsMiddleware = cors({
  origin(origin, cb) {
    // Same-origin / curl / server-to-server requests carry no Origin header.
    if (!origin) return cb(null, true);
    if (env.CORS_ORIGIN.includes(origin) || env.CORS_ORIGIN.includes('*')) return cb(null, true);
    return cb(ApiError.forbidden(`Origin ${origin} is not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  maxAge: 86400,
});
