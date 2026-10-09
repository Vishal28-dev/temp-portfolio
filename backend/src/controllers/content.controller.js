import { asyncHandler } from '../utils/asyncHandler.js';
import { invalidateCache } from '../middleware/cache.js';
import * as content from '../services/content.service.js';

const ok = (res, data, extra = {}) => res.json({ ok: true, data, ...extra });

// ---------- profile ----------
export const getProfile = asyncHandler(async (_req, res) => ok(res, await content.getProfile()));

export const patchProfile = asyncHandler(async (req, res) => {
  const data = await content.updateProfile(req.body);
  invalidateCache();
  return ok(res, data);
});

// ---------- projects ----------
export const listProjects = asyncHandler(async (req, res) => {
  const { items, meta } = await content.listProjects(req.valid.query, { publicOnly: true });
  return ok(res, items, { meta });
});

export const getProject = asyncHandler(async (req, res) =>
  ok(res, await content.getProjectBySlug(req.params.slug, { publicOnly: true }))
);

export const adminListProjects = asyncHandler(async (req, res) => {
  const { items, meta } = await content.listProjects(req.valid.query, { publicOnly: false });
  return ok(res, items, { meta });
});

export const createProject = asyncHandler(async (req, res) => {
  const data = await content.createProject(req.body);
  invalidateCache();
  return res.status(201).json({ ok: true, data });
});

export const patchProject = asyncHandler(async (req, res) => {
  const data = await content.updateProject(req.params.id, req.body);
  invalidateCache();
  return ok(res, data);
});

export const deleteProject = asyncHandler(async (req, res) => {
  const data = await content.deleteProject(req.params.id);
  invalidateCache();
  return ok(res, data);
});

// ---------- skills ----------
export const listSkills = asyncHandler(async (req, res) =>
  ok(res, await content.listSkills(req.valid.query))
);

export const createSkill = asyncHandler(async (req, res) => {
  const data = await content.createSkill(req.body);
  invalidateCache();
  return res.status(201).json({ ok: true, data });
});

export const patchSkill = asyncHandler(async (req, res) => {
  const data = await content.updateSkill(req.params.id, req.body);
  invalidateCache();
  return ok(res, data);
});

export const deleteSkill = asyncHandler(async (req, res) => {
  const data = await content.deleteSkill(req.params.id);
  invalidateCache();
  return ok(res, data);
});

// ---------- experience ----------
export const listExperiences = asyncHandler(async (req, res) =>
  ok(res, await content.listExperiences(req.valid.query))
);

export const createExperience = asyncHandler(async (req, res) => {
  const data = await content.createExperience(req.body);
  invalidateCache();
  return res.status(201).json({ ok: true, data });
});

export const patchExperience = asyncHandler(async (req, res) => {
  const data = await content.updateExperience(req.params.id, req.body);
  invalidateCache();
  return ok(res, data);
});

export const deleteExperience = asyncHandler(async (req, res) => {
  const data = await content.deleteExperience(req.params.id);
  invalidateCache();
  return ok(res, data);
});
