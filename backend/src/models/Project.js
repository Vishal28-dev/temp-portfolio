import mongoose from 'mongoose';
import { cleanJson, MediaSchema } from './_plugins.js';
import { LAYERS } from './Skill.js';

const ProjectSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, trim: true, lowercase: true, unique: true },
    title: { type: String, required: true, trim: true },
    tagline: { type: String, trim: true },
    summary: { type: String, trim: true, maxlength: 600 },
    body: { type: String, default: '' }, // markdown

    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'draft',
      index: true,
    },
    featured: { type: Boolean, default: false },
    order: { type: Number, default: 0 },

    // Which strata this project surfaces in during the descent.
    layers: { type: [String], enum: LAYERS, default: [] },

    stack: {
      type: [
        {
          _id: false,
          name: { type: String, required: true },
          category: String,
        },
      ],
      default: [],
    },
    tags: { type: [String], default: [], index: true },

    links: {
      live: { type: String, trim: true },
      repo: { type: String, trim: true },
      caseStudy: { type: String, trim: true },
    },

    media: {
      cover: MediaSchema,
      gallery: { type: [MediaSchema], default: [] },
      video: { type: String, trim: true },
    },

    metrics: {
      type: [{ _id: false, label: String, value: String }],
      default: [],
    },
    highlights: { type: [String], default: [] },

    role: { type: String, trim: true },
    client: { type: String, trim: true },
    year: { type: Number },
    duration: { type: String, trim: true },

    views: { type: Number, default: 0 },
    publishedAt: { type: Date },
  },
  { timestamps: true, collection: 'projects' }
);

ProjectSchema.index({ status: 1, featured: -1, order: 1 });
ProjectSchema.index({ title: 'text', summary: 'text', tags: 'text' });

ProjectSchema.pre('save', function setPublishedAt(next) {
  if (this.isModified('status') && this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  next();
});

export const Project = mongoose.model('Project', cleanJson(ProjectSchema));
