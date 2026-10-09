import mongoose from 'mongoose';
import { cleanJson } from './_plugins.js';

const SettingSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, trim: true },
    value: { type: mongoose.Schema.Types.Mixed },
    description: { type: String, trim: true },
  },
  { timestamps: true, collection: 'settings' }
);

export const Setting = mongoose.model('Setting', cleanJson(SettingSchema));
