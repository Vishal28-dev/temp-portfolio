import { asyncHandler } from '../utils/asyncHandler.js';
import { isProd } from '../config/env.js';
import * as auth from '../services/auth.service.js';

const REFRESH_COOKIE = 'refresh_token';
const ACCESS_COOKIE = 'access_token';

const cookieBase = {
  httpOnly: true,
  sameSite: isProd ? 'none' : 'lax',
  secure: isProd,
  path: '/',
};

function setSession(res, { accessToken, refreshToken }) {
  res.cookie(ACCESS_COOKIE, accessToken, { ...cookieBase, maxAge: 15 * 60 * 1000 });
  res.cookie(REFRESH_COOKIE, refreshToken, { ...cookieBase, maxAge: 7 * 24 * 60 * 60 * 1000 });
}

export const login = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await auth.login(req.body);
  setSession(res, { accessToken, refreshToken });
  return res.json({ ok: true, data: { user, accessToken } });
});

export const refresh = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await auth.refresh(req.cookies?.[REFRESH_COOKIE]);
  setSession(res, { accessToken, refreshToken });
  return res.json({ ok: true, data: { user, accessToken } });
});

export const logout = asyncHandler(async (req, res) => {
  if (req.user?.id) await auth.revokeAll(req.user.id);
  res.clearCookie(ACCESS_COOKIE, cookieBase);
  res.clearCookie(REFRESH_COOKIE, cookieBase);
  return res.json({ ok: true, data: { signedOut: true } });
});

export const me = asyncHandler(async (req, res) => res.json({ ok: true, data: req.user }));
