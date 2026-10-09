import mongoose from 'mongoose';
import { cleanJson } from './_plugins.js';

export const LAYERS = ['L01', 'L02', 'L03', 'L04', 'L05', 'L06'];
/**
 * The copy for each layer. First person, and about what Vishal does there —
 * this is a portfolio, so every stratum has to describe him, not the site.
 * Served through GET /skills?grouped=true, so it is edited in one place.
 */
export const LAYER_META = {
  L01: {
    name: 'Interface',
    depth: 40,
    blurb:
      'I build the part people actually touch. Semantic markup, CSS I write by hand rather than pull from a kit, and React interfaces that stay fast as they grow.',
  },
  L02: {
    name: 'Motion',
    depth: 80,
    blurb:
      'I make interfaces feel like they have weight. Custom shaders, easing chosen rather than defaulted, and transitions that carry meaning instead of decorating.',
  },
  L03: {
    name: 'Service',
    depth: 120,
    blurb:
      'I build the APIs behind the screen. Node and Express, validated at the edge, and layered so the logic stays testable as the surface area grows.',
  },
  L04: {
    name: 'Data',
    depth: 168,
    blurb:
      'I model what everything else rests on. MongoDB schemas, indexes that match the queries actually being run, and shapes that survive the next feature.',
  },
  L05: {
    name: 'Runtime',
    depth: 208,
    blurb:
      'I containerise what I build, so it runs the same on my machine, on yours, and in production. Docker for the environment, Nginx in front of it.',
  },
  L06: {
    name: 'Delivery',
    depth: 240,
    blurb:
      'I ship it, and I keep it shipping. Git-based deploys, configuration driven entirely by environment, and releases that do not need babysitting.',
  },
};

/**
 * `layer` is what ties the database to the 3D scene: the swarm reads
 * skills grouped by layer and builds each stratum from real documents.
 */
const SkillSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, lowercase: true, unique: true },
    layer: { type: String, enum: LAYERS, required: true, index: true },
    category: {
      type: String,
      enum: ['frontend', 'backend', 'database', 'devops', 'tools', 'design'],
      required: true,
    },
    proficiency: { type: Number, min: 1, max: 5, default: 3 },
    years: { type: Number, min: 0, default: 0 },
    icon: { type: String, trim: true },
    color: { type: String, trim: true },
    featured: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
  },
  { timestamps: true, collection: 'skills' }
);

SkillSchema.index({ layer: 1, order: 1 });

export const Skill = mongoose.model('Skill', cleanJson(SkillSchema));
