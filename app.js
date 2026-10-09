import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import {connectDB, getMongoCollection} from './config.js/database.js';
import {familyRouter} from './router/familyRouter.js';
import {userRouter} from './router/userRouter.js';
import {mealRouter} from './router/mealRouter.js';
import { connectRabbitMQ } from './config.js/rabbitMQ.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());
app.use(express.static(join(__dirname, 'public')));

app.use('/family', familyRouter);
app.use('/user', userRouter);
app.use('/meal', mealRouter);


const start = async () => {
  await connectDB(); 
  await connectRabbitMQ(); 
  app.listen(port, () => {
    console.log(`Server running at port ${port}`);
  });
};

start();