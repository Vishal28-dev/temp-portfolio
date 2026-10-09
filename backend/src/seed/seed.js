/**
 * Idempotent seed. Run with `make seed`, or `make seed-fresh` to wipe first.
 *
 * Projects use $setOnInsert, so re-running the seed never overwrites edits
 * made through /admin — it only fills in anything missing.
 */
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { connectDb, disconnectDb } from '../config/db.js';
import { hashPassword } from '../utils/password.js';

import { Profile } from '../models/Profile.js';
import { Skill } from '../models/Skill.js';
import { Project } from '../models/Project.js';
import { Experience } from '../models/Experience.js';
import { Message } from '../models/Message.js';
import { Guestbook } from '../models/Guestbook.js';
import { Setting } from '../models/Setting.js';
import { User } from '../models/User.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const load = async (f) => JSON.parse(await readFile(path.join(here, 'data', f), 'utf8'));

const FRESH = process.argv.includes('--fresh');

async function run() {
  await connectDb({ retries: 20, delayMs: 2000 });

  if (FRESH) {
    await Promise.all([
      Profile.deleteMany({}), Skill.deleteMany({}), Project.deleteMany({}),
      Experience.deleteMany({}), Message.deleteMany({}), Guestbook.deleteMany({}),
      Setting.deleteMany({}), User.deleteMany({}),
    ]);
    logger.warn('all collections cleared (--fresh)');
  }

  // ---- profile ----
  const profile = await load('profile.json');
  await Profile.updateOne({ key: 'primary' }, { $set: profile }, { upsert: true });
  logger.info('profile seeded');

  // ---- skills ----
  const skills = await load('skills.json');
  await Skill.bulkWrite(
    skills.map((s) => ({
      updateOne: { filter: { slug: s.slug }, update: { $set: s }, upsert: true },
    }))
  );
  logger.info({ count: skills.length }, 'skills seeded');

  // ---- projects ----
  const projects = await load('projects.json');
  await Project.bulkWrite(
    projects.map((pr) => ({
      updateOne: {
        filter: { slug: pr.slug },
        update: { $setOnInsert: { ...pr, publishedAt: new Date() } },
        upsert: true,
      },
    }))
  );
  logger.info({ count: projects.length }, 'projects seeded');

  // ---- settings ----
  const settings = await load('settings.json');
  await Setting.bulkWrite(
    settings.map((s) => ({
      updateOne: { filter: { key: s.key }, update: { $setOnInsert: s }, upsert: true },
    }))
  );
  logger.info({ count: settings.length }, 'settings seeded');

  // ---- admin user ----
  if (env.ADMIN_EMAIL && env.ADMIN_PASSWORD) {
    const email = env.ADMIN_EMAIL.toLowerCase();
    const existing = await User.findOne({ email });
    if (existing) {
      logger.info({ email }, 'admin user already exists — password left untouched');
    } else {
      await User.create({
        email,
        name: env.ADMIN_NAME,
        passwordHash: await hashPassword(env.ADMIN_PASSWORD),
        role: 'admin',
      });
      logger.info({ email }, 'admin user created');
    }
  } else {
    logger.warn('ADMIN_EMAIL / ADMIN_PASSWORD not set — no admin user created');
  }

  // ---- indexes ----
  await Promise.all(
    [Profile, Skill, Project, Experience, Message, Guestbook, Setting, User].map((m) =>
      m.syncIndexes().catch((e) => logger.warn({ model: m.modelName, err: e.message }, 'index sync skipped'))
    )
  );
  logger.info('indexes synced');

  const projectCount = await Project.countDocuments();
  logger.info({ projects: projectCount }, 'projects present');

  await disconnectDb();
  logger.info('seed complete');
}

run().catch(async (err) => {
  logger.fatal({ err }, 'seed failed');
  await disconnectDb().catch(() => {});
  process.exit(1);
});
