import { z } from 'zod';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Normalizes (trim + lowercase) before validating the email format.
const emailSchema = z
  .string({ message: 'Email is required' })
  .trim()
  .toLowerCase()
  .max(254, 'Email must be at most 254 characters')
  .refine((value) => EMAIL_PATTERN.test(value), { message: 'A valid email is required' });

// bcrypt only considers the first 72 bytes, so cap input at 72 bytes.
const strongPasswordSchema = z
  .string({ message: 'Password is required' })
  .min(8, 'Password must be at least 8 characters')
  .refine((value) => Buffer.byteLength(value, 'utf8') <= 72, {
    message: 'Password must be at most 72 bytes',
  });

export const registerSchema = z.strictObject({
  name: z
    .string({ message: 'Name is required' })
    .trim()
    .min(1, 'Name is required')
    .max(100, 'Name must be at most 100 characters'),
  email: emailSchema,
  password: strongPasswordSchema,
});

export const loginSchema = z.strictObject({
  email: emailSchema,
  password: z.string({ message: 'Password is required' }).min(1, 'Password is required'),
});
