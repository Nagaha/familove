import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config.js/env.js';

export const signAccessToken = (userId) =>
  jwt.sign({}, env.jwt.accessSecret, {
    subject: String(userId),
    algorithm: env.jwt.algorithm,
    issuer: env.jwt.issuer,
    audience: env.jwt.audience,
    expiresIn: env.jwt.accessExpiresIn,
  });

export const verifyAccessToken = (token) =>
  jwt.verify(token, env.jwt.accessSecret, {
    algorithms: [env.jwt.algorithm],
    issuer: env.jwt.issuer,
    audience: env.jwt.audience,
  });

export const generateRefreshToken = () => crypto.randomBytes(48).toString('base64url');

export const generateOpaqueToken = () => crypto.randomBytes(32).toString('hex');

export const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

export const newSessionId = () => crypto.randomUUID();

export const safeEqual = (a, b) => {
  const bufferA = Buffer.from(String(a));
  const bufferB = Buffer.from(String(b));
  if (bufferA.length !== bufferB.length) return false;
  return crypto.timingSafeEqual(bufferA, bufferB);
};
