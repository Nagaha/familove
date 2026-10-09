import dotenv from 'dotenv';
import { parseDuration } from '../utils/duration.js';

dotenv.config();

const toInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const toBool = (value, fallback = false) => {
  if (value === undefined || value === '') return fallback;
  return String(value).toLowerCase() === 'true';
};

const toList = (value) =>
  String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const nodeEnv = process.env.NODE_ENV || 'development';
const isProduction = nodeEnv === 'production';

const refreshTokenExpiresIn = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';

export const env = {
  nodeEnv,
  isProduction,
  port: toInt(process.env.PORT, 3000),
  mongoUri: process.env.MONGODB_URI || process.env.CONNECTION_STRING || '',
  dbName: process.env.DB_NAME || 'familoveDB',
  userCollection: process.env.USER_COLLECTION_NAME || 'userCollection',
  clientOrigins: toList(process.env.CLIENT_ORIGINS),
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || '',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    algorithm: 'HS256',
    issuer: process.env.JWT_ISSUER || 'familove',
    audience: process.env.JWT_AUDIENCE || 'familove-client',
  },
  refreshTokenExpiresIn,
  refreshTokenTtlMs: parseDuration(refreshTokenExpiresIn, 7 * 24 * 60 * 60 * 1000),
  bcryptSaltRounds: toInt(process.env.BCRYPT_SALT_ROUNDS, 12),
  cookies: {
    refreshName: process.env.REFRESH_COOKIE_NAME || 'refreshToken',
    csrfName: process.env.CSRF_COOKIE_NAME || 'csrfToken',
    secure: toBool(process.env.COOKIE_SECURE, isProduction),
    sameSite: process.env.COOKIE_SAME_SITE || 'lax',
    domain: process.env.COOKIE_DOMAIN || undefined,
  },
};

export const assertRequiredEnv = () => {
  const missing = [];
  if (!env.mongoUri) missing.push('MONGODB_URI');
  if (!env.jwt.accessSecret) missing.push('JWT_ACCESS_SECRET');

  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  if (env.isProduction && env.jwt.accessSecret.length < 32) {
    throw new Error('JWT_ACCESS_SECRET must be at least 32 characters in production');
  }
};
