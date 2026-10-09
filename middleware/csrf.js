import { env } from '../config.js/env.js';
import { ApiError } from '../utils/errors.js';
import { safeEqual } from '../utils/tokens.js';

const CSRF_HEADER = 'x-csrf-token';

// Double-submit cookie CSRF protection. Only enforced when the refresh token is
// transported via cookie; mobile clients sending the token in the body are exempt.
export const requireCsrf = (req, _res, next) => {
  const refreshFromCookie = req.cookies?.[env.cookies.refreshName];

  if (!refreshFromCookie) {
    return next();
  }

  const headerToken = req.get(CSRF_HEADER);
  const cookieToken = req.cookies?.[env.cookies.csrfName];

  if (!headerToken || !cookieToken || !safeEqual(headerToken, cookieToken)) {
    return next(ApiError.forbidden('Invalid or missing CSRF token'));
  }

  next();
};
