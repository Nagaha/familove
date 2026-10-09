import { z } from 'zod';

const isHttpUrl = (value) => {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

// Empty string is treated as "clear the avatar" (null).
const avatarUrlSchema = z.preprocess(
  (value) => (value === '' ? null : value),
  z.union([
    z
      .string()
      .trim()
      .max(2048, 'Avatar URL must be at most 2048 characters')
      .refine(isHttpUrl, { message: 'Avatar URL must be a valid http(s) URL' }),
    z.null(),
  ]),
);

// strictObject rejects any field outside this allow-list, including _id, email,
// passwordHash, isActive, createdAt and updatedAt.
export const updateMeSchema = z
  .strictObject({
    name: z
      .string()
      .trim()
      .min(1, 'Name must be a non-empty string')
      .max(100, 'Name must be at most 100 characters')
      .optional(),
    avatarUrl: avatarUrlSchema.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one of name or avatarUrl is required',
  });
