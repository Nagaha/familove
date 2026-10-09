import { User } from '../user/user.model.js';
import { RefreshSession } from './refresh-session.model.js';
import { ApiError } from '../../utils/errors.js';
import { env } from '../../config.js/env.js';
import { hashPassword, verifyPassword } from '../../utils/password.js';
import {
  generateRefreshToken,
  hashToken,
  newSessionId,
  signAccessToken,
} from '../../utils/tokens.js';

const INVALID_CREDENTIALS_MESSAGE = 'Invalid email or password';

// Valid bcrypt hash used to keep login timing constant when the email is unknown,
// so the response does not reveal whether an account exists.
const DUMMY_PASSWORD_HASH =
  '$2b$12$k2YUAhc8uVewZ7WbE18lcuCGKiCbySQreZo2DYX1yS/lta1p181XG';

const sessionExpiry = () => new Date(Date.now() + env.refreshTokenTtlMs);

const sessionMeta = (meta = {}) => ({
  userAgent: meta.userAgent ?? null,
  ip: meta.ip ?? null,
});

const sanitizeUser = (user) => ({
  id: String(user._id),
  name: user.name,
  email: user.email,
  avatarUrl: user.avatarUrl ?? null,
  isActive: user.isActive,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const createSession = async (userId, meta) => {
  const token = generateRefreshToken();

  const session = await RefreshSession.create({
    userId,
    sessionId: newSessionId(),
    tokenHash: hashToken(token),
    expiresAt: sessionExpiry(),
    ...sessionMeta(meta),
  });

  return { token, session };
};

const revokeFamily = async (sessionId) => {
  await RefreshSession.updateMany(
    { sessionId, revokedAt: null },
    { $set: { revokedAt: new Date() } },
  );
};

export const register = async ({ name, email, password }) => {
  const normalizedEmail = String(email).trim().toLowerCase();

  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    throw ApiError.conflict('An account with this email already exists');
  }

  const passwordHash = await hashPassword(password);

  try {
    const user = await User.create({ name, email: normalizedEmail, passwordHash });
    return sanitizeUser(user);
  } catch (error) {
    // Handles concurrent registration attempts for the same email.
    if (error?.code === 11000) {
      throw ApiError.conflict('An account with this email already exists');
    }
    throw error;
  }
};

export const login = async ({ email, password }, meta) => {
  const user = await User.findByEmail(email, { withPassword: true });

  if (!user) {
    await verifyPassword(password, DUMMY_PASSWORD_HASH).catch(() => false);
    throw ApiError.unauthorized(INVALID_CREDENTIALS_MESSAGE);
  }

  const passwordMatches = await verifyPassword(password, user.passwordHash);
  if (!passwordMatches) {
    throw ApiError.unauthorized(INVALID_CREDENTIALS_MESSAGE);
  }

  if (!user.isActive) {
    throw ApiError.forbidden('Account is inactive');
  }

  const accessToken = signAccessToken(user._id);
  const { token: refreshToken } = await createSession(user._id, meta);

  return { user: sanitizeUser(user), accessToken, refreshToken };
};

export const refresh = async (rawToken, meta) => {
  if (!rawToken) {
    throw ApiError.unauthorized('Refresh token is required');
  }

  const session = await RefreshSession.findOne({ tokenHash: hashToken(rawToken) });
  if (!session) {
    throw ApiError.unauthorized('Invalid or expired refresh token');
  }

  // A revoked session means this token was already rotated. Treat reuse as a
  // compromise and revoke the whole token family.
  if (session.revokedAt) {
    await revokeFamily(session.sessionId);
    throw ApiError.unauthorized('Refresh token reuse detected');
  }

  if (session.expiresAt.getTime() <= Date.now()) {
    await RefreshSession.deleteOne({ _id: session._id });
    throw ApiError.unauthorized('Invalid or expired refresh token');
  }

  const user = await User.findById(session.userId);
  if (!user || !user.isActive) {
    await revokeFamily(session.sessionId);
    throw ApiError.unauthorized('Invalid or expired refresh token');
  }

  // Rotate: create the replacement session first, then atomically revoke the old
  // one. If the atomic revoke finds the session already revoked, another request
  // won the race, so we roll back and treat it as reuse.
  const newToken = generateRefreshToken();
  const newSession = await RefreshSession.create({
    userId: session.userId,
    sessionId: session.sessionId,
    tokenHash: hashToken(newToken),
    expiresAt: sessionExpiry(),
    ...sessionMeta(meta),
  });

  const rotated = await RefreshSession.findOneAndUpdate(
    { _id: session._id, revokedAt: null },
    { $set: { revokedAt: new Date(), lastUsedAt: new Date(), replacedBy: newSession._id } },
  );

  if (!rotated) {
    await RefreshSession.deleteOne({ _id: newSession._id });
    await revokeFamily(session.sessionId);
    throw ApiError.unauthorized('Refresh token reuse detected');
  }

  return {
    user: sanitizeUser(user),
    accessToken: signAccessToken(user._id),
    refreshToken: newToken,
  };
};

export const logout = async (rawToken) => {
  if (!rawToken) return;

  await RefreshSession.updateOne(
    { tokenHash: hashToken(rawToken), revokedAt: null },
    { $set: { revokedAt: new Date(), lastUsedAt: new Date() } },
  );
};

export const logoutAll = async (userId) => {
  await RefreshSession.updateMany(
    { userId, revokedAt: null },
    { $set: { revokedAt: new Date() } },
  );
};
