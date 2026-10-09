import mongoose from 'mongoose';
import { cleanJson } from './_plugins.js';

const UserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ['admin', 'editor'], default: 'admin' },
    active: { type: Boolean, default: true },
    tokenVersion: { type: Number, default: 0 }, // bumping this invalidates refresh tokens
    lastLoginAt: Date,
  },
  { timestamps: true, collection: 'users' }
);

export const User = mongoose.model('User', cleanJson(UserSchema));
