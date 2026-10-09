import { Router } from 'express';
import { createFamily, getAllFamily, getMyFamily } from '../controller/familyController.js';


export const familyRouter = Router();

// router.get('/', getAllFamilies);
// router.get('/:id', getFamilyById);
familyRouter.post('/', createFamily);
familyRouter.get('/', getAllFamily);
familyRouter.get('/get-my-family', getMyFamily);

