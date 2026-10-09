/** Strips internals from every JSON response and exposes `id`. */
export function cleanJson(schema) {
  schema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform(_doc, ret) {
      ret.id = ret._id?.toString?.() ?? ret._id;
      delete ret._id;
      delete ret.passwordHash;
      delete ret.tokenVersion;
      return ret;
    },
  });
  return schema;
}

export const MediaSchema = {
  url: { type: String, trim: true },
  alt: { type: String, trim: true, default: '' },
  blurhash: { type: String, trim: true },
  width: Number,
  height: Number,
};
