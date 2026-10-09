import mongoose from 'mongoose';
import { env } from '../../config.js/env.js';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name must be at most 100 characters'],
    },

    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      unique: true,
      maxlength: [254, 'Email must be at most 254 characters'],
    },

    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
      select: false,
    },

    avatarUrl: {
      type: String,
      default: null,
      trim: true,
      maxlength: [2048, 'Avatar URL must be at most 2048 characters'],
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: env.userCollection,
  },
);

// Never leak the password hash through serialization.
userSchema.set('toJSON', {
  transform(_doc, ret) {
    delete ret.passwordHash;
    return ret;
  },
});

userSchema.statics.findByEmail = function findByEmail(email, { withPassword = false } = {}) {
  const query = this.findOne({ email: String(email ?? '').trim().toLowerCase() });
  return withPassword ? query.select('+passwordHash') : query;
};

export const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User;
