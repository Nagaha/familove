import mongoose from "mongoose";
import { env } from "../../config.js/env.js";

const { Schema, model } = mongoose;

const memberSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    role: {
      type: String,
      enum: ["OWNER", "MEMBER"],
      default: "MEMBER",
      required: true
    },

    joinedAt: {
      type: Date,
      default: Date.now
    },

    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE"],
      default: "ACTIVE",
      required: true
    }
  },
  {
    _id: false
  }
);

const familySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 100
    },

    ownerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    members: {
      type: [memberSchema],
      default: []
    },

    inviteCode: {
      type: String,
      default: null,
      trim: true
    },

    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true,
    collection: env.familyCollection
  }
);

// Find families belonging to a user.
familySchema.index({
  "members.userId": 1,
  "members.status": 1
});

// Ensure non-null invite codes are unique.
familySchema.index(
  { inviteCode: 1 },
  {
    unique: true,
    partialFilterExpression: {
      inviteCode: { $type: "string" }
    }
  }
);

const Family = model("Family", familySchema);

export default Family;