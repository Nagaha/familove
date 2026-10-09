import { User } from './user.model.js';
import { ApiError } from '../../utils/errors.js';

const loadActiveUser = async (userId) => {
  const user = await User.findById(userId);
  if (!user || !user.isActive) {
    throw ApiError.unauthorized('Invalid or expired token');
  }
  return user;
};

export const getProfile = (userId) => loadActiveUser(userId);

export const updateProfile = async (userId, updates) => {
  const user = await loadActiveUser(userId);

  // Explicit allow-list assignment; never spread req.body into the document.
  if (updates.name !== undefined) user.name = updates.name;
  if (updates.avatarUrl !== undefined) user.avatarUrl = updates.avatarUrl;

  await user.save();
  return user;
};
