import { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import { cacheJson } from '../../middleware/cache.js';
import { contactLimiter, guestbookLimiter } from '../../middleware/rateLimit.js';
import * as S from '../../validators/schemas.js';
import * as content from '../../controllers/content.controller.js';
import * as inbox from '../../controllers/inbox.controller.js';
import * as meta from '../../controllers/meta.controller.js';

const router = Router();

// ---- diagnostics ----
router.get('/health', meta.health);
router.get('/ready', meta.ready);
router.get('/meta', cacheJson(15), meta.meta);

// ---- content ----
router.get('/profile', cacheJson(120), content.getProfile);

router.get('/projects', validate({ query: S.listQuery }), cacheJson(60), content.listProjects);
router.get('/projects/:slug', validate({ params: S.slugParam }), cacheJson(60), content.getProject);

router.get('/skills', validate({ query: S.skillQuery }), cacheJson(120), content.listSkills);
router.get('/experiences', validate({ query: S.experienceQuery }), cacheJson(120), content.listExperiences);

// ---- interaction ----
router.post('/contact', contactLimiter, validate({ body: S.contactBody }), inbox.submitContact);

router.get('/guestbook', validate({ query: S.listQuery }), inbox.listGuestbook);
router.post('/guestbook', guestbookLimiter, validate({ body: S.guestbookBody }), inbox.signGuestbook);

router.post('/metrics/view', validate({ body: S.visitBody }), inbox.recordVisit);

export default router;
