import { z } from 'zod';

/**
 * Every configurable value in the API comes through here.
 * The schema is validated at import time — the process refuses to boot
 * with a missing or malformed secret rather than failing later at runtime.
 */

const csv = (fallback = []) =>
  z
    .string()
    .optional()
    .transform((v) =>
      v ? v.split(',').map((s) => s.trim()).filter(Boolean) : fallback
    );

const bool = (fallback) =>
  z
    .string()
    .optional()
    .transform((v) => (v === undefined ? fallback : /^(1|true|yes|on)$/i.test(v)));

const int = (fallback, { min = 0 } = {}) =>
  z
    .string()
    .optional()
    .transform((v) => (v === undefined || v === '' ? fallback : Number(v)))
    .pipe(z.number().int().min(min));

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: int(4000, { min: 1 }),
  API_PREFIX: z.string().default('/api/v1'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),

  MONGO_URI: z.string().min(1, 'MONGO_URI is required'),

  CORS_ORIGIN: csv(['http://localhost:5173']),

  JWT_ACCESS_SECRET: z.string().min(24, 'JWT_ACCESS_SECRET must be at least 24 characters'),
  JWT_REFRESH_SECRET: z.string().min(24, 'JWT_REFRESH_SECRET must be at least 24 characters'),
  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_REFRESH_TTL: z.string().default('7d'),

  ADMIN_EMAIL: z.string().email().optional(),
  ADMIN_PASSWORD: z.string().min(8).optional(),
  ADMIN_NAME: z.string().default('Admin'),

  IP_HASH_SALT: z.string().min(8, 'IP_HASH_SALT must be at least 8 characters'),

  RATE_LIMIT_WINDOW_MS: int(15 * 60 * 1000, { min: 1000 }),
  RATE_LIMIT_MAX: int(300, { min: 1 }),
  CONTACT_RATE_LIMIT_MAX: int(5, { min: 1 }),
  GUESTBOOK_RATE_LIMIT_MAX: int(3, { min: 1 }),

  ENABLE_GUESTBOOK: bool(true),
  ENABLE_ANALYTICS: bool(true),

  UPLOAD_DIR: z.string().default('uploads'),
  MAX_UPLOAD_BYTES: int(5 * 1024 * 1024, { min: 1024 }),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const detail = parsed.error.issues
    .map((i) => `  • ${i.path.join('.') || '(root)'}: ${i.message}`)
    .join('\n');
  console.error(`\nInvalid environment configuration:\n${detail}\n`);
  console.error('Copy .env.example to .env (or run `make env`) and try again.\n');
  process.exit(1);
}

export const env = Object.freeze(parsed.data);
export const isProd = env.NODE_ENV === 'production';
export const isDev = env.NODE_ENV === 'development';
