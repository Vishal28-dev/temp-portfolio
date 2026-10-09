import { z } from 'zod';
import { LAYERS } from '../models/Skill.js';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Not a valid id');
const slug = z.string().min(1).max(120).regex(/^[a-z0-9-]+$/, 'Use lowercase letters, numbers and dashes');

export const idParam = z.object({ id: objectId });
export const slugParam = z.object({ slug });

export const listQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  featured: z.enum(['true', 'false']).optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  tag: z.string().max(60).optional(),
  layer: z.enum(LAYERS).optional(),
  q: z.string().max(120).optional(),
  sort: z.string().max(60).optional(),
});

export const skillQuery = z.object({
  category: z.enum(['frontend', 'backend', 'database', 'devops', 'tools', 'design']).optional(),
  layer: z.enum(LAYERS).optional(),
  grouped: z.enum(['true', 'false']).optional(),
});

export const experienceQuery = z.object({
  type: z.enum(['work', 'education', 'freelance', 'volunteer']).optional(),
});

// ---------- contact ----------
export const contactBody = z.object({
  name: z.string().trim().min(2, 'Tell me your name').max(120),
  email: z.string().trim().email('That email address looks off').max(200),
  subject: z.string().trim().max(200).optional().default(''),
  message: z.string().trim().min(10, 'A little more detail, please').max(5000),
  // Anti-spam: must stay empty, and the form must have been open for a moment.
  website: z.string().max(0, 'Rejected').optional().default(''),
  elapsedMs: z.coerce.number().int().min(0).optional().default(0),
});

// ---------- guestbook ----------
export const guestbookBody = z.object({
  handle: z.string().trim().min(2).max(40),
  message: z.string().trim().min(2).max(240),
  website: z.string().max(0).optional().default(''),
});

// ---------- analytics ----------
export const visitBody = z.object({
  path: z.string().trim().min(1).max(300),
  referrer: z.string().trim().max(300).optional().default(''),
  device: z.enum(['desktop', 'tablet', 'mobile', 'unknown']).optional().default('unknown'),
});

// ---------- auth ----------
export const loginBody = z.object({
  email: z.string().trim().email().max(200),
  password: z.string().min(8).max(200),
});

// ---------- admin writes ----------
const mediaShape = z.object({
  url: z.string().trim().max(600).optional(),
  alt: z.string().trim().max(300).optional(),
  blurhash: z.string().trim().max(200).optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
});

export const projectBody = z.object({
  slug,
  title: z.string().trim().min(1).max(200),
  tagline: z.string().trim().max(300).optional(),
  summary: z.string().trim().max(600).optional(),
  body: z.string().max(50_000).optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  featured: z.boolean().optional(),
  order: z.number().int().optional(),
  layers: z.array(z.enum(LAYERS)).optional(),
  stack: z.array(z.object({ name: z.string().min(1).max(80), category: z.string().max(60).optional() })).optional(),
  tags: z.array(z.string().max(60)).optional(),
  links: z.object({
    live: z.string().trim().max(600).optional(),
    repo: z.string().trim().max(600).optional(),
    caseStudy: z.string().trim().max(600).optional(),
  }).optional(),
  media: z.object({
    cover: mediaShape.optional(),
    gallery: z.array(mediaShape).optional(),
    video: z.string().trim().max(600).optional(),
  }).optional(),
  metrics: z.array(z.object({ label: z.string().max(80), value: z.string().max(80) })).optional(),
  highlights: z.array(z.string().max(300)).optional(),
  role: z.string().trim().max(160).optional(),
  client: z.string().trim().max(160).optional(),
  year: z.number().int().min(1990).max(2100).optional(),
  duration: z.string().trim().max(80).optional(),
});

export const projectPatch = projectBody.partial();

export const skillBody = z.object({
  name: z.string().trim().min(1).max(80),
  slug,
  layer: z.enum(LAYERS),
  category: z.enum(['frontend', 'backend', 'database', 'devops', 'tools', 'design']),
  proficiency: z.number().int().min(1).max(5).optional(),
  years: z.number().min(0).max(60).optional(),
  icon: z.string().trim().max(300).optional(),
  color: z.string().trim().max(40).optional(),
  featured: z.boolean().optional(),
  order: z.number().int().optional(),
});
export const skillPatch = skillBody.partial();

export const profilePatch = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  initials: z.string().trim().max(4).optional(),
  headline: z.string().trim().max(300).optional(),
  roles: z.array(z.string().max(80)).optional(),
  bio: z.object({
    short: z.string().max(600).optional(),
    long: z.string().max(5000).optional(),
  }).optional(),
  location: z.string().trim().max(120).optional(),
  timezone: z.string().trim().max(80).optional(),
  availability: z.object({
    status: z.enum(['open', 'limited', 'closed']).optional(),
    note: z.string().max(300).optional(),
    openTo: z.array(z.string().max(80)).optional(),
  }).optional(),
  avatar: mediaShape.optional(),
  resume: z.object({ url: z.string().max(600).optional() }).optional(),
  socials: z.array(z.object({
    platform: z.string().min(1).max(60),
    label: z.string().max(60).optional(),
    url: z.string().min(1).max(600),
    handle: z.string().max(120).optional(),
    order: z.number().int().optional(),
  })).optional(),
  quote: z.string().trim().max(300).optional(),
  seo: z.object({
    title: z.string().max(200).optional(),
    description: z.string().max(400).optional(),
    ogImage: z.string().max(600).optional(),
    keywords: z.array(z.string().max(60)).optional(),
  }).optional(),
});

export const experienceBody = z.object({
  type: z.enum(['work', 'education', 'freelance', 'volunteer']),
  org: z.string().trim().min(1).max(160),
  role: z.string().trim().min(1).max(160),
  location: z.string().trim().max(160).optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().nullable().optional(),
  summary: z.string().max(1000).optional(),
  highlights: z.array(z.string().max(300)).optional(),
  stack: z.array(z.string().max(60)).optional(),
  logo: z.string().max(600).optional(),
  url: z.string().max(600).optional(),
  order: z.number().int().optional(),
});
export const experiencePatch = experienceBody.partial();

export const messagePatch = z.object({
  status: z.enum(['new', 'read', 'replied', 'spam']),
});
