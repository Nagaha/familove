import mongoose from 'mongoose';

const refreshSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    // SHA-256 hash of the opaque refresh token. Raw tokens are never stored.
    tokenHash: {
      type: String,
      required: true,
      unique: true,
    },

    // Token family identifier. All rotations of the same login share this value,
    // which lets us revoke an entire family when reuse is detected.
    sessionId: {
      type: String,
      required: true,
      index: true,
    },

    // TTL index: docs are deleted shortly after expiry. Authorization still
    // checks expiresAt/revokedAt explicitly and never relies on TTL deletion.
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 },
    },

    revokedAt: {
      type: Date,
      default: null,
    },

    lastUsedAt: {
      type: Date,
      default: null,
    },

    replacedBy: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    userAgent: {
      type: String,
      default: null,
    },

    ip: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

refreshSessionSchema.index({ sessionId: 1, revokedAt: 1 });
refreshSessionSchema.index({ userId: 1, revokedAt: 1 });

export const RefreshSession =
  mongoose.models.RefreshSession || mongoose.model('RefreshSession', refreshSessionSchema);

export default RefreshSession;
