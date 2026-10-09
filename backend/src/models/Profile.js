import mongoose from 'mongoose';
import { cleanJson, MediaSchema } from './_plugins.js';

const SocialSchema = new mongoose.Schema(
  {
    platform: { type: String, required: true, trim: true },
    label: { type: String, trim: true },
    url: { type: String, required: true, trim: true },
    handle: { type: String, trim: true },
    order: { type: Number, default: 0 },
  },
  { _id: false }
);

const ProfileSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'primary', unique: true, immutable: true },

    name: { type: String, required: true, trim: true },
    initials: { type: String, trim: true, maxlength: 4 },
    headline: { type: String, trim: true },
    roles: { type: [String], default: [] },

    bio: {
      short: { type: String, trim: true },
      long: { type: String, trim: true },
    },

    location: { type: String, trim: true },
    timezone: { type: String, trim: true },

    availability: {
      status: { type: String, enum: ['open', 'limited', 'closed'], default: 'open' },
      note: { type: String, trim: true },
      openTo: { type: [String], default: [] },
    },

    avatar: MediaSchema,
    resume: { url: String, updatedAt: Date },

    socials: { type: [SocialSchema], default: [] },
    quote: { type: String, trim: true },

    seo: {
      title: String,
      description: String,
      ogImage: String,
      keywords: { type: [String], default: [] },
    },
  },
  { timestamps: true, collection: 'profiles' }
);

export const Profile = mongoose.model('Profile', cleanJson(ProfileSchema));
