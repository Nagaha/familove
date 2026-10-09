import { asyncHandler } from '../../utils/asyncHandler.js';
import { getProfile, updateProfile } from './user.service.js';

const sanitize = (user) => ({
  id: String(user._id),
  name: user.name,
  email: user.email,
  avatarUrl: user.avatarUrl ?? null,
  isActive: user.isActive,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

export const getMe = asyncHandler(async (req, res) => {
  const user = await getProfile(req.user.id);
  res.status(200).json({ success: true, data: { user: sanitize(user) } });
});

export const updateMe = asyncHandler(async (req, res) => {
  const user = await updateProfile(req.user.id, req.validatedBody);
  res.status(200).json({ success: true, data: { user: sanitize(user) } });
});
