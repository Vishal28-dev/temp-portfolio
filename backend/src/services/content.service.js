import { Profile } from '../models/Profile.js';
import { Project } from '../models/Project.js';
import { Skill, LAYER_META, LAYERS } from '../models/Skill.js';
import { Experience } from '../models/Experience.js';
import { Setting } from '../models/Setting.js';
import { buildPage, pageMeta } from '../utils/paginate.js';
import { ApiError } from '../utils/ApiError.js';
import { serialize } from '../utils/serialize.js';

// ---------------------------------------------------------------- profile
export async function getProfile() {
  const profile = await Profile.findOne({ key: 'primary' }).lean();
  if (!profile) throw ApiError.notFound('Profile has not been seeded yet — run `make seed`');
  return serialize(profile);
}

export async function updateProfile(patch) {
  const profile = await Profile.findOneAndUpdate(
    { key: 'primary' },
    { $set: patch },
    { new: true, upsert: true, runValidators: true }
  );
  return profile.toJSON();
}

// ---------------------------------------------------------------- projects
function projectFilter({ status, featured, tag, layer, q }, { publicOnly }) {
  const filter = {};
  if (publicOnly) filter.status = 'published';
  else if (status) filter.status = status;

  if (featured !== undefined) filter.featured = featured === 'true';
  if (tag) filter.tags = tag;
  if (layer) filter.layers = layer;
  if (q) filter.$text = { $search: q };
  return filter;
}

export async function listProjects(query = {}, { publicOnly = true } = {}) {
  const { limit, skip, page } = buildPage(query);
  const filter = projectFilter(query, { publicOnly });

  const sort = query.sort
    ? Object.fromEntries(
        query.sort.split(',').map((f) => (f.startsWith('-') ? [f.slice(1), -1] : [f, 1]))
      )
    : { featured: -1, order: 1, publishedAt: -1, createdAt: -1 };

  const [items, total] = await Promise.all([
    Project.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    Project.countDocuments(filter),
  ]);

  return { items: serialize(items), meta: pageMeta({ total, page, limit }) };
}

export async function getProjectBySlug(slug, { publicOnly = true } = {}) {
  const filter = publicOnly ? { slug, status: 'published' } : { slug };
  const project = await Project.findOne(filter).lean();
  if (!project) throw ApiError.notFound('No project with that slug');
  return serialize(project);
}

export const createProject = (data) => Project.create(data).then((d) => d.toJSON());

export async function updateProject(id, patch) {
  const doc = await Project.findById(id);
  if (!doc) throw ApiError.notFound('No project with that id');
  doc.set(patch);
  await doc.save();
  return doc.toJSON();
}

export async function deleteProject(id) {
  const doc = await Project.findByIdAndDelete(id);
  if (!doc) throw ApiError.notFound('No project with that id');
  return { id };
}

// ---------------------------------------------------------------- skills
export async function listSkills({ category, layer, grouped } = {}) {
  const filter = {};
  if (category) filter.category = category;
  if (layer) filter.layer = layer;

  const skills = serialize(
    await Skill.find(filter).sort({ layer: 1, order: 1, name: 1 }).lean()
  );
  if (grouped !== 'true') return skills;

  // Grouped by layer — this shape is what the 3D scene consumes.
  return LAYERS.map((code) => ({
    layer: code,
    ...LAYER_META[code],
    skills: skills.filter((s) => s.layer === code),
  }));
}

export const createSkill = (data) => Skill.create(data).then((d) => d.toJSON());

export async function updateSkill(id, patch) {
  const doc = await Skill.findByIdAndUpdate(id, { $set: patch }, { new: true, runValidators: true });
  if (!doc) throw ApiError.notFound('No skill with that id');
  return doc.toJSON();
}

export async function deleteSkill(id) {
  const doc = await Skill.findByIdAndDelete(id);
  if (!doc) throw ApiError.notFound('No skill with that id');
  return { id };
}

// ---------------------------------------------------------------- experience
export async function listExperiences({ type } = {}) {
  const filter = type ? { type } : {};
  const rows = serialize(await Experience.find(filter).sort({ startDate: -1, order: 1 }).lean());
  // `current` is a schema virtual, and virtuals do not survive .lean()
  return rows.map((r) => ({ ...r, current: r.endDate === null || r.endDate === undefined }));
}

export const createExperience = (data) => Experience.create(data).then((d) => d.toJSON());

export async function updateExperience(id, patch) {
  const doc = await Experience.findByIdAndUpdate(id, { $set: patch }, { new: true, runValidators: true });
  if (!doc) throw ApiError.notFound('No entry with that id');
  return doc.toJSON();
}

export async function deleteExperience(id) {
  const doc = await Experience.findByIdAndDelete(id);
  if (!doc) throw ApiError.notFound('No entry with that id');
  return { id };
}

// ---------------------------------------------------------------- settings
export async function getSettings() {
  const rows = await Setting.find().lean();
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}
