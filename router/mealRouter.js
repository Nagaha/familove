import {Router} from 'express';
import { updateMealStatus } from '../controller/mealController.js';

export const mealRouter = Router();

mealRouter.put('/update-status', updateMealStatus);