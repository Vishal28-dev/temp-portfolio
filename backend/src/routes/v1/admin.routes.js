import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { validate } from '../../middleware/validate.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { env } from '../../config/env.js';
import { ApiError } from '../../utils/ApiError.js';
import * as S from '../../validators/schemas.js';
import * as content from '../../controllers/content.controller.js';
import * as inbox from '../../controllers/inbox.controller.js';

const router = Router();

// Everything below requires a signed-in admin.
router.use(requireAuth, requireRole('admin', 'editor'));

// ---- profile ----
router.patch('/profile', validate({ body: S.profilePatch }), content.patchProfile);

// ---- projects ----
router.get('/projects', validate({ query: S.listQuery }), content.adminListProjects);
router.post('/projects', validate({ body: S.projectBody }), content.createProject);
router.patch('/projects/:id', validate({ params: S.idParam, body: S.projectPatch }), content.patchProject);
router.delete('/projects/:id', validate({ params: S.idParam }), content.deleteProject);

// ---- skills ----
router.post('/skills', validate({ body: S.skillBody }), content.createSkill);
router.patch('/skills/:id', validate({ params: S.idParam, body: S.skillPatch }), content.patchSkill);
router.delete('/skills/:id', validate({ params: S.idParam }), content.deleteSkill);

// ---- experience ----
router.post('/experiences', validate({ body: S.experienceBody }), content.createExperience);
router.patch('/experiences/:id', validate({ params: S.idParam, body: S.experiencePatch }), content.patchExperience);
router.delete('/experiences/:id', validate({ params: S.idParam }), content.deleteExperience);

// ---- inbox ----
router.get('/messages', validate({ query: S.listQuery }), inbox.listMessages);
router.patch('/messages/:id', validate({ params: S.idParam, body: S.messagePatch }), inbox.patchMessage);
router.delete('/messages/:id', validate({ params: S.idParam }), inbox.deleteMessage);

// ---- media ----
const ALLOWED = new Set(['.png', '.jpg', '.jpeg', '.webp', '.avif', '.svg', '.gif', '.pdf']);

const upload = multer({
  storage: multer.diskStorage({
    destination: env.UPLOAD_DIR,
    filename: (_req, file, cb) =>
      cb(null, `${Date.now()}-${randomUUID().slice(0, 8)}${path.extname(file.originalname).toLowerCase()}`),
  }),
  limits: { fileSize: env.MAX_UPLOAD_BYTES, files: 1 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED.has(ext)) return cb(ApiError.badRequest(`${ext || 'That file type'} is not allowed`));
    return cb(null, true);
  },
});

router.post('/media', upload.single('file'), (req, res, next) => {
  if (!req.file) return next(ApiError.badRequest('No file was uploaded'));
  return res.status(201).json({
    ok: true,
    data: {
      url: `/uploads/${req.file.filename}`,
      bytes: req.file.size,
      mimetype: req.file.mimetype,
    },
  });
});

export default router;
