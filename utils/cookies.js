import { env } from '../config.js/env.js';

export const REFRESH_COOKIE_PATH = '/api/v1/auth';

const baseCookieOptions = () => ({
  secure: env.cookies.secure,
  sameSite: env.cookies.sameSite,
  ...(env.cookies.domain ? { domain: env.cookies.domain } : {}),
});

export const refreshCookieOptions = () => ({
  ...baseCookieOptions(),
  httpOnly: true,
  path: REFRESH_COOKIE_PATH,
  maxAge: env.refreshTokenTtlMs,
});

export const csrfCookieOptions = () => ({
  ...baseCookieOptions(),
  httpOnly: false,
  path: '/',
  maxAge: env.refreshTokenTtlMs,
});

export const setRefreshCookie = (res, token) => {
  res.cookie(env.cookies.refreshName, token, refreshCookieOptions());
};

export const setCsrfCookie = (res, token) => {
  res.cookie(env.cookies.csrfName, token, csrfCookieOptions());
};

export const clearAuthCookies = (res) => {
  res.clearCookie(env.cookies.refreshName, { ...refreshCookieOptions(), maxAge: undefined });
  res.clearCookie(env.cookies.csrfName, { ...csrfCookieOptions(), maxAge: undefined });
};

export const readRefreshToken = (req) =>
  req.cookies?.[env.cookies.refreshName] || req.body?.refreshToken || null;
