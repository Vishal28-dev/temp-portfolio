import mongoose from 'mongoose';
import { cleanJson } from './_plugins.js';

/**
 * Each approved entry becomes a real point in the L06 Delivery stratum —
 * the position is derived from the document id so it is stable forever.
 */
const GuestbookSchema = new mongoose.Schema(
  {
    handle: { type: String, required: true, trim: true, maxlength: 40 },
    message: { type: String, required: true, trim: true, maxlength: 240 },
    point: {
      x: { type: Number, default: 0 },
      y: { type: Number, default: 0 },
      z: { type: Number, default: 0 },
    },
    color: { type: String, default: '#E8632A' },
    approved: { type: Boolean, default: true, index: true },
    ipHash: String,
  },
  { timestamps: true, collection: 'guestbook' }
);

GuestbookSchema.index({ approved: 1, createdAt: -1 });

export const Guestbook = mongoose.model('Guestbook', cleanJson(GuestbookSchema));
