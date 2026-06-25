import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
  {
    tokenHash: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true }
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      index: true
    },
    passwordHash: { type: String, required: true },
    passwordSalt: { type: String, required: true },
    sessions: { type: [sessionSchema], default: [] }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

export const User = mongoose.models.User || mongoose.model("User", userSchema);
