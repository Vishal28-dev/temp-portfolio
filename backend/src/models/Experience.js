import mongoose from 'mongoose';
import { cleanJson } from './_plugins.js';

const ExperienceSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['work', 'education', 'freelance', 'volunteer'],
      required: true,
      index: true,
    },
    org: { type: String, required: true, trim: true },
    role: { type: String, required: true, trim: true },
    location: { type: String, trim: true },

    startDate: { type: Date, required: true },
    endDate: { type: Date, default: null }, // null = current

    summary: { type: String, trim: true },
    highlights: { type: [String], default: [] },
    stack: { type: [String], default: [] },

    logo: { type: String, trim: true },
    url: { type: String, trim: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true, collection: 'experiences' }
);

ExperienceSchema.virtual('current').get(function isCurrent() {
  return this.endDate === null || this.endDate === undefined;
});

ExperienceSchema.index({ type: 1, startDate: -1 });

export const Experience = mongoose.model('Experience', cleanJson(ExperienceSchema));
