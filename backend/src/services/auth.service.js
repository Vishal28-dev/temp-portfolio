import { User } from '../models/User.js';
import { verifyPassword } from '../utils/password.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/tokens.js';
import { ApiError } from '../utils/ApiError.js';

export async function login({ email, password }) {
  const user = await User.findOne({ email: String(email).toLowerCase() }).select('+passwordHash');

  // Same error either way — never reveal whether the address exists.
  const ok = user && user.active && (await verifyPassword(password, user.passwordHash));
  if (!ok) throw ApiError.unauthorized('That email or password is not right');

  user.lastLoginAt = new Date();
  await user.save();

  return {
    user: user.toJSON(),
    accessToken: signAccessToken(user),
    refreshToken: signRefreshToken(user, user.tokenVersion),
  };
}

export async function refresh(token) {
  if (!token) throw ApiError.unauthorized('No refresh token');

  let payload;
  try {
    payload = verifyRefreshToken(token);
  } catch {
    throw ApiError.unauthorized('Your session expired — sign in again');
  }

  const user = await User.findById(payload.sub);
  if (!user || !user.active) throw ApiError.unauthorized('Account is not available');
  if (user.tokenVersion !== payload.v) throw ApiError.unauthorized('Session was revoked');

  return {
    user: user.toJSON(),
    accessToken: signAccessToken(user),
    refreshToken: signRefreshToken(user, user.tokenVersion),
  };
}

/** Bumping tokenVersion invalidates every refresh token already issued. */
export async function revokeAll(userId) {
  await User.findByIdAndUpdate(userId, { $inc: { tokenVersion: 1 } });
}
