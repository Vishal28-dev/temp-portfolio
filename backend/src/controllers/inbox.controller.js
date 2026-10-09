import { asyncHandler } from '../utils/asyncHandler.js';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import * as inbox from '../services/inbox.service.js';

export const submitContact = asyncHandler(async (req, res) => {
  const data = await inbox.createMessage(req.body, req);
  return res.status(201).json({
    ok: true,
    data,
    message: "Thanks — that's landed. I'll get back to you.",
  });
});

export const listMessages = asyncHandler(async (req, res) => {
  const { items, meta } = await inbox.listMessages(req.valid.query);
  return res.json({ ok: true, data: items, meta });
});

export const patchMessage = asyncHandler(async (req, res) =>
  res.json({ ok: true, data: await inbox.setMessageStatus(req.params.id, req.body.status) })
);

export const deleteMessage = asyncHandler(async (req, res) =>
  res.json({ ok: true, data: await inbox.deleteMessage(req.params.id) })
);

// ---------- guestbook ----------
export const signGuestbook = asyncHandler(async (req, res) => {
  if (!env.ENABLE_GUESTBOOK) throw ApiError.forbidden('The guestbook is closed right now');
  const data = await inbox.signGuestbook(req.body, req);
  return res.status(201).json({ ok: true, data });
});

export const listGuestbook = asyncHandler(async (req, res) => {
  if (!env.ENABLE_GUESTBOOK) return res.json({ ok: true, data: [], meta: { total: 0 } });
  const { items, meta } = await inbox.listGuestbook(req.valid.query);
  return res.json({ ok: true, data: items, meta });
});

// ---------- analytics ----------
export const recordVisit = asyncHandler(async (req, res) => {
  if (env.ENABLE_ANALYTICS) await inbox.recordVisit(req.body, req);
  return res.status(202).end();
});
