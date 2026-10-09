import mongoose from 'mongoose';
import { asyncHandler } from '../utils/asyncHandler.js';
import { dbState } from '../config/db.js';
import { env } from '../config/env.js';
import { Project } from '../models/Project.js';
import { Skill } from '../models/Skill.js';
import { Guestbook } from '../models/Guestbook.js';
import { Visit } from '../models/Visit.js';

const startedAt = Date.now();

export const health = (_req, res) => {
  const db = dbState();
  const healthy = db.state === 'connected';
  res.status(healthy ? 200 : 503).json({
    ok: healthy,
    data: {
      status: healthy ? 'healthy' : 'degraded',
      uptimeSeconds: Math.round((Date.now() - startedAt) / 1000),
      env: env.NODE_ENV,
      db,
      timestamp: new Date().toISOString(),
    },
  });
};

export const ready = asyncHandler(async (_req, res) => {
  await mongoose.connection.db.admin().ping();
  res.json({ ok: true, data: { ready: true } });
});

/** Live counters for the readouts in the interface. */
export const meta = asyncHandler(async (_req, res) => {
  const [projects, skills, signatures, visits] = await Promise.all([
    Project.countDocuments({ status: 'published' }),
    Skill.countDocuments(),
    env.ENABLE_GUESTBOOK ? Guestbook.countDocuments({ approved: true }) : 0,
    env.ENABLE_ANALYTICS ? Visit.countDocuments() : 0,
  ]);

  res.json({
    ok: true,
    data: {
      counts: { projects, skills, signatures, visits },
      features: { guestbook: env.ENABLE_GUESTBOOK, analytics: env.ENABLE_ANALYTICS },
      node: process.version,
      uptimeSeconds: Math.round((Date.now() - startedAt) / 1000),
    },
  });
});
