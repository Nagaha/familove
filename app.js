import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { connectMongoose } from './config.js/mongoose.js';
import { env } from './config.js/env.js';
import { connectRabbitMQ } from './config.js/rabbitMQ.js';
import { mealRouter } from './router/mealRouter.js';
import { authRouter } from './modules/auth/auth.routers.js';
import { usersRouter } from './modules/user/user.routes.js';
import { familyRouter  } from './modules/familiy/family.routes.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = env.port;

app.use(
  cors({
    credentials: true,
    origin: env.clientOrigins.length ? env.clientOrigins : true,
  }),
);
app.use(express.json());
app.use(cookieParser());
app.use(express.static(join(__dirname, 'public')));

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/users', usersRouter);
app.use('/api/v1/families', familyRouter);

// Existing routes are kept intact; their collection helpers now share the
// single Mongoose connection (see config.js/database.js).
// app.use('/family', familyRouter);
// app.use('/user', userRouter);
// app.use('/meal', mealRouter);

app.use(notFound);
app.use(errorHandler);

const start = async () => {
  try {
    await connectMongoose();
  } catch (error) {
    console.error('Failed to establish the MongoDB connection. Exiting.');
    process.exit(1);
  }

  try {
    await connectRabbitMQ();
  } catch (error) {
    // Auth does not depend on the message broker; start anyway.
    console.warn('RabbitMQ unavailable, continuing without it:', error.message);
  }

  app.listen(port, () => {
    console.log(`Server running at port ${port}`);
  });
};

start();
