import mongoose from 'mongoose';
import { cleanJson } from './_plugins.js';

const MessageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 200 },
    subject: { type: String, trim: true, maxlength: 200 },
    body: { type: String, required: true, trim: true, maxlength: 5000 },

    status: {
      type: String,
      enum: ['new', 'read', 'replied', 'spam'],
      default: 'new',
      index: true,
    },
    spamScore: { type: Number, default: 0 },

    meta: {
      ipHash: String, // salted HMAC — never a raw address
      userAgent: String,
      referrer: String,
      locale: String,
    },
  },
  { timestamps: true, collection: 'messages' }
);

MessageSchema.index({ status: 1, createdAt: -1 });

export const Message = mongoose.model('Message', cleanJson(MessageSchema));
