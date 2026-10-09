import { asyncHandler } from '../../utils/asyncHandler.js';
import {
  clearAuthCookies,
  readRefreshToken,
  setCsrfCookie,
  setRefreshCookie,
} from '../../utils/cookies.js';
import { generateOpaqueToken } from '../../utils/tokens.js';
import * as authService from './auth.service.js';

const requestMeta = (req) => ({
  ip: req.ip,
  userAgent: req.get('user-agent') || null,
});

// Browser clients receive the refresh token as an HttpOnly cookie; mobile clients
// opt in to receiving it in the response body for secure platform storage.
const isMobileClient = (req) =>
  String(req.get('x-client-platform') || '').toLowerCase() === 'mobile';

const issueBrowserCookies = (res, refreshToken) => {
  setRefreshCookie(res, refreshToken);
  setCsrfCookie(res, generateOpaqueToken());
};

export const registerUser = asyncHandler(async (req, res) => {
  const user = await authService.register(req.validatedBody);
  res.status(201).json({ success: true, data: { user } });
});

export const loginUser = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.login(
    req.validatedBody,
    requestMeta(req),
  );

  const data = { user, accessToken };

  if (isMobileClient(req)) {
    data.refreshToken = refreshToken;
  } else {
    issueBrowserCookies(res, refreshToken);
  }

  res.status(200).json({ success: true, data });
});

export const refreshToken = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.refresh(
    readRefreshToken(req),
    requestMeta(req),
  );

  const data = { user, accessToken };

  if (isMobileClient(req)) {
    data.refreshToken = refreshToken;
  } else {
    issueBrowserCookies(res, refreshToken);
  }

  res.status(200).json({ success: true, data });
});

export const logoutUser = asyncHandler(async (req, res) => {
  await authService.logout(readRefreshToken(req));
  clearAuthCookies(res);
  res.status(200).json({ success: true, data: { message: 'Logged out successfully' } });
});

export const logoutAllUser = asyncHandler(async (req, res) => {
  await authService.logoutAll(req.user.id);
  clearAuthCookies(res);
  res.status(200).json({ success: true, data: { message: 'Logged out from all sessions' } });
});
