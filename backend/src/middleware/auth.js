import { ApiError } from '../utils/ApiError.js';
import { verifyAccessToken } from '../utils/tokens.js';
import { User } from '../models/User.js';

const readToken = (req) => {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) return header.slice(7);
  return req.cookies?.access_token ?? null;
};

export async function requireAuth(req, _res, next) {
  try {
    const token = readToken(req);
    if (!token) throw ApiError.unauthorized('Sign in to continue');

    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch {
      throw ApiError.unauthorized('Your session expired — sign in again');
    }

    const user = await User.findById(payload.sub).lean();
    if (!user || !user.active) throw ApiError.unauthorized('Account is not available');

    req.user = { id: String(user._id), email: user.email, role: user.role, name: user.name };
    return next();
  } catch (err) {
    return next(err);
  }
}

export const requireRole =
  (...roles) =>
  (req, _res, next) => {
    if (!req.user) return next(ApiError.unauthorized('Sign in to continue'));
    if (!roles.includes(req.user.role)) return next(ApiError.forbidden());
    return next();
  };
