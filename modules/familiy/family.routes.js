import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { validate } from '../../middleware/validate.js';
import { createFamily } from './family.controller.js';
import { createFamilySchema } from './family.validation.js';

export const familyRouter = Router();

familyRouter.post('/', authenticate, validate(createFamilySchema),  createFamily);
// familyRouter.get('/', authenticate, listMyFamilies);
// familyRouter.get('/:familyId', authenticate, getFamilyDetails);
// familyRouter.patch('/:familyId', authenticate, updateFamilyDetails);
// familyRouter.get('/:familyId/members', authenticate, getFamilyMembers);
