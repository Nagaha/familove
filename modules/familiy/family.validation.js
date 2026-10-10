import { z } from 'zod';

export const createFamilySchema = z.strictObject ({
    familyName: z
    .string()
    .trim()
    .min(1, 'Name must be a non-empty string')
    .max(100, 'Name must be at most 100 characters')
}) 
.refine((data) => Object.keys(data).length > 0, {
    message: 'Family name is required',
  });

export const joinFamilySchema = z.strictObject({
    inviteCode: z
    .string()
    .trim()
    .min(6, 'Invite code must be at least 6 characters')
});