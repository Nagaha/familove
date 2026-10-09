import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { requireCsrf } from '../../middleware/csrf.js';
import { validate } from '../../middleware/validate.js';
import { loginSchema, registerSchema } from './auth.validation.js';
import {
  loginUser,
  logoutAllUser,
  logoutUser,
  refreshToken,
  registerUser,
} from './auth.controller.js';

export const authRouter = Router();

authRouter.post('/register', validate(registerSchema), registerUser);
authRouter.post('/login', validate(loginSchema), loginUser);
authRouter.post('/refresh', requireCsrf, refreshToken);
authRouter.post('/logout', requireCsrf, logoutUser);
authRouter.post('/logout-all', authenticate, logoutAllUser);
