import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

const base = {
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    ok: false,
    error: { code: 'RATE_LIMITED', message: 'Too many requests — please wait a moment.' },
  },
};

export const apiLimiter = rateLimit({
  ...base,
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  limit: env.RATE_LIMIT_MAX,
});

export const contactLimiter = rateLimit({
  ...base,
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  limit: env.CONTACT_RATE_LIMIT_MAX,
  message: {
    ok: false,
    error: {
      code: 'RATE_LIMITED',
      message: "You've sent a few messages already — try again in a little while.",
    },
  },
});

export const guestbookLimiter = rateLimit({
  ...base,
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  limit: env.GUESTBOOK_RATE_LIMIT_MAX,
});

export const authLimiter = rateLimit({
  ...base,
  windowMs: 15 * 60 * 1000,
  limit: 10,
  message: {
    ok: false,
    error: { code: 'RATE_LIMITED', message: 'Too many sign-in attempts. Try again later.' },
  },
});
