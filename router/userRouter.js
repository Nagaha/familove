import { Router } from 'express';
import { createUser, addUserToFamily, joinFamilyByCode, getAllUsers } from '../controller/userController.js';
import { getMyNotifications } from '../controller/notificationController.js';

export const userRouter = Router();
userRouter.post('/', createUser);
userRouter.post('/add-to-family', addUserToFamily);
userRouter.post('/join-family', joinFamilyByCode);
userRouter.get('/', getAllUsers);
userRouter.get('/notifications', getMyNotifications);