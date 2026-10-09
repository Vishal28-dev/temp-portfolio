import { createHash } from 'node:crypto';

/**
 * Small in-memory TTL cache for public GETs. Portfolio content changes rarely,
 * so this keeps Mongo idle and lets browsers revalidate cheaply with an ETag.
 *
 * `Cache-Control: no-cache` is deliberate: it means "revalidate", not "do not
 * cache". With `max-age` the browser would serve a stale list for the whole
 * TTL, so publishing from /admin appeared to do nothing for a minute. The
 * ETag still turns each revalidation into a 304, and the in-memory TTL still
 * keeps the request off Mongo.
 */
const store = new Map();

export const invalidateCache = (prefix) => {
  for (const key of store.keys()) {
    if (!prefix || key.startsWith(prefix)) store.delete(key);
  }
};

export const cacheJson = (ttlSeconds = 60) => (req, res, next) => {
  const key = `${req.method}:${req.originalUrl}`;
  const hit = store.get(key);
  const now = Date.now();

  if (hit && hit.expires > now) {
    res.set('ETag', hit.etag);
    res.set('Cache-Control', 'no-cache');
    res.set('X-Cache', 'HIT');
    if (req.headers['if-none-match'] === hit.etag) return res.status(304).end();
    return res.status(200).json(hit.payload);
  }

  const originalJson = res.json.bind(res);
  res.json = (payload) => {
    if (res.statusCode === 200) {
      const etag = `W/"${createHash('sha1').update(JSON.stringify(payload)).digest('base64')}"`;
      store.set(key, { payload, etag, expires: now + ttlSeconds * 1000 });
      res.set('ETag', etag);
      res.set('Cache-Control', 'no-cache');
      res.set('X-Cache', 'MISS');
      if (req.headers['if-none-match'] === etag) return res.status(304).end();
    }
    return originalJson(payload);
  };

  return next();
};
