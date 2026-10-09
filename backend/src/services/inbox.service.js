import { Message } from '../models/Message.js';
import { Guestbook } from '../models/Guestbook.js';
import { Visit } from '../models/Visit.js';
import { hashIp } from '../utils/hashIp.js';
import { buildPage, pageMeta } from '../utils/paginate.js';
import { ApiError } from '../utils/ApiError.js';
import { serialize } from '../utils/serialize.js';

/**
 * Heuristics only — anything scoring 3+ is filed as spam rather than rejected,
 * so a false positive never silently loses a real message.
 */
function scoreSpam({ message, subject, elapsedMs, website }) {
  let score = 0;
  if (website) score += 5;                                   // honeypot filled
  if (elapsedMs > 0 && elapsedMs < 2000) score += 2;         // submitted too fast
  const linkCount = (message.match(/https?:\/\//g) ?? []).length;
  if (linkCount >= 3) score += 2;
  if (/\b(seo|crypto|casino|viagra|backlink)\b/i.test(`${subject} ${message}`)) score += 2;
  if (message.length < 20) score += 1;
  return score;
}

export async function createMessage(input, req) {
  const spamScore = scoreSpam(input);

  const doc = await Message.create({
    name: input.name,
    email: input.email,
    subject: input.subject || '(no subject)',
    body: input.message,
    status: spamScore >= 3 ? 'spam' : 'new',
    spamScore,
    meta: {
      ipHash: hashIp(req.ip),
      userAgent: String(req.get('user-agent') ?? '').slice(0, 300),
      referrer: String(req.get('referer') ?? '').slice(0, 300),
      locale: String(req.get('accept-language') ?? '').slice(0, 60),
    },
  });

  return { id: doc.id, receivedAt: doc.createdAt };
}

export async function listMessages(query = {}) {
  const { limit, skip, page } = buildPage(query);
  const filter = query.status ? { status: query.status } : {};
  const [items, total] = await Promise.all([
    Message.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Message.countDocuments(filter),
  ]);
  return { items: serialize(items), meta: pageMeta({ total, page, limit }) };
}

export async function setMessageStatus(id, status) {
  const doc = await Message.findByIdAndUpdate(id, { $set: { status } }, { new: true });
  if (!doc) throw ApiError.notFound('No message with that id');
  return doc.toJSON();
}

export async function deleteMessage(id) {
  const doc = await Message.findByIdAndDelete(id);
  if (!doc) throw ApiError.notFound('No message with that id');
  return { id };
}

// ---------------------------------------------------------------- guestbook
const PALETTE = ['#E8632A', '#F2C14E', '#4A8E99', '#EDE9DF', '#CF6A3A'];

export async function signGuestbook(input, req) {
  const seed = Math.random();
  const theta = seed * Math.PI * 2;
  const phi = Math.acos(2 * Math.random() - 1);
  const r = 1.0 + Math.random() * 1.6;

  const doc = await Guestbook.create({
    handle: input.handle,
    message: input.message,
    point: {
      x: +(r * Math.sin(phi) * Math.cos(theta)).toFixed(4),
      y: +(r * Math.cos(phi)).toFixed(4),
      z: +(r * Math.sin(phi) * Math.sin(theta)).toFixed(4),
    },
    color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
    ipHash: hashIp(req.ip),
  });

  return doc.toJSON();
}

export async function listGuestbook(query = {}) {
  const { limit, skip, page } = buildPage({ ...query, limit: query.limit ?? 50 });
  const filter = { approved: true };
  const [items, total] = await Promise.all([
    Guestbook.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit)
      .select('handle message point color createdAt').lean(),
    Guestbook.countDocuments(filter),
  ]);
  return { items: serialize(items), meta: pageMeta({ total, page, limit }) };
}

// ---------------------------------------------------------------- analytics
export async function recordVisit(input, req) {
  const ua = String(req.get('user-agent') ?? '');
  const day = new Date().toISOString().slice(0, 10);
  await Visit.create({
    path: input.path,
    referrer: input.referrer,
    device: input.device,
    sessionHash: hashIp(`${req.ip}:${ua}:${day}`),
  });
}
