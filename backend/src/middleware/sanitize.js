/**
 * Strips keys that mongo would interpret as operators ($gt, $where) or as
 * dotted paths. Express 5 exposes req.query through a getter, so it is
 * inspected and rejected rather than mutated in place.
 */
import { ApiError } from '../utils/ApiError.js';

const isDangerousKey = (k) => k.startsWith('$') || k.includes('.');

function scrub(value, depth = 0) {
  if (depth > 8 || value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map((v) => scrub(v, depth + 1));

  const out = {};
  for (const [k, v] of Object.entries(value)) {
    if (isDangerousKey(k)) continue;
    out[k] = scrub(v, depth + 1);
  }
  return out;
}

function hasDangerousKey(value, depth = 0) {
  if (depth > 8 || value === null || typeof value !== 'object') return false;
  if (Array.isArray(value)) return value.some((v) => hasDangerousKey(v, depth + 1));
  return Object.entries(value).some(
    ([k, v]) => isDangerousKey(k) || hasDangerousKey(v, depth + 1)
  );
}

export function sanitize(req, _res, next) {
  if (req.body && typeof req.body === 'object') req.body = scrub(req.body);
  if (req.params && typeof req.params === 'object') req.params = scrub(req.params);

  if (req.query && hasDangerousKey(req.query)) {
    return next(ApiError.badRequest('Query contains a disallowed key'));
  }
  return next();
}
