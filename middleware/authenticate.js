import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/errors.js';
import { verifyAccessToken } from '../utils/tokens.js';
import { User } from '../modules/user/user.model.js';

export const authenticate = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    throw ApiError.unauthorized('Authentication required');
  }

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch {
    throw ApiError.unauthorized('Invalid or expired token');
  }

  const user = await User.findById(payload.sub).select('name email avatarUrl isActive');
  if (!user || !user.isActive) {
    throw ApiError.unauthorized('Invalid or expired token');
  }

  // Minimal authenticated identity. Trust only the verified token subject.
  req.user = {
    id: String(user._id),
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl,
  };

  next();
});
