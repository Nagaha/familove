import mongoose from 'mongoose';

// Legacy collection helper. It now reuses the single shared Mongoose connection
// so the app does not open a second MongoDB connection pool.
export const getMongoCollection = (collectionName) => {
  if (mongoose.connection.readyState !== 1 || !mongoose.connection.db) {
    throw new Error(
      'MongoDB is not connected. Ensure connectMongoose() runs before using collections.',
    );
  }

  return mongoose.connection.db.collection(collectionName);
};

export { connectMongoose as connectDB } from './mongoose.js';
