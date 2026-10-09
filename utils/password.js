import bcrypt from 'bcryptjs';
import { env } from '../config.js/env.js';

export const hashPassword = (plainPassword) => bcrypt.hash(plainPassword, env.bcryptSaltRounds);

export const verifyPassword = (plainPassword, passwordHash) =>
  bcrypt.compare(plainPassword, passwordHash);
