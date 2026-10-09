import mongoose from 'mongoose';
import { env, assertRequiredEnv } from './env.js';

let connectionPromise = null;

export const connectMongoose = async () => {
  assertRequiredEnv();

  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (connectionPromise) {
    return connectionPromise;
  }

  mongoose.set('strictQuery', true);

  connectionPromise = mongoose
    .connect(env.mongoUri, { dbName: env.dbName })
    .then(() => {
      console.log(`Connected to MongoDB (db: ${env.dbName})`);
      return mongoose.connection;
    })
    .catch((error) => {
      connectionPromise = null;
      console.error('Unable to connect to MongoDB:', error.message);
      throw error;
    });

  return connectionPromise;
};

export const disconnectMongoose = () => mongoose.disconnect();

export default mongoose;
