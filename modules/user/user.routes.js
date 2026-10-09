import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { validate } from '../../middleware/validate.js';
import { updateMeSchema } from './user.validation.js';
import { getMe, updateMe } from './user.controller.js';

export const usersRouter = Router();

usersRouter.get('/me', authenticate, getMe);
usersRouter.patch('/me', authenticate, validate(updateMeSchema), updateMe);
