import mongoose from 'mongoose';
import { cleanJson } from './_plugins.js';

/** No cookies, no raw IPs, and every row self-destructs after 90 days. */
const VisitSchema = new mongoose.Schema(
  {
    path: { type: String, required: true, trim: true, maxlength: 300 },
    referrer: { type: String, trim: true, maxlength: 300 },
    device: { type: String, enum: ['desktop', 'tablet', 'mobile', 'unknown'], default: 'unknown' },
    sessionHash: { type: String, index: true },
    createdAt: { type: Date, default: Date.now },
  },
  { collection: 'visits', versionKey: false }
);

VisitSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });
VisitSchema.index({ path: 1, createdAt: -1 });

export const Visit = mongoose.model('Visit', cleanJson(VisitSchema));
