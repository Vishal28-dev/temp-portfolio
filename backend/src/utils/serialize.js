/**
 * `.lean()` skips the schema's toJSON transform, so lean results would leak
 * `_id` / `__v` and never expose `id`. Every service that reads lean passes
 * its result through here so the API shape is identical either way.
 */
const isObjectId = (v) =>
  v !== null && typeof v === 'object' && typeof v.toHexString === 'function';

const HIDDEN = new Set(['__v', 'passwordHash', 'tokenVersion', 'ipHash']);

export function serialize(value) {
  if (Array.isArray(value)) return value.map(serialize);
  if (isObjectId(value)) return value.toHexString();
  if (value instanceof Date) return value.toISOString();
  if (value === null || typeof value !== 'object') return value;
  if (Buffer.isBuffer(value)) return value.toString('base64');

  const out = {};
  for (const [key, v] of Object.entries(value)) {
    if (HIDDEN.has(key)) continue;
    if (key === '_id') {
      out.id = serialize(v);
      continue;
    }
    out[key] = serialize(v);
  }
  return out;
}
